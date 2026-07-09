---
id: TASK-064
title: Wire Hyperdrive binding into DB smoke runtime
epic: EPIC-013
status: done
depends_on: [TASK-056]
source: owner request 2026-07-09
created: 2026-07-09
---

# TASK-064 — Wire Hyperdrive binding into DB smoke runtime

## Goal

The deployed Worker can use the owner-created Hyperdrive binding for the
server-only Drizzle smoke check, while local/dev/test still degrade safely when
no binding or database URL is present.

## Context

The owner created the Cloudflare Hyperdrive configuration for Railway Postgres
and provided the config id `550beedd38384ddcac7dc1c044eede5d`. TASK-056 already
proved the server-side Drizzle smoke path with `DATABASE_URL`; this task wires
the deployed Worker path to Hyperdrive without putting database credentials in
the repo or on the development machine.

Boundaries:

- Do not add Railway credentials or connection strings to the repo.
- Do not run `wrangler login`; ADR-009 keeps Cloudflare credentials out of this
  machine.
- Product practice state remains local; this only changes the DB smoke path.
- Keep local tests/check green without a live Hyperdrive binding.

## Acceptance criteria

- [x] `apps/web/wrangler.jsonc` declares a `HYPERDRIVE` binding using the
      owner-provided Hyperdrive config id
- [x] The tRPC endpoint passes the Cloudflare Hyperdrive runtime binding into
      server context
- [x] The DB smoke client prefers the Hyperdrive connection string when present
      and falls back to `DATABASE_URL` for local verification
- [x] Tests cover the Hyperdrive binding path without requiring Cloudflare or
      Postgres
- [x] Architecture/wiki/agent docs describe the deployed Hyperdrive smoke path
      and still state that product practice state remains local
- [x] `bun run --cwd codebase check` passes

## Verification

- `bun run --cwd codebase test -- src/server/trpc/router.test.ts`
- `bun run --cwd codebase check`
- After Cloudflare Workers Builds deploys `main`, call:

```sh
curl https://jazz-master.premysl-ciompa.workers.dev/trpc/dbSmoke
```

Expected deployed result is `status: "ok"` if Hyperdrive can reach Railway; a
generic `status: "error"` means the binding reached the app but the DB query
failed; `status: "unconfigured"` means the binding was not present at runtime.

## Log

### 2026-07-09 — claimed (agent)
Plan: add the `HYPERDRIVE` binding id to `wrangler.jsonc`, pass `env.HYPERDRIVE`
from the Astro tRPC endpoint into `createContext`, and let the smoke client
prefer the binding connection string over local `DATABASE_URL`. Add small
ambient typing for `cloudflare:workers` so app typecheck knows only the binding
shape this repo uses, and cover the binding path with in-process tRPC tests.

### 2026-07-09 — done
Added the `HYPERDRIVE` binding with id `550beedd38384ddcac7dc1c044eede5d` to
the Worker config, passed `env.HYPERDRIVE` from the Astro tRPC endpoint into
server context, and changed the DB smoke client to prefer the Hyperdrive
connection string before falling back to local `DATABASE_URL`. Added pure tests
for Hyperdrive precedence and no-config behavior so the suite does not need
Cloudflare or Postgres.

Review: independent subagent review was not used because the available subagent
tool requires an explicit user delegation request; degraded self-review covered
scope, server/client boundaries, Cloudflare credential boundary, tests, and the
security/privacy checklist. No findings. Security/privacy checklist: no Railway
connection string or database credential was committed; the Hyperdrive id is a
binding identifier, not a password; database access remains server-only; product
practice state remains local.

Verification: `bun run --cwd codebase test -- src/server/db/smoke.test.ts
src/server/trpc/router.test.ts` passed; `bun run --cwd codebase typecheck`
passed; `bun run --cwd codebase check` passed with the known sandbox Wrangler
log-file EPERM message during build, exiting 0. Deployed endpoint verification
must run after this commit is pushed and Cloudflare Workers Builds deploys it.

Post-push verification: immediately after push, `/trpc/dbSmoke` still returned
`unconfigured` while Cloudflare Workers Builds caught up; after a short wait it
returned `{"status":"ok","checkedAt":"2026-07-09T08:43:10.285Z"}`, confirming
the deployed Worker is using the Hyperdrive-backed smoke path.
