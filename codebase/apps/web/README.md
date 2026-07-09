# Jazz Master Web App

## Clerk authentication

The Astro app uses `@clerk/astro` middleware for authentication. `/` is public;
`/app/*` requires a signed-in Clerk user, and protected tRPC procedures read the
Clerk user ID from Astro locals.

Required local Clerk values can live in the repo-root `.env` used by the owner:

```sh
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

The web app itself reads `codebase/apps/web/.env` during Astro dev/preview. That
file is gitignored and may be generated from the root `.env`; it must expose the
publishable key under Clerk Astro's `PUBLIC_` name:

```sh
PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_SIGN_IN_URL=/sign-in
CLERK_SIGN_UP_URL=/sign-up
CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/app
CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/app
```

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
committed.

`dbSmoke` remains a public observability probe for deployed database
connectivity. It does not carry user data; real app data goes through protected
tRPC procedures scoped by Clerk user ID.
