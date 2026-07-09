---
id: TASK-060
title: Run database migrations from a Railway migration service
epic: EPIC-013
status: done
depends_on: [TASK-055]
research: RES-017
created: 2026-07-09
---

# TASK-060 — Run database migrations from a Railway migration service

## Goal

Database migrations run from a dedicated Railway service instead of Cloudflare
Workers Builds, keeping the Cloudflare deployment free of database credentials
and provider-specific migration concerns.

## Context

The previous TASK-055 deployment contract put a build-only `DATABASE_URL` in
Cloudflare Workers Builds and ran `db:migrate` before `check`. The owner now has
the deployment Postgres connection string and wants migrations owned by Railway
instead. Cloudflare should keep building and deploying the Worker without a
database secret.

Boundaries:

- The repository must not store the deployment connection string.
- The web Worker request path still does not run migrations.
- No product persistence moves to Postgres in this task.
- Hyperdrive/runtime database wiring remains future work.

## Acceptance criteria

- [x] A dedicated Bun workspace app exists for database migrations
- [x] The migration app has a Railway-friendly `start` command that runs Drizzle
      migrations from committed SQL metadata using `DATABASE_URL`
- [x] Root `db:migrate` routes through the migration app, while `db:generate`
      still reads the web schema and writes committed migration SQL metadata
      under the migration app
- [x] Cloudflare Workers Builds documentation no longer requires `DATABASE_URL`
      or runs migrations
- [x] Railway setup documentation says where to put the deployment Postgres
      connection string and what start command to use
- [x] Architecture/wiki/task docs record the new owner boundary: Railway owns
      migrations, Cloudflare owns Worker build/deploy, runtime DB access remains
      future work
- [x] `bun run --cwd codebase check` passes

## Verification

- `DATABASE_URL=postgresql://jazz_master:jazz_master@127.0.0.1:5432/jazz_master bun run --cwd codebase db:migrate`
  exits 0 with local Postgres running
- `bun run --cwd codebase check` passes
- `rg -n 'build command .*db:migrate|bun run db:migrate && bun run check|build-only DATABASE_URL|Cloudflare Workers Builds runs .*db:migrate' architecture/overview.md wiki README.md codebase/apps`
  returns no stale operational migration contract

## Log

### 2026-07-09 — claimed (agent)

Plan: add `codebase/apps/migration` as a tiny Bun workspace whose `start` script
runs `drizzle-kit migrate` against the web app's committed schema/migration
directory, route root `db:migrate` through it, then update architecture/wiki/task
docs so Cloudflare Workers Builds only runs `bun run check` and Railway owns the
deployment `DATABASE_URL` plus migration service execution.

### 2026-07-09 — done

Added `codebase/apps/migration` as the dedicated Bun workspace app for database
migrations. Root `db:migrate` routes through the app, while `db:generate` remains
tied to the web schema. Updated architecture, wiki, and Drizzle docs so
Cloudflare Workers Builds only installs and runs `bun run check`; Railway owns
the deployment `DATABASE_URL` and migration execution. The app was named
`migration` per owner correction. Review: independent subagents are not allowed
without an explicit user delegation request in this environment, so the
code-review and security/privacy checklists were completed as a degraded
self-review. Security/privacy checklist: no secrets committed; dependency
versions are existing Drizzle/pg tooling already present in the lockfile.
Verification: Docker default port 5432 was occupied, so the local Compose
Postgres service ran on port 55432; the migration command exited 0 after sandbox
escalation for localhost Docker access; stale operational contract search
returned no matches; `bun run --cwd codebase check` passed with 46 test files and
632 tests. The check build logged Wrangler's known sandbox EPERM for its home
directory log file but exited 0.

### 2026-07-09 — Railway build fix

Railway deploy logs showed the service being built from `codebase/apps/migration`
with Railpack/npm, so `tsc -b` resolved `../../tsconfig.base.json` to
`/tsconfig.base.json` and failed before migrations could run. Follow-up fix:
made the migration app self-contained for an isolated Railway service by copying
the shared compiler options into its `tsconfig`, moving committed migration SQL
metadata to `apps/migration/drizzle/`, changing web `db:generate` to write
there, and adding a Bun Dockerfile. Railway setup is now root directory
`codebase/apps/migration`, Dockerfile builder, `DATABASE_URL` as a service
variable, and no required dashboard start-command override. Review: independent
subagent spawning is blocked by the current tool policy unless the user
explicitly asks for delegation, so the code-review and security/privacy
checklists were completed as a degraded self-review.
