---
id: TASK-056
title: Add server-side database smoke check through Drizzle
epic: EPIC-013
status: backlog
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

- [ ] Server database client construction lives under
      `codebase/apps/web/src/server/db/`
- [ ] A tRPC smoke procedure runs `select 1` or equivalent through Drizzle when
      a database connection is configured
- [ ] Missing local database configuration degrades predictably in dev/test and
      does not break app startup, local-first practice flows, or `bun run check`
- [ ] No database credentials or direct database imports reach React,
      components, Astro page components outside server route/context code, or
      `packages/theory`
- [ ] Architecture docs describe the app-side data path and explicitly state
      that product practice state remains local
- [ ] `bun run --cwd codebase check` passes

## Verification

- With local Postgres running and migrations applied, call the smoke procedure
  locally and confirm it returns success
- Stop Docker and run `bun run --cwd codebase check`
- `rg -n "DATABASE_URL|postgres://|drizzle-orm|from 'pg'|from \"pg\"" codebase/apps/web/src/app codebase/apps/web/src/components codebase/packages/theory`
  returns no client/shared-domain database leakage
