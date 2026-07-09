---
id: TASK-061
title: Add DB-backed mock app-data flow
epic: EPIC-013
status: backlog
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

- [ ] Drizzle schema includes a small mock practice-data table under
      `codebase/apps/web/src/server/db/schema.ts`
- [ ] A generated SQL migration for the mock table is committed under
      `codebase/apps/migration/drizzle/`
- [ ] Server-only repository/client code can create and read mock practice rows
      through Drizzle
- [ ] A tRPC procedure validates input/output with Zod and exercises the
      repository path
- [ ] Tests cover the tRPC procedure through an in-process boundary without
      requiring a live database
- [ ] With local Postgres running and migrations applied, an agent-runnable
      local check proves a mock row can be written and read through the app
      server path
- [ ] Client/shared-domain database leakage search returns no matches
- [ ] Architecture docs explain this as mock DB usage, not product persistence
- [ ] `bun run --cwd codebase check` passes

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
