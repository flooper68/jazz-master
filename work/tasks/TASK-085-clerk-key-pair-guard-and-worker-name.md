---
id: TASK-085
title: Reconcile the Worker name and guard against Clerk key-pair drift
status: done
depends_on: []
source: ISSUE-011
created: 2026-08-02
---

# TASK-085 — Reconcile the Worker name and guard against Clerk key-pair drift

## Goal

Make a Clerk publishable/secret key mismatch on the deployed Worker detectable
by a single probe instead of by a user hitting a bare 500.

## Context

ISSUE-011: the deployed site returned HTTP 500 for every browser request for
three weeks because `wrangler.jsonc`'s committed `PUBLIC_CLERK_PUBLISHABLE_KEY`
moved to a new Clerk instance while the out-of-band `CLERK_SECRET_KEY` Worker
secret stayed on the old one. Two structural gaps let it persist:

1. **Worker name.** `codebase/apps/web/wrangler.jsonc` declares
   `"name": "jazz-master-web"`, but the deployed Worker — the one Cloudflare
   Workers Builds publishes to, and the one serving
   `jazz-master.premysl-ciompa.workers.dev` — is named `jazz-master`. No
   `jazz-master-web` Worker exists in the account. Every repo-local wrangler
   command silently targets a Worker that is not there, and a bare
   `wrangler deploy` would create a second one at a different URL.

2. **No key-pair check.** The publishable key is committed; the secret key is
   set out-of-band on the Worker. Nothing couples them and no test, build step,
   or probe compares them. The app makes no other Clerk Backend API call, so
   `/trpc/health`, `/trpc/dbSmoke`, and the `/app` → `/sign-in` redirect all
   stayed green while auth was fully broken.

A secret key does not encode its instance, so the comparison cannot be static —
it needs a runtime call to Clerk. It also cannot run at build time: Workers
Builds has no access to the Worker's runtime secrets. The check therefore has to
execute *inside* the deployed Worker, which makes a public tRPC smoke procedure
the natural home — `dbSmoke` is the existing precedent for exactly this shape.

Relevant code: `src/server/trpc/routers/system.ts`, `src/server/trpc/context.ts`,
`src/server/trpc/router.ts`, `src/pages/trpc/[trpc].ts`,
`src/server/observability/logger.ts`, `src/server/auth/clerkEnv.ts`.

## Acceptance criteria

- [x] `wrangler.jsonc` names the Worker `jazz-master`, matching the deployed
      Worker; a repo-local `wrangler secret list` (no `--name`) resolves.
- [x] A `clerkKeys` public tRPC procedure reports whether the runtime
      publishable key and secret key resolve to the same Clerk instance,
      returning a sanitized discriminated union (`ok` | `unconfigured` |
      `mismatch` | `error`) with no key material, instance IDs, or raw
      Clerk errors in the response body.
- [x] The instance-comparison logic is a pure, unit-tested function; the network
      client is injectable so tests never call Clerk.
- [x] A mismatch is logged through the existing structured logger, mirroring
      `logDatabaseSmoke`.
- [x] `codebase/apps/web/README.md` and `work/REGRESSION.md` document the
      post-deploy probe: the browser-shaped landing-page check that ISSUE-011's
      plain-curl probing missed, plus `/trpc/clerkKeys`.
- [x] `bun run --cwd codebase check` passes.

## Verification

```sh
bun run --cwd codebase check
```

Against the deployed Worker after the next push to `main`:

```sh
curl -s https://jazz-master.premysl-ciompa.workers.dev/trpc/clerkKeys
curl -s -o /dev/null -w '%{http_code} %{num_redirects}\n' -L \
  -H 'Accept: text/html' -H 'Sec-Fetch-Dest: document' \
  https://jazz-master.premysl-ciompa.workers.dev/
```

Expect `status: "ok"` from the first and `200` from the second. To prove the
check actually catches the ISSUE-011 condition, the unit tests must cover the
mismatch branch — the deployed environment is now consistent and cannot
demonstrate it without breaking the site.

## Log

### 2026-08-02 — claimed (agent)

Plan: point `wrangler.jsonc` at the real Worker name, then add a `clerkKeys`
public tRPC procedure modelled on `dbSmoke` that compares the signing keys the
publishable key's Frontend API serves against the ones the secret key
authenticates to at Clerk's Backend API. A secret key does not encode its
instance and Workers Builds cannot see runtime secrets, so the check has to run
inside the deployed Worker — a static or build-time comparison is impossible.
Verification signal: the ISSUE-011 key pair must report `mismatch` and the
current pair `ok`.

### 2026-08-02 — done (agent)

Shipped both gaps. `wrangler.jsonc` now names the Worker `jazz-master`.
`/trpc/clerkKeys` returns `ok` | `unconfigured` | `mismatch` | `error`, statuses
only; the comparison lives in pure functions in
`src/server/auth/clerkKeyPair.ts` with an injectable fetch, and mismatches emit
`clerk.keys.completed` with `errorKind: instance_mismatch`. README gained a
"two keys must belong to the same Clerk instance" section; REGRESSION.md gained
DEPLOY-01 as a P0 scenario for any deploy that changes Clerk keys, vars, or
secrets.

Verification: `bun run --cwd codebase check` green. Beyond the unit layer, both
branches were proved end-to-end in workerd against real Clerk via
`wrangler dev`: `/trpc/clerkKeys` → `{"status":"ok"}` with the current `.env`
pair, and → `{"status":"mismatch", ...}` plus an `instance_mismatch` log line
when the publishable key was swapped for the `popular-mouse-86` key recovered
from commit 040e56f — the exact ISSUE-011 condition. The deployed-probe half of
the Verification section cannot run until this commit reaches `main` and
Workers Builds deploys it; it is DEPLOY-01 in the regression pack.

Review finding, fixed before commit: the procedure must stay public (it has to
answer precisely when auth is broken), so every caller would have made the
Worker issue two outbound Clerk requests — an amplification path that could
rate-limit the Clerk instance the check exists to protect. The client now holds
its result for 60s and is built once per isolate rather than per request;
failures are not cached so a transient outage retries.

Deviations:
- No independent review subagent: this session's harness forbids spawning
  agents unless the owner asks, despite the standing authorization in
  `processes/code-review.md`. Completed the documented degraded self-review.
  Same limitation ISSUE-008 recorded.
- Discovered, filed as INS-023 rather than fixed here: with a local `.env`
  present, `astro build` inlines `CLERK_SECRET_KEY` into
  `dist/server/virtual_astro_middleware.mjs` and writes `dist/server/.dev.vars`.
  Confirmed pre-existing by rebuilding from HEAD without this diff. `dist/` is
  gitignored and Workers Builds has no `.env`, so nothing leaks to git or to
  the deployed Worker, but a local `bun run deploy` would upload a bundle with
  the secret baked in.
