---
id: TASK-069
title: Migrate preferences to Clerk/Postgres
epic: EPIC-013
status: done
depends_on: [TASK-068]
source: NOTE-013
created: 2026-07-09
---

# TASK-069 — Migrate preferences to Clerk/Postgres

## Goal

Move notation display mode, scoring tolerance, and per-exercise play-along
tempos out of localStorage into authenticated tRPC plus Postgres in one pass.

## Problem brief

Current condition: User preferences live in localStorage and reset with browser
storage.

Desired condition: Signed-in users' preferences live in Postgres and are
available across browsers/storage clears.

Affected user/workflow: Runner notation display, scoring tolerance, and
play-along tempo controls.

Evidence: Owner decision on 2026-07-09: keep preferences as one migration task.

Baseline: Product code imports `notationPreferencesStore`,
`playAlongTemposStore`, and `scoringPreferencesStore`.

Target: Preference reads/writes use authenticated tRPC/Postgres and no
localStorage preference stores remain in product code.

How we will know it improved: Clearing browser storage after sign-in does not
reset notation, scoring, or per-exercise tempo preferences.

## Context

Use a single `user_preferences` row for single-value preferences and a separate
per-exercise table for play-along tempos. Existing local preferences are
intentionally ignored.

## Acceptance criteria

- [x] `user_preferences` table stores `clerkUserId`, `notationDisplayMode`,
      `scoringTolerance`, `createdAt`, and `updatedAt`
- [x] `play_along_tempos` table stores `clerkUserId`, `exerciseId`, `tempoBpm`,
      `createdAt`, and `updatedAt`
- [x] `play_along_tempos` enforces unique `(clerkUserId, exerciseId)`
- [x] Defaults match current behavior: notation `both`, scoring tolerance
      `standard`, play-along tempo equal to authored exercise tempo unless a
      user-saved override exists
- [x] tRPC exposes authenticated read/write procedures for notation display mode
- [x] tRPC exposes authenticated read/write procedures for scoring tolerance
- [x] tRPC exposes authenticated read/write procedures for per-exercise
      play-along tempo
- [x] Practice runner uses tRPC preferences instead of localStorage helpers
- [x] Notation display controls use tRPC preferences instead of localStorage
      helpers
- [x] Product code no longer imports or uses `notationPreferencesStore`,
      `playAlongTemposStore`, or `scoringPreferencesStore`
- [x] Existing local preferences are ignored; no import bridge is added
- [x] Clearing browser storage does not reset preferences after sign-in
- [x] Tests cover defaults, reads, writes, per-user isolation, tempo clamping,
      and invalid values
- [x] `bun run --cwd codebase check` passes

## Verification

- Run `bun run --cwd codebase check`
- With local Postgres running and migrations applied, change all preference
  types, clear browser storage, reload signed in, and verify preferences return
  from Postgres

## Log

### 2026-07-09 — claimed (agent)

Plan: move the three client-safe preference contracts and tempo clamping into
`appData`, add normalized Drizzle tables plus an authenticated preference
repository/router, and connect the practice page/runner through one tRPC-backed
preferences hook. Remove the three local preference stores (and their backup
payloads) so existing browser values are ignored. The measurable target is zero
product imports of the legacy stores, with server defaults/read/write,
per-user isolation, invalid-input, and clear-storage persistence covered at the
repository/router and route-integration layers. Verify with the generated
migration, focused tests, local Postgres when available, the full check, and the
practice-flow e2e trigger. Security/privacy review applies because durable user
settings move from browser storage to authenticated server persistence.

### 2026-07-09 — done

Added generated migration `0005` with Clerk-keyed `user_preferences` and
uniquely keyed `play_along_tempos`, database constraints, a preference
repository, protected tRPC reads/writes, and client-safe contracts in
`appData/preferences.ts`. The runner waits for the server read, shows sync
state, coalesces rapid slider writes to latest-value ordering, rolls failed
optimistic edits back, and restores all three settings after storage clear and
reload. Removed all three local preference stores; legacy backup payloads are
ignored, and the Profile surface now truthfully describes account sync instead
of offering empty backup actions (the obsolete backup/storage code remains for
TASK-070/071 deletion).

Independent code and UI reviews found initial-load/playback races, permanent
optimistic masking, tempo write amplification, stale failure/refetch ordering,
and false-success backup UI; all were fixed and both final re-reviews reported
no must-fix findings. Security/privacy checklist: authenticated Clerk scoping,
Zod inputs, database checks, no new dependency/secret/PII, and no concerns.

Verification: focused tests green (including pending/error gates,
rollback/retry, coalescing, superseded failure, defaults, reads/writes,
isolation, invalid values, and clear-storage reload); local migration applied
successfully; a real repository check wrote notation/scoring/tempo, clamped
999 BPM to 200, proved another user retained defaults, then removed the test
row. Final `bun run --cwd codebase check` passed (46 files, 683 tests, build
green) and local-Hyperdrive `check:e2e` passed 6/6. Initial sandboxed migration
and e2e attempts failed on local socket/port restrictions, and the first
escalated e2e attempt lacked the local Hyperdrive variable; all were rerun with
the required access/configuration and passed.
