---
id: TASK-055
title: Add Drizzle ORM and migration foundation
epic: EPIC-013
status: backlog
depends_on: [TASK-028]
research: RES-017
created: 2026-07-08
---

# TASK-055 — Add Drizzle ORM and migration foundation

## Goal

The web app has a server-only Drizzle schema and migration workflow that can run
against local Postgres during development and against the owner-provided dev
deployment database during Cloudflare Workers Builds.

## Context

RES-017 recommends `pg` + `drizzle-orm/node-postgres`, Drizzle Kit generated SQL
migrations, and build-step migrations. Runtime database access remains
server-only: React code and `packages/theory` must not import Drizzle, `pg`, or
database clients.

Deployment contract:

- Local development runs migrations with the local `DATABASE_URL` from
  TASK-028.
- Cloudflare Workers Builds runs `db:migrate` before `check`/deploy using a
  build-only `DATABASE_URL` secret supplied by the owner.
- The Worker request path does not apply migrations.

## Acceptance criteria

- [ ] `drizzle-orm` and `pg` are app dependencies; `drizzle-kit` and `@types/pg`
      are dev dependencies in the Bun workspace
- [ ] `codebase/apps/web/drizzle.config.ts` reads `DATABASE_URL`, uses
      `dialect: "postgresql"`, points at `src/server/db/schema.ts`, and writes
      migrations under `codebase/apps/web/drizzle/`
- [ ] `codebase/apps/web/src/server/db/schema.ts` exists as the server schema
      entrypoint; no product persistence is moved to Postgres in this task
- [ ] Root or web package scripts expose `db:generate`, `db:migrate`, and a
      documented local migration command using Bun
- [ ] Generated SQL migration files are committed when schema changes require
      them; `drizzle-kit push` is not the default workflow
- [ ] Architecture docs record the local and dev-deploy migration flow,
      including the Cloudflare Workers Builds command shape and owner-owned
      build secret
- [ ] `bun run --cwd codebase check` passes without Docker running

## Verification

- With TASK-028 Postgres running and local `DATABASE_URL` set, run the documented
  `db:migrate` command and confirm it exits 0
- `bun run --cwd codebase check` passes with Docker stopped
- Search confirms database libraries are server-only:
  `rg -n "drizzle-orm|from 'pg'|from \"pg\"" codebase/apps/web/src/app codebase/apps/web/src/components codebase/packages/theory`
  returns no matches
- Review `architecture/overview.md` for the deploy-time migration contract:
  build-step migration with build-only `DATABASE_URL`, no runtime migration
