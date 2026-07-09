---
id: TASK-062
title: Write ADR-012 — Clerk and server-owned app persistence target
epic: EPIC-013
status: done
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

- [x] `architecture/decisions/ADR-012-*.md` exists and follows existing ADR
      structure
- [x] ADR states that it supersedes ADR-002's long-term local-first direction
      while preserving ADR-002 as historical context
- [x] ADR states Clerk is the identity provider and Clerk user ID is the app's
      user boundary
- [x] ADR defines the target persistence boundary: browser code talks to tRPC,
      server code owns Drizzle/Postgres access, and Postgres is the source of
      truth for long-run app data
- [x] ADR states browser code does not access Postgres or localStorage for app
      data
- [x] ADR defines the migration sequence: Clerk foundation -> user anchor ->
      profile -> sessions/scores -> server-computed plans -> preferences ->
      backup/import removal -> localStorage store removal -> regression pass
- [x] ADR explicitly says existing local browser data will not be migrated
- [x] `architecture/overview.md`, AGENTS.md, and relevant epic/task references
      stop describing local-first as the strategic destination
- [x] A strategy amendment proposal is included in the task log or linked note;
      `strategy/` itself is not edited by the agent
- [x] Owner has reviewed and accepted the ADR, or the task is left blocked with
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

## Log

### 2026-07-09 — claimed (agent)

Plan: write ADR-012 as an accepted superseding persistence decision; update the
living architecture overview, AGENTS.md, EPIC-013/TASK-063 references, and the
wiki synthesis so localStorage is described as temporary migration state rather
than the strategic destination. `strategy/` stays read-only; the strategy
amendment proposal remains linked through NOTE-013. Verification will read the
ADR against ADR-002, ADR-006, NOTE-013, and the overview, then run
`bun run --cwd codebase check`.

### 2026-07-09 — done

ADR-012 accepted the Clerk/server-owned Postgres target and superseded ADR-002's
local-first direction as the destination while preserving it as migration
history. Updated architecture overview, AGENTS.md, EPIC-013, wiki product
synthesis, architecture log, and TASK-063 (ungated to backlog after owner
provided local Clerk env values; no env file tracked). Strategy amendment
proposal remains in linked NOTE-013; `strategy/` was not edited. Review:
subagent review unavailable under current tool policy without an explicit user
subagent request, so completed degraded self-review per `processes/code-review.md`
plus `processes/security-review.md`; no findings. Verification: read ADR-012
against ADR-002, ADR-006, NOTE-013, and `architecture/overview.md`; `git diff
--check` clean; `git diff -- strategy` empty; `bun run --cwd codebase check`
green (Wrangler logged a sandbox EPERM warning for its home-directory log file
but build exited 0).
