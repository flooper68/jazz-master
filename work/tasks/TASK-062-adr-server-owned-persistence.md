---
id: TASK-062
title: Write ADR-012 — Clerk and server-owned app persistence target
epic: EPIC-013
status: backlog
depends_on: [TASK-061]
source: NOTE-013
created: 2026-07-09
---

# TASK-062 — Write ADR-012: Clerk and server-owned app persistence target

## Goal

An accepted ADR records the new persistence direction: Clerk owns identity,
long-run app data lives in Postgres through server APIs, and local browser
persistence is not part of the target architecture.

## Context

ADR-002 currently says local-first, no backend, no accounts, and all state in
localStorage. ADR-006 already superseded the "no backend" part by introducing
Astro Workers and tRPC, but deliberately kept practice state local. NOTE-013
changed the target: the owner wants no local persistence in the long run. Owner
discussion on 2026-07-09 then chose Clerk as the identity provider, no
local-data migration bridge, and retirement of localStorage during each feature
migration.

The ADR should not implement the migration. It should define the target, the
sequencing, and the decisions still required before real user-owned records move
server-side.

## Acceptance criteria

- [ ] `architecture/decisions/ADR-012-*.md` exists and follows existing ADR
      structure
- [ ] ADR states that it supersedes ADR-002's long-term local-first direction
      while preserving ADR-002 as historical context
- [ ] ADR states Clerk is the identity provider and Clerk user ID is the app's
      user boundary
- [ ] ADR defines the target persistence boundary: browser code talks to tRPC,
      server code owns Drizzle/Postgres access, and Postgres is the source of
      truth for long-run app data
- [ ] ADR states browser code does not access Postgres or localStorage for app
      data
- [ ] ADR defines the migration sequence: Clerk foundation -> user anchor ->
      profile -> sessions/scores -> server-computed plans -> preferences ->
      backup/import removal -> localStorage store removal -> regression pass
- [ ] ADR explicitly says existing local browser data will not be migrated
- [ ] `architecture/overview.md`, AGENTS.md, and relevant epic/task references
      stop describing local-first as the strategic destination
- [ ] A strategy amendment proposal is included in the task log or linked note;
      `strategy/` itself is not edited by the agent
- [ ] Owner has reviewed and accepted the ADR, or the task is left blocked with
      precise deferred-grill questions

## Verification

- Read ADR-012 against ADR-002, ADR-006, NOTE-013, and current architecture
  overview; every contradiction is either resolved or explicitly preserved as a
  temporary migration state
- Confirm no files under `strategy/` were edited by the agent
- Run `bun run --cwd codebase check` if any code/config changed; for a
  knowledge-only ADR/doc change, the normal gate still applies before commit

## Owner decisions already made

- `/` stays public.
- `/app/*` requires sign-in once the Clerk foundation lands.
- Use a sign-in page redirect for signed-out app access.
- Local development requires real Clerk environment keys; the owner will provide
  them in `.env`.
- Existing local browser data is discarded, not migrated.
