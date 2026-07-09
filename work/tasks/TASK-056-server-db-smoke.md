---
id: TASK-056
title: Add server-side database smoke check through Drizzle
epic: EPIC-013
status: done
depends_on: [TASK-055]
research: RES-017
created: 2026-07-08
---

# TASK-056 — Add server-side database smoke check through Drizzle

## Goal

A server-only tRPC procedure can prove the app can reach Postgres through the
Drizzle client by running a read-only smoke query, without moving user practice
state to the server.

## Context

This follows TASK-055. It verifies the application-side database path after the
local database and Drizzle migration foundation exist.

Boundaries:

- No profile, session, score, planner, or settings data moves from local storage
  to Postgres in this task.
- The smoke procedure must be server-only and same-origin, matching the existing
  tRPC posture.
- `bun run --cwd codebase check` must not require Docker or a live database.
  Tests should use an in-process/mock boundary or cover graceful unavailable
  behavior when no database URL/binding is present.

## Acceptance criteria

- [x] Server database client construction lives under
      `codebase/apps/web/src/server/db/`
- [x] A tRPC smoke procedure runs `select 1` or equivalent through Drizzle when
      a database connection is configured
- [x] Missing local database configuration degrades predictably in dev/test and
      does not break app startup, local-first practice flows, or `bun run check`
- [x] No database credentials or direct database imports reach React,
      components, Astro page components outside server route/context code, or
      `packages/theory`
- [x] Architecture docs describe the app-side data path and explicitly state
      that product practice state remains local
- [x] `bun run --cwd codebase check` passes

## Verification

- With local Postgres running and migrations applied, call the smoke procedure
  locally and confirm it returns success
- Stop Docker and run `bun run --cwd codebase check`
- `rg -n "DATABASE_URL|postgres://|drizzle-orm|from 'pg'|from \"pg\"" codebase/apps/web/src/app codebase/apps/web/src/components codebase/packages/theory`
  returns no client/shared-domain database leakage

## Log

### 2026-07-09 — claimed (agent)
Plan: add a server-only DB client under `apps/web/src/server/db/` that builds a Drizzle/pg connection only when `DATABASE_URL` is present, expose it through tRPC context as an optional smoke dependency, and add a `dbSmoke` procedure that returns a configured/unavailable status without breaking dev/test startup. Tests will inject fake smoke clients through the in-process caller so `bun run --cwd codebase check` does not require Docker. Update architecture docs to describe the app-side smoke path and keep product practice state local. Verification signal: focused router tests, full check, leakage grep, and a local procedure call if Postgres is available.

### 2026-07-09 — done
Implemented `src/server/db/smoke.ts` with an optional Drizzle/pg smoke client, added `dbSmoke` to the root tRPC router, and kept the procedure safe when `DATABASE_URL` is missing by returning `unconfigured` rather than throwing. Tests inject fake smoke clients through the in-process caller and cover unconfigured, success, and generic failure output. Architecture overview and LOG now describe the server-only DB path and state that product practice state remains local.

Review: independent subagent review was not used because the available subagent tool requires an explicit user delegation request despite the repo's standing authorization; degraded self-review covered spec, server/client boundaries, tests, and the security/privacy checklist. No findings. Security/privacy checklist: no secrets committed, no user data moved, DB errors do not echo connection strings, and no browser/client DB imports were introduced.

Verification: `bun run --cwd codebase test -- src/server/trpc/router.test.ts` passed; `bun run --cwd codebase check` passed before and after stopping Docker (Wrangler printed the known sandbox log-file EPERM but exited 0); leakage grep returned no matches. Live DB check: default `5432` was occupied, so Postgres was started on `127.0.0.1:55432`; migration initially failed in the sandbox with `ECONNREFUSED`, then passed outside the sandbox with `DATABASE_URL=postgresql://jazz_master:jazz_master@127.0.0.1:55432/jazz_master bun run --cwd codebase db:migrate`; an in-process tRPC call with that `DATABASE_URL` returned `{"status":"ok"}` from `dbSmoke`. The container was stopped afterward.
