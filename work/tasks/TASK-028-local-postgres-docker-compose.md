---
id: TASK-028
title: Local Postgres for development via Docker Compose
epic: EPIC-013
status: gated
gated_until: TASK-025 opens or a feature task actually needs server-side persistence
depends_on: []
created: 2026-07-06
---

# TASK-028 — Local Postgres for development via Docker Compose

## Goal

A one-command local PostgreSQL instance (`docker compose up -d`) that mirrors the production database we will provision on Railway, so server-persistence work (TASK-025 and whatever feature opens its gate) develops against a real Postgres instead of the live Railway service.

## Context

Owner directive (2026-07-06): the long-run database is PostgreSQL deployed on Railway; local development should run Postgres via Docker Compose. The production path is already planned — TASK-025 connects Workers to Railway Postgres through Cloudflare Hyperdrive (RES-002 recommendation 6, gated). TASK-025's "local dev story" criterion currently offers only "Hyperdrive local connection string or direct-to-Railway fallback"; this task supplies the better answer: a local compose-managed Postgres that `wrangler dev` / Hyperdrive local config points at, keeping development off the billed Railway service.

Boundaries that stay true (ADR-002, EPIC-013 out-of-scope):

- The app keeps working with Docker down. Local-first UX stands; no default command (`bun run dev`, `bun run check`) may require Postgres until TASK-025's gate opens.
- Dev-only credentials in `docker-compose.yml` are acceptable; anything pointing at Railway is not — Railway credentials never enter the repo (TASK-025 hard boundary).

Shape (implementer's call on details): `docker-compose.yml` at the repo or `codebase/` root with a single `postgres` service — image pinned to the major version Railway will provision (check Railway's current default at implementation time), named volume for data, healthcheck, port bound to localhost only. A `.env.example` documenting the `DATABASE_URL` convention. No schema, no migrations, no ORM — that belongs to the feature task that opens the TASK-025 gate.

## Acceptance criteria

- [ ] `docker compose up -d` starts Postgres; a documented connection string reaches it (`psql`/`pg_isready` round-trip)
- [ ] Postgres major version pinned and matching what Railway will provision (noted in the compose file)
- [ ] Data survives `docker compose down` + `up` (named volume); a documented reset path wipes it
- [ ] Port bound to localhost only; credentials are obvious dev-only values; nothing Railway-related appears in the repo
- [ ] `bun run dev` and `bun run check` pass with Docker stopped — no default workflow depends on the database
- [ ] Local dev database usage documented (README or `architecture/overview.md`), including how TASK-025's Hyperdrive local config will point at it
- [ ] `bun run check` passes

## Verification

`docker compose up -d && pg_isready -h localhost -p <port>` succeeds; connect with `psql` and run `SELECT 1`. `docker compose down && docker compose up -d` retains data; documented reset command clears it. Stop Docker entirely; `bun run check` still green. `grep -ri "railway" docker-compose.yml .env.example` returns nothing.
