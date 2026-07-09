---
id: TASK-055
title: Add Drizzle ORM and migration foundation
epic: EPIC-013
status: done
depends_on: [TASK-028]
research: RES-017
created: 2026-07-08
---

# TASK-055 — Add Drizzle ORM and migration foundation

## Goal

The web app has a server-only Drizzle schema and migration workflow that can run
against local Postgres during development and against the owner-provided
deployment database. Supersession: TASK-060 moved deployment migration execution
from Cloudflare Workers Builds to a dedicated Railway migration service.

## Context

RES-017 recommends `pg` + `drizzle-orm/node-postgres`, Drizzle Kit generated SQL
migrations, and build-step migrations. Runtime database access remains
server-only: React code and `packages/theory` must not import Drizzle, `pg`, or
database clients.

Original deployment contract, superseded by TASK-060:

- Local development runs migrations with the local `DATABASE_URL` from
  TASK-028.
- Cloudflare Workers Builds runs `db:migrate` before `check`/deploy using a
  build-only `DATABASE_URL` secret supplied by the owner.
- The Worker request path does not apply migrations.

Current deployment contract:

- Local development still runs migrations with the local `DATABASE_URL`.
- Railway runs deployment migrations through `apps/migration` with a
  service-scoped `DATABASE_URL`.
- Cloudflare Workers Builds does not run migrations and does not receive
  `DATABASE_URL`.
- The Worker request path does not apply migrations.

## Acceptance criteria

- [x] `drizzle-orm` and `pg` are app dependencies; `drizzle-kit` and `@types/pg`
      are dev dependencies in the Bun workspace
- [x] `codebase/apps/web/drizzle.config.ts` reads `DATABASE_URL`, uses
      `dialect: "postgresql"`, points at `src/server/db/schema.ts`, and writes
      migrations under `codebase/apps/web/drizzle/`
- [x] `codebase/apps/web/src/server/db/schema.ts` exists as the server schema
      entrypoint; no product persistence is moved to Postgres in this task
- [x] Root or web package scripts expose `db:generate`, `db:migrate`, and a
      documented local migration command using Bun
- [x] Generated SQL migration files are committed when schema changes require
      them; `drizzle-kit push` is not the default workflow
- [x] Architecture docs record the local and dev-deploy migration flow,
      including the Cloudflare Workers Builds command shape and owner-owned
      build secret
- [x] `bun run --cwd codebase check` passes without Docker running

## Verification

- With TASK-028 Postgres running and local `DATABASE_URL` set, run the documented
  `db:migrate` command and confirm it exits 0
- `bun run --cwd codebase check` passes with Docker stopped
- Search confirms database libraries are server-only:
  `rg -n "drizzle-orm|from 'pg'|from \"pg\"" codebase/apps/web/src/app codebase/apps/web/src/components codebase/packages/theory`
  returns no matches
- Review `architecture/overview.md` for the deploy-time migration contract:
  build-step migration with build-only `DATABASE_URL`, no runtime migration

## Log

### 2026-07-09 — claimed (agent)

Plan: add Drizzle and Postgres dependencies to the web workspace, create a
server-only schema entrypoint plus `drizzle.config.ts`, expose Bun migration
scripts from the workspace root/web package, document the local and Workers
Builds migration contract in architecture, then verify with local migration,
server-only import search, and `bun run --cwd codebase check`.

### 2026-07-09 — done

Added Drizzle migration infrastructure without moving product practice state:
web dependencies now include `drizzle-orm`/`pg`, dev dependencies include
`drizzle-kit`/`@types/pg`, root and web scripts expose `db:generate` and
`db:migrate`, `drizzle.config.ts` reads `DATABASE_URL`, and the server-only
schema entrypoint is intentionally empty until a future persistence task adds
tables. `drizzle-kit generate` created only `drizzle/meta/_journal.json`; no SQL
file was required because there are zero tables. Updated architecture and wiki
docs with the local migration command and Cloudflare Workers Builds contract:
`db:migrate` runs as a build step using an owner-owned build-only
`DATABASE_URL`; the Worker request path does not migrate. Review: independent
subagents are blocked by this session's tool policy, so the code-review and
security/privacy checklists were completed as a degraded self-review. Security
audit found GHSA-67mh-4wv8-2f99 in transitive dev-tooling `esbuild`; filed
`ISSUE-007` rather than expanding this task into dependency hygiene.
Verification: `db:generate` exited 0; Docker Postgres was started on alternate
host port 55432 because 5432 was occupied; `db:migrate` exited 0 after rerun
outside the sandbox so it could reach localhost; Docker was stopped; server-only
import search returned no matches; `bun run --cwd codebase check` passed with
Docker stopped, 46 test files and 632 tests.

### 2026-07-09 — superseded by TASK-060

The TASK-055 Cloudflare build-step migration contract was intentionally replaced:
deployment migrations now run from the Railway `apps/migration` service with
Railway-owned `DATABASE_URL`; Cloudflare Workers Builds only installs, checks,
builds, and deploys the Worker.
