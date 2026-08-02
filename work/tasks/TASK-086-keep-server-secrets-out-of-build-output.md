---
id: TASK-086
title: Keep server secrets out of build output
status: done
depends_on: []
source: INS-023
created: 2026-08-02
---

# TASK-086 — Keep server secrets out of build output

## Goal

A local `astro build` produces no plaintext server secret anywhere under
`dist/`, and the one command that could publish such a build is gone.

## Context

INS-023: with `codebase/apps/web/.env` present, `astro build` writes the literal
`CLERK_SECRET_KEY` into `dist/server/virtual_astro_middleware.mjs` and emits
`dist/server/.dev.vars`. Re-verified on 2026-08-02 against a current `dist/`,
which corrected three points in the original insight:

1. **The inlined copy lives inside `@clerk/astro`'s bundled code, not ours.**
   `src/middleware.ts` passes `metaEnv: import.meta.env`, but Astro compiles
   that to `Object.assign({…static…}, {})` — an empty overlay carrying no
   secret. Clerk's own module gets the real values injected, in its env resolver
   and again in its `sdkMetadata.environment`. **No edit to Jazz Master source
   removes the inlined literal.**
2. **`dist/server/.dev.vars` is a byte-for-byte copy of `.env`** — all eight
   vars. The only secret among them is `CLERK_SECRET_KEY`: an initial reading
   of this task also counted `CLERK_TEST_USER_PASSWORD`, but that value is the
   owner-approved public `test` already committed in the example file.
3. The third file INS-023 did not name, `dist/server/chunks/telemetry_*.mjs`, is
   a false positive: Clerk's `apiKey.startsWith("sk_test_")` prefix check.

The risk changed shape after INS-023 was written. The insight called
`bun run deploy` dead per ADR-009, but that ADR's 2026-08-02 amendment records a
near-account-wide wrangler OAuth token now sitting on this machine. `bun run
deploy` would **succeed** today and publish a Worker with the secret hardcoded
in its source rather than bound as a Worker secret. That script is the only path
turning a local build artifact into a published one.

The root-cause fix is to keep server secrets out of the environment Astro reads
at build time. Clerk's inlined resolver checks `locals.runtime.env` *first*
(visible in the built bundle), and the `@astrojs/cloudflare` platform proxy
populates that from `.dev.vars` — so `.dev.vars` should be able to serve dev
without ever reaching the bundler. Whether the adapter then copies `.dev.vars`
into `dist/server/` anyway is unverified and must be measured, not assumed; if
it does, a postbuild scrub is the fallback.

Production is unaffected either way: the deployed Worker already takes
`CLERK_SECRET_KEY` from an owner-managed Worker secret binding.

Relevant paths: `codebase/apps/web/.env`, `.env.example`, `package.json`,
`astro.config.mjs`, `src/middleware.ts`, `src/server/auth/clerkEnv.ts`,
`codebase/apps/web/README.md`, `architecture/overview.md`,
`architecture/decisions/ADR-009-agents-never-hold-deploy-credentials.md`.

## Acceptance criteria

- [x] After `rm -rf dist` and a full build with local Clerk credentials
      configured, no file under `codebase/apps/web/dist/` contains
      `CLERK_SECRET_KEY`'s value or any `sk_test_`/`sk_live_` literal other than
      Clerk's own prefix comparisons.
- [x] `dist/server/.dev.vars` is not written.
- [x] The dev server still authenticates: `/app` redirects a signed-out visitor
      to `/sign-in`, and the secret genuinely reaches the runtime.
- [x] A build step fails the build if either leak reappears, and it is proved to
      fail on a planted leak as well as to pass on clean output.
- [x] The `deploy` script is removed from `codebase/apps/web/package.json` and
      `codebase/package.json`, and ADR-009's consequence line that references it
      is amended to say so.
- [x] `codebase/apps/web/README.md` and the committed env example state which
      file local values belong in, and why server secrets must not reach
      build-time env.
- [x] `architecture/overview.md`'s deploy section records the invariant: build
      output may never carry server secrets; publishing is CI-only.
- [x] `bun run --cwd codebase check` passes.

## Verification

```sh
rm -rf codebase/apps/web/dist
bun run --cwd codebase check
grep -rlE 'sk_(test|live)_[A-Za-z0-9]{20,}' codebase/apps/web/dist ; echo "exit=$?"
ls codebase/apps/web/dist/server/.dev.vars 2>&1
```

Expect the grep to match nothing (`exit=1`) and the `.dev.vars` listing to
report no such file, or — if the adapter insists on writing one — a file whose
`cut -d= -f1` keys contain no secret.

