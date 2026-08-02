---
id: TASK-085
title: Reconcile the Worker name and guard against Clerk key-pair drift
status: backlog
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

- [ ] `wrangler.jsonc` names the Worker `jazz-master`, matching the deployed
      Worker; a repo-local `wrangler secret list` (no `--name`) resolves.
- [ ] A `clerkKeys` public tRPC procedure reports whether the runtime
      publishable key and secret key resolve to the same Clerk instance,
      returning a sanitized discriminated union (`ok` | `unconfigured` |
      `mismatch` | `error`) with no key material, instance IDs, or raw
      Clerk errors in the response body.
- [ ] The instance-comparison logic is a pure, unit-tested function; the network
      client is injectable so tests never call Clerk.
- [ ] A mismatch is logged through the existing structured logger, mirroring
      `logDatabaseSmoke`.
- [ ] `codebase/apps/web/README.md` and `work/REGRESSION.md` document the
      post-deploy probe: the browser-shaped landing-page check that ISSUE-011's
      plain-curl probing missed, plus `/trpc/clerkKeys`.
- [ ] `bun run --cwd codebase check` passes.

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
