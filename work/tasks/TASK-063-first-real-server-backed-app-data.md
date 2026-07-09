---
id: TASK-063
title: Move the first real app-data slice to Postgres
epic: EPIC-013
status: gated
depends_on: [TASK-062]
gated_until: ADR-012 decides the identity/account model for user-owned server data
source: NOTE-013
created: 2026-07-09
---

# TASK-063 — Move the first real app-data slice to Postgres

## Goal

The first small, real user-owned app-data workflow reads and writes through
Postgres as the source of truth, proving the migration away from local
persistence with a bounded slice.

## Problem brief

Current condition: Real practice data still lives in typed localStorage stores;
database work is infrastructure or mock/smoke usage only.

Desired condition: One real app-data workflow uses server-owned persistence
through tRPC and Drizzle/Postgres.

Affected user/workflow: Returning to the app with durable profile/practice data
that is not tied to one browser's local storage.

Evidence: Owner decision in NOTE-013: in the long run, the product should have
no local persistence.

Baseline: Profile, sessions, plans, scores, preferences, and backup/import all
depend on browser storage.

Target: A single app-data slice is server-backed end to end, with local storage
removed from that slice or clearly demoted to a temporary cache/migration aid.

How we will know it improved: An agent can clear browser storage, reload, and
still recover the chosen slice from the server database under the decided
identity model.

## Context

This task is intentionally gated. Moving real user-owned data to Postgres before
choosing an identity/account model creates either shared global data, unsafe
anonymous records, or a second migration shortly afterward.

Recommended first slice after ADR-012: profile data, because it is smaller and
less behaviorally risky than sessions/scores/plans. If ADR-012 picks a different
first slice, update this task before implementation.

## Acceptance criteria

- [ ] The implemented slice is named explicitly before work begins
- [ ] Drizzle schema and generated migrations model the chosen real app data
- [ ] Server-only repository code owns all database access
- [ ] tRPC procedures expose validated read/write operations for the slice
- [ ] React code uses tRPC for the chosen slice and no longer treats
      localStorage as the source of truth for that slice
- [ ] Missing/unavailable database behavior is explicit and user-safe
- [ ] Tests cover repository behavior, tRPC boundary behavior, and the affected
      UI flow
- [ ] Architecture docs and affected work/epic docs describe the new source of
      truth
- [ ] `bun run --cwd codebase check` passes

## Verification

- With local Postgres running and migrations applied, exercise the chosen UI
  flow and verify the data is written to Postgres
- Clear browser storage, reload the app, and verify the chosen data returns from
  Postgres under the decided identity model
- Stop Docker and run `bun run --cwd codebase check`; the gate must not require
  a live database unless ADR-012 deliberately changes that contract
- Run the client/shared-domain leakage search from TASK-061
