---
id: TASK-028
title: Local Postgres for development via Docker Compose and psql
epic: EPIC-013
status: done
depends_on: []
research: RES-017
created: 2026-07-06
---

# TASK-028 — Local Postgres for development via Docker Compose and psql

## Goal

A repo-owned local PostgreSQL service starts with one command and can be
verified with `psql`, giving Drizzle and future server-persistence work a real
local database without touching production infrastructure.

## Context

Owner directive (2026-07-08): use PostgreSQL, local `docker-compose.yaml`,
`psql` for smoke checks, and leave production infrastructure setup to the owner.
RES-017 records the current research basis.

Boundaries:

- The app keeps working with Docker down. `bun run --cwd codebase dev` and
  `bun run --cwd codebase check` must not require Postgres.
- Use obvious dev-only credentials. No Railway, Hyperdrive, production
  connection string, token, private hostname, or Cloudflare dashboard state
  belongs in this task.
- This task creates the local database service only. Drizzle ORM/migrations are
  TASK-055.

## Acceptance criteria

- [x] Root `docker-compose.yaml` defines one `postgres` service with a pinned
      major version (`postgres:18` unless the owner has already chosen the
      production major)
- [x] Postgres data uses a named volume and survives `docker compose down` +
      `docker compose up -d`; a documented reset command wipes it intentionally
- [x] The Postgres port is bound to localhost only, not all interfaces
- [x] A healthcheck uses `pg_isready`
- [x] `.env.example` documents the local `DATABASE_URL` convention with
      dev-only credentials
- [x] Documentation records start, stop, reset, and `psql` smoke-check commands
- [x] `bun run --cwd codebase dev` and `bun run --cwd codebase check` pass with
      Docker stopped
- [x] `bun run --cwd codebase check` passes

## Verification

- `docker compose up -d`
- `docker compose ps` shows Postgres healthy
- `psql "postgres://jazz_master:jazz_master@127.0.0.1:5432/jazz_master" -c 'select 1;'`
  succeeds
- `docker compose down && docker compose up -d` preserves data; the documented
  reset command removes it
- Stop Docker entirely, then run `bun run --cwd codebase check`
- `rg -n "railway|hyperdrive|DATABASE_URL=.*(railway|cloudflare)|postgres://.*@" docker-compose.yaml .env.example architecture codebase`
  finds no production credential or production host

## Log

### 2026-07-08 — claimed (agent)

Plan: add a root Docker Compose Postgres service with localhost-only port, named volume, and `pg_isready`; document local-only `DATABASE_URL`, start/stop/reset/`psql` commands, and verify Docker is optional for `bun run --cwd codebase check`. Keep Drizzle and app DB consumption out of scope for TASK-055/TASK-056.

### 2026-07-08 — done

Added root `docker-compose.yaml` with a single `postgres:18` service, dev-only `jazz_master` credentials, localhost-only host port with default `5432`, `pg_isready`, and a named volume mounted at `/var/lib/postgresql` for the Postgres 18 image layout. Added `.env.example`, README local database commands, `.env` ignore, and architecture overview/log updates. Verification: `docker compose config` shows default `127.0.0.1:5432` and alternate `127.0.0.1:55432`; literal `docker compose up -d` on this machine failed because unrelated container `postgres-configurator-phoenix` already owns `127.0.0.1:5432`, so the service was runtime-verified with `JAZZ_MASTER_POSTGRES_PORT=55432` instead. `docker compose ps` showed healthy; `psql ...55432 -c 'select 1;'` succeeded; a throwaway row survived `docker compose down` + `docker compose up -d`; `docker compose down --volumes` removed the Jazz Master test volume. `rg -n "railway|hyperdrive|DATABASE_URL=.*(railway|cloudflare)|postgres://.*@" docker-compose.yaml .env.example architecture codebase` found no matches. `bun run --cwd codebase dev -- --host 127.0.0.1 --port 4322` started with the Jazz Master compose service stopped, then was stopped via `bunx astro dev stop`. `bun run --cwd codebase check` passed after rerun with escalated filesystem permission for Wrangler logs. Review: degraded-mode self-review because the available subagent tool requires explicit user delegation; security/privacy checklist: no secrets or production hosts, no app DB dependency, reset command documented explicitly.
