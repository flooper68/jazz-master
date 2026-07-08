---
id: TASK-025
title: Abandoned — agent-owned Railway/Hyperdrive production database setup
epic: EPIC-013
status: abandoned
abandoned_reason: owner decision 2026-07-08 — owner will set up production database infrastructure; agents should not provision Railway, Hyperdrive, Cloudflare dashboard state, or production database credentials
depends_on: [TASK-024]
research: RES-002, RES-017
created: 2026-07-05
abandoned: 2026-07-08
---

# TASK-025 — Abandoned: agent-owned Railway/Hyperdrive production database setup

> **Abandoned 2026-07-08** by owner directive. The owner will set up production
> database infrastructure. Agents should not provision Railway, create
> Hyperdrive configs, manage Cloudflare dashboard state, or verify live
> production database health as part of EPIC-013.

## Preserved Context

The original task asked agents to connect Workers to Railway Postgres through a
Cloudflare Hyperdrive binding and prove it with a deployed read-only smoke
procedure. That shape is now the wrong ownership boundary.

RES-017 supersedes the agent-owned production scope:

- Agent-owned now: local Postgres via Docker Compose, Drizzle schema/migration
  tooling, and server-side code that can consume a database connection once the
  owner provides one.
- Owner-owned now: production database provisioning, provider credentials,
  Cloudflare/Hyperdrive dashboard setup, and build/deploy secrets.

## Future Re-entry

If production database integration becomes concrete again, file a fresh task
that starts from owner-provided inputs:

- the database provider and connection policy
- the Cloudflare binding name or build/runtime secret names
- the target environment that should be verified

That future task should not revive this one.
