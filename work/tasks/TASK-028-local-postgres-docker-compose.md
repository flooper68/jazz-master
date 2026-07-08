---
id: TASK-028
title: Local Postgres for development via Docker Compose and psql
epic: EPIC-013
status: backlog
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

- [ ] Root `docker-compose.yaml` defines one `postgres` service with a pinned
      major version (`postgres:18` unless the owner has already chosen the
      production major)
- [ ] Postgres data uses a named volume and survives `docker compose down` +
      `docker compose up -d`; a documented reset command wipes it intentionally
- [ ] The Postgres port is bound to localhost only, not all interfaces
- [ ] A healthcheck uses `pg_isready`
- [ ] `.env.example` documents the local `DATABASE_URL` convention with
      dev-only credentials
- [ ] Documentation records start, stop, reset, and `psql` smoke-check commands
- [ ] `bun run --cwd codebase dev` and `bun run --cwd codebase check` pass with
      Docker stopped
- [ ] `bun run --cwd codebase check` passes

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
