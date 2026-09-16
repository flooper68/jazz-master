# Jazz Master Web App

## Clerk authentication

The Astro app uses `@clerk/astro` middleware for authentication. `/` is public;
`/app/*` requires a signed-in Clerk user, and protected tRPC procedures read the
Clerk user ID from Astro locals.

Local values live in the gitignored `codebase/apps/web/.env.development`. Copy
`.env.development.example` and fill it in. If a Clerk setup provides a
framework-specific `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, map its value to Clerk
Astro's `PUBLIC_CLERK_PUBLISHABLE_KEY`; Jazz Master does not read the Next.js
variable name.

```sh
PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_SIGN_IN_URL=/sign-in
CLERK_SIGN_UP_URL=/sign-up
CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/app
CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/app
CLERK_TEST_USER_EMAIL=premysl.ciompa+test@gmail.com
CLERK_TEST_USER_PASSWORD=test
```

### Why `.env.development`, and never `.env`

Astro loads `.env` in *every* mode, including the production build, and
`@clerk/astro` reads `import.meta.env[name]` dynamically — which forces Vite to
inline the whole env object, secret included, as a literal in
`dist/server/virtual_astro_middleware.mjs`. The Cloudflare adapter compounds it
by resolving `.env`/`.dev.vars` through wrangler and re-emitting them as
`dist/server/.dev.vars`. Either way a local build ends up holding a plaintext
`CLERK_SECRET_KEY` (INS-023, TASK-086).

`.env.development` is loaded only in dev mode, so the production build has
nothing to inline. **Do not create `.env` or `.dev.vars` in this package** — both
are read at build time and put the secret straight back into `dist/`.
`scripts/assertCleanBuildOutput.ts` runs after every `astro build` and fails
the build if it finds a secret-shaped literal or a `.dev.vars` in the output;
that check is the backstop, not the fix.

Consequence for the Workers-runtime preview: `astro preview` and `wrangler dev`
serve the built worker and read `.env`/`.dev.vars`, which no longer carry the
secret. Pass it through the process environment instead:

```sh
set -a && . ./.env.development && set +a
CLOUDFLARE_INCLUDE_PROCESS_ENV=true \
CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE=postgresql://jazz_master:jazz_master@127.0.0.1:5432/jazz_master \
  bun run preview
```

`astro dev` initializes Hyperdrive with the local-only connection in
`wrangler.jsonc` by default. Set the Hyperdrive variable to override its port or
database. Postgres must be running for real application data calls; static
Storybook previews and builds do not query it.

When either value is missing, public routes still respond, but `/app/*` returns
a controlled 503 because sign-in cannot be initialized. Clerk keyless
development mode is not used. The URL values keep Clerk on Jazz Master's
app-hosted Astro auth pages when Account Portal is disabled. `/sign-in` and
`/sign-up` render Clerk's prebuilt UI, so Clerk Dashboard settings own enabled
password recovery, MFA/2FA, and required session-task prompts.

Required production Worker secrets/bindings:

```sh
PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
CLERK_SIGN_IN_URL=/sign-in
CLERK_SIGN_UP_URL=/sign-up
CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/app
CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/app
```

`PUBLIC_CLERK_PUBLISHABLE_KEY` is also committed in `wrangler.jsonc` as a
public Worker var; `CLERK_SECRET_KEY` must remain a Worker secret and must not be
committed. Local Wrangler runs take it from the process environment as shown
above, not from a `.dev.vars`. The deployed Worker secret is owner-managed in
Cloudflare; agents do not run `wrangler login` or commit it (ADR-009, and its
2026-08-02 amendment recording where that no longer holds).

### The two keys must belong to the same Clerk instance

Because the publishable key is committed and the secret key is set out-of-band,
they can drift onto different Clerk instances. When they do, Clerk's handshake
verification fails and `@clerk/backend` rethrows it — for development instances
it does not degrade to signed-out — so **every browser request returns a bare
500, including the public landing page** (ISSUE-011).

Nothing else in the app calls the Clerk Backend API, so plain `curl` probes,
`/trpc/health`, `/trpc/dbSmoke`, and the `/app` → `/sign-in` redirect all keep
returning 200 while auth is completely broken. Two checks catch it — run both
after any deploy that changed Clerk keys:

```sh
# 1. The key-pair check, executed inside the Worker.
curl -s https://jazz-master.premysl-ciompa.workers.dev/trpc/clerkKeys

# 2. A browser-shaped landing-page request. Both parts matter: without the
#    headers Clerk skips the handshake and the probe passes against a broken
#    site; without the cookie jar the handshake can never complete and even a
#    healthy site redirects forever.
JAR=$(mktemp)
curl -s -o /dev/null -w '%{http_code} %{num_redirects}\n' -L -c "$JAR" -b "$JAR" \
  -H 'Accept: text/html' -H 'Sec-Fetch-Dest: document' \
  https://jazz-master.premysl-ciompa.workers.dev/
```

Expect `"status":"ok"` and `200` after ~3 redirects. A `"status":"mismatch"` means the deployed
secret belongs to a different Clerk app than the committed publishable key; fix
it by uploading the secret key from the Clerk app whose Frontend API host
matches the decoded publishable key.

### Worker name

The deployed Worker is `jazz-master` (serving
`jazz-master.premysl-ciompa.workers.dev`), and `wrangler.jsonc` must keep that
name. It read `jazz-master-web` until ISSUE-011, so repo-local wrangler commands
silently targeted a Worker that does not exist and a bare `wrangler deploy`
would have created a second one at a different URL.

## Dedicated Clerk test account

`premysl.ciompa+test@gmail.com` is the dedicated Jazz Master Clerk user for
manual regression and any real-Clerk automated scenario. It is test data: its
profile, sessions, scores, and preferences may be reset or overwritten by
tests, and it must never be used as a production user.

The intentionally public test credential is `test`, committed as
`CLERK_TEST_USER_PASSWORD` in `.env.development.example`; `CLERK_TEST_USER_EMAIL` carries
the documented email. This owner-approved exception is safe only while the
account remains disposable, contains no private data, and has no elevated
privileges. Rotate or remove the credential before changing any of those
conditions.

Clerk's current compromised-password protection rejects `test` for interactive
password sign-in. Keep the value committed as requested, but use an emailed OTP
or a short-lived Clerk Backend API sign-in token for real-Clerk regression until
the owner changes the tenant policy or test password. The default Playwright
smoke pack continues to use the production-disabled synthetic auth seam for
parallel isolation; tests that specifically validate Clerk identity use this
dedicated account.

`dbSmoke` remains a public observability probe for deployed database
connectivity. It does not carry user data; real app data goes through protected
tRPC procedures scoped by Clerk user ID.
