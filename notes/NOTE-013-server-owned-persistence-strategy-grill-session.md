---
id: NOTE-013
title: Server-owned persistence direction (grill session)
created: 2026-07-09
source_type: grill-session
participants: [owner, agent]
processed: true
---

# NOTE-013 — Server-owned persistence direction (grill session)

## Context

While reviewing the current Postgres/psql work, the owner asked whether any
current task actually gives the web app real database usage. The answer was no:
TASK-056 is only a server-side Drizzle smoke query, and current product practice
state remains local.

The owner then asked to add a task for mock app usage of the database and to
change the strategy toward saving app data in the database.

## Discussion and decision

Implicit grill triggered because this changes the product and architecture
direction. The load-bearing question was whether the target is local-first with
server sync/backup, or a long-run replacement of local persistence.

Owner decision:

> In the long run we do not want any local persistence.

This means ADR-002's local-first decision should become transitional history,
not the target state. Local storage can remain temporarily while server
persistence is introduced, but the strategic destination is server-owned app
data in Postgres.

## Strategy amendment proposal

`strategy/` is read-only for agents, so this note records the exact amendment to
propose to the owner instead of editing the strategy files directly.

Suggested VIS-001 change:

- Replace the non-goal "Accounts and backend — local-first in the browser
  (ADR-002); 'logging in' is a local profile until the product proves itself"
  with: "Long-run persistence is server-owned in Postgres. Local browser
  storage is a temporary bridge during migration, not the product target. Auth
  and account shape are introduced only as far as needed to protect user-owned
  practice data."

Suggested goals change:

- Replace "Deployed publicly as a static site" in Later with: "Deployed as a
  server-backed app with Postgres persistence for user-owned practice data."
- Add a Now/Later bridge goal: "De-risk server persistence by moving from
  Drizzle smoke checks to a mock app-data flow, then to the first real
  server-owned practice data slice."

## Write-backs and extracted work

- TASK-061 — add a DB-backed mock app-data flow so the web app exercises a real
  Drizzle schema and read/write path beyond `select 1`.
- TASK-062 — write a superseding ADR for server-owned app persistence, replacing
  ADR-002 as the target architecture while preserving it as historical context.
- TASK-063 — prepare the first real server-backed app-data slice, gated on the
  identity/account decision required before user practice records leave local
  storage.
- EPIC-013 updated to include the new persistence-transition tasks.
