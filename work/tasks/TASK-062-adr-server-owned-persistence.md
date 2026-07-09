---
id: TASK-062
title: Write ADR-012 — server-owned app persistence target
epic: EPIC-013
status: backlog
depends_on: [TASK-061]
source: NOTE-013
created: 2026-07-09
---

# TASK-062 — Write ADR-012: server-owned app persistence target

## Goal

An accepted ADR records the new persistence direction: long-run app data lives
in Postgres through server APIs, and local browser persistence becomes a
temporary migration bridge rather than the target architecture.

## Context

ADR-002 currently says local-first, no backend, no accounts, and all state in
localStorage. ADR-006 already superseded the "no backend" part by introducing
Astro Workers and tRPC, but deliberately kept practice state local. NOTE-013
changes the target: the owner wants no local persistence in the long run.

The ADR should not implement the migration. It should define the target, the
sequencing, and the decisions still required before real user-owned records move
server-side.

## Acceptance criteria

- [ ] `architecture/decisions/ADR-012-*.md` exists and follows existing ADR
      structure
- [ ] ADR states what it supersedes from ADR-002 and what remains useful as
      transitional/history
- [ ] ADR defines the target persistence boundary: browser code talks to tRPC,
      server code owns Drizzle/Postgres access, and Postgres is the source of
      truth for long-run app data
- [ ] ADR explicitly addresses the identity/account requirement before real
      user-owned practice records move to the database
- [ ] ADR defines a migration sequence from mock DB usage to first real app
      data to full local-storage retirement
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

## Open questions (deferred grill)

1. What is the first acceptable identity model for server-owned data: explicit
   account login, owner-only single-user mode, or anonymous device identity as a
   temporary bridge?
