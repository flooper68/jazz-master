---
id: TASK-025
title: Connect Workers to Railway Postgres through Cloudflare Hyperdrive
epic: EPIC-013
status: backlog       # GATED — do not start until a feature task actually needs server-side persistence
depends_on: [TASK-024]
research: RES-002
created: 2026-07-05
---

# TASK-025 — Connect Workers to Railway Postgres through Cloudflare Hyperdrive

## Goal

tRPC procedures can query a Railway PostgreSQL database through a Cloudflare Hyperdrive binding, proven by one read-only smoke procedure — establishing the database path without moving any product state to the server.

## Context

RES-002 recommendation 6, deliberately **last and gated**: RES-002 says durable state moves to Postgres only when a specific task requires it. Pull this task only alongside the first feature that needs cross-device persistence; until then it stays in backlog. Setup: provision a Railway Postgres service, use its TCP-proxy external connection (mind egress billing), create a Hyperdrive config pointing at it, and add the `hyperdrive` binding to `wrangler.jsonc`. The connection is used via `env.HYPERDRIVE.connectionString` with `pg` or `postgres.js` inside tRPC context (`src/server/trpc/context.ts`) only. Hard boundaries from the research: the Railway `DATABASE_URL` never reaches browser code or the repo (Wrangler secret / dashboard only); React never connects to the database; all access goes through Worker-side tRPC procedures. A `dbHealth`-style procedure (`SELECT 1` / version) is the whole product surface of this task — no schema, no migrations, no feature data.

**ADR-005 note (2026-07-05):** paths predate the TASK-027 restructure — read `src/...` as `codebase/apps/web/src/...`; the boundary criterion covers `codebase/apps/web/src/{app,components,pages}/` and `codebase/packages/theory/`, and the Verification grep runs over `codebase/apps/web/src/` and its build output.

## Acceptance criteria

- [ ] Hyperdrive config created and bound in `wrangler.jsonc`
- [ ] A tRPC procedure returns a successful round-trip result from Railway Postgres on deployed Workers
- [ ] Database credentials appear in no source file, client bundle, or build output
- [ ] Database access exists only behind tRPC context/procedures — nothing under `src/app/`, `src/components/`, `src/pages/`, or `src/theory/` imports database code
- [ ] Local dev story documented (Hyperdrive local connection string pointed at the TASK-028 Docker Compose Postgres; direct-to-Railway only as fallback)
- [ ] `architecture/overview.md` updated with the data path: SPA → tRPC → Worker → Hyperdrive → Railway
- [ ] `bun run check` passes

## Verification

`bun run check` green, deploy, call the db-health procedure on the live URL and see a successful response. `grep -ri "railway\|DATABASE_URL\|postgres://" src/ dist/` shows no credentials. Confirm the Hyperdrive binding appears in `wrangler.jsonc` and the Cloudflare dashboard.
