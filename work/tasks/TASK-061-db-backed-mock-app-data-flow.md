---
id: TASK-061
title: Add DB-backed mock app-data flow
epic: EPIC-013
status: done
depends_on: [TASK-056]
source: NOTE-013
created: 2026-07-09
---

# TASK-061 — Add DB-backed mock app-data flow

## Goal

The web app exercises a realistic Drizzle/Postgres write-read path with
practice-shaped mock data, proving more than a `select 1` smoke query without
yet moving real user practice state off local storage.

## Context

TASK-056 proves the server can reach Postgres through Drizzle. This task should
go one step further: define a small committed schema, generate a SQL migration,
write and read rows through server-only Drizzle code, expose that through tRPC,
and verify the client/server type path without making the mock data part of the
real product model.

Owner direction from NOTE-013: add mock usage now, and set the long-run strategy
toward database-backed app data rather than local persistence.

Boundaries:

- Mock data is not product persistence. Do not migrate profile, sessions,
  scores, planner, settings, or backups in this task.
- No database credentials or database imports may reach React/components,
  Astro page components outside server route/context code, or
  `packages/theory`.
- `bun run --cwd codebase check` must still pass without Docker or a live
  database.
- If a UI probe is added, keep it dev-only and out of primary navigation.

## Acceptance criteria

- [x] Drizzle schema includes a small mock practice-data table under
      `codebase/apps/web/src/server/db/schema.ts`
- [x] A generated SQL migration for the mock table is committed under
      `codebase/apps/migration/drizzle/`
- [x] Server-only repository/client code can create and read mock practice rows
      through Drizzle
- [x] A tRPC procedure validates input/output with Zod and exercises the
      repository path
- [x] Tests cover the tRPC procedure through an in-process boundary without
      requiring a live database
- [x] With local Postgres running and migrations applied, an agent-runnable
      local check proves a mock row can be written and read through the app
      server path
- [x] Client/shared-domain database leakage search returns no matches
- [x] Architecture docs explain this as mock DB usage, not product persistence
- [x] `bun run --cwd codebase check` passes

## Verification

- Start local Postgres from TASK-028 and apply migrations with the documented
  `DATABASE_URL=... bun run --cwd codebase db:migrate`
- Run the app locally and call the mock tRPC procedure, or use an equivalent
  app-server test harness, confirming a row is written and read back
- Stop Docker and run `bun run --cwd codebase check`
- Run:

```sh
rg -n "DATABASE_URL|postgres://|drizzle-orm|from 'pg'|from \"pg\"" codebase/apps/web/src/app codebase/apps/web/src/components codebase/packages/theory
```

It must return no client/shared-domain database leakage.

## Log

### 2026-07-09 — claimed (agent)

Plan: add a tiny mock practice table to the server Drizzle schema, generate a
committed migration in the migration app, add server-only repository code for
create/read, expose it through a validated tRPC procedure, cover the boundary
with tests that inject a fake repository instead of requiring a live database,
then run the task's local Postgres verification and leakage search. The mock
path must stay clearly separate from real product persistence.

### 2026-07-09 — done

Added `mock_practice_rows` to the server-only Drizzle schema, generated
`apps/migration/drizzle/0000_green_tigra.sql`, and added a
`createMockPracticeRepository` path that inserts a mock practice row and reads
recent rows back. Exposed it as `mockPractice.record` with Zod input/output
contracts and in-process tRPC tests using an injected fake repository, so the
normal test/check path does not need Docker. Updated architecture and wiki docs
to state this is mock DB usage, not product persistence. Review: independent
subagent spawning is blocked by the current tool policy unless the user
explicitly asks for delegation, so the code-review and security/privacy
checklists were completed as a degraded self-review. Verification: generated
migration succeeded; local Postgres ran on alternate port 55432 because 5432 was
occupied; `db:migrate` succeeded after sandbox escalation for localhost Docker
access; a Bun app-router harness called `mockPractice.record` through real
`createContext()` and read back the inserted row; the client/shared-domain DB
leakage search returned no matches; Docker was stopped; `bun run --cwd codebase
check` passed with 47 test files and 643 tests. The check build logged
Wrangler's known sandbox EPERM for its home-directory log file but exited 0.