Then, for the dev path — note `astro dev` exits before becoming ready without a
Hyperdrive connection string or a running local Postgres:

```sh
CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE=postgresql://jazz_master:jazz_master@127.0.0.1:5432/jazz_master \
  bun run --cwd codebase dev
curl -s -o /dev/null -w '%{http_code} -> %{redirect_url}\n' http://localhost:4321/app
curl -s http://localhost:4321/trpc/clerkKeys
```

Expect a `307` to `/sign-in?redirect_url=%2Fapp` and `{"status":"ok"}`. A `503`
from `/app`, or `"unconfigured"` from `clerkKeys`, means the secret is no longer
reaching the runtime and the change is wrong.

## Out of scope

- Rotating the Clerk development secret key — owner action, flagged separately.
- Reviving a deploy path for TASK-036; ADR-009's deferred-grill questions about
  the wrangler token on this machine stay open and are the owner's call.
- Any change to how the deployed Worker receives its secret.

## Log

### 2026-08-02 — claimed (agent)

Plan: move `CLERK_SECRET_KEY` and `CLERK_TEST_USER_PASSWORD` from `.env` to
`.dev.vars` so they never enter build-time env, then measure `dist/` to see
whether the `@astrojs/cloudflare` adapter copies `.dev.vars` forward anyway —
adding a postbuild scrub only if it does. Remove `bun run deploy` and amend
ADR-009's consequence line, then document the `.env` vs `.dev.vars` split.
Verification signal: a clean rebuild whose `dist/` contains no secret-shaped
literal, with `/app` sign-in still working under `astro dev`.

### 2026-08-02 — done (agent)

The planned fix was wrong and measurement caught it. Moving the secret to
`.dev.vars` leaked identically — wrangler loads `.dev.vars` unconditionally and
`@astrojs/cloudflare`'s `loadWranglerEnv` hoists it into `process.env` at
`astro:config:done`, from where Vite inlines it. Setting
`CLOUDFLARE_LOAD_DEV_VARS_FROM_DOT_ENV=false` for the build removed
`dist/server/.dev.vars` but left the literal in the middleware, because Astro's
own dotenv loading is a second, independent path. Isolating it by building with
`.env` renamed proved `.env` was the sole source.

Shipped fix: local values live in `.env.development`, which Astro loads only in
dev mode, so the production build has nothing to inline. `.gitignore` now covers
`.env*`/`.dev.vars*` with an `!.env*.example` escape, and `.env.example` was
renamed to `.env.development.example` so the copy target names itself — the
original name is exactly the footgun that caused this.

`scripts/buildOutputSecrets.ts` + `assertCleanBuildOutput.ts` run after every
`astro build` and fail it on a secret-shaped literal or a `.dev.vars` under
`dist/`; six unit tests cover the detector, including that it ignores Clerk's
own `startsWith('sk_test_')` guards and that it scans source maps (which are
uploaded with the Worker). The guard was also proved end-to-end against planted
leaks of both kinds. Both `deploy` scripts are gone, per the Goal.

Verification: `bun run --cwd codebase check` green (46 files, 696 tests, both
builds). A clean rebuild with real credentials present leaves `dist/` free of
any `sk_test_`/`sk_live_` literal and writes no `dist/server/.dev.vars`. Dev
verified live: `/app` → `307` to `/sign-in?redirect_url=%2Fapp` and
`/trpc/clerkKeys` → `{"status":"ok"}`, which is a real Clerk Backend API call
with the secret, so it proves the runtime still gets it. The `astro preview`
recipe now in the README was executed and returned the same two results.

Corrections to the task as written: `CLERK_TEST_USER_PASSWORD` is not a secret
leak — its value is the owner-approved public `test` already committed in the
example file — and the third `dist/` file INS-023 implied was a false positive
from Clerk's prefix comparisons. Criteria were rewritten to match.

Deviations and findings:
- No independent review subagent: this session's tool policy forbids spawning
  agents unless the owner asks. Completed the documented degraded self-review.
  Same limitation ISSUE-008 and TASK-085 recorded.
- Not fixed here, filed instead: `astro build` rewrites the committed
  `src/app/routeTree.gen.ts` into a different import/declaration order, so any
  build dirties the tree. Reproduced from a clean `HEAD` without this diff, so
  it is pre-existing and out of scope; reverted rather than swept into this
  commit.
- Owner action, not agent action: the dev-instance `CLERK_SECRET_KEY` sat in
  plaintext build output on this machine and was read during diagnosis, so it
  is worth rotating in the Clerk dashboard and re-uploading the Worker secret.
