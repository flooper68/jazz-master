---
id: TASK-069
title: Migrate preferences to Clerk/Postgres
epic: EPIC-013
status: backlog
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

- [ ] `user_preferences` table stores `clerkUserId`, `notationDisplayMode`,
      `scoringTolerance`, `createdAt`, and `updatedAt`
- [ ] `play_along_tempos` table stores `clerkUserId`, `exerciseId`, `tempoBpm`,
      `createdAt`, and `updatedAt`
- [ ] `play_along_tempos` enforces unique `(clerkUserId, exerciseId)`
- [ ] Defaults match current behavior: notation `both`, scoring tolerance
      `standard`, play-along tempo equal to authored exercise tempo unless a
      user-saved override exists
- [ ] tRPC exposes authenticated read/write procedures for notation display mode
- [ ] tRPC exposes authenticated read/write procedures for scoring tolerance
- [ ] tRPC exposes authenticated read/write procedures for per-exercise
      play-along tempo
- [ ] Practice runner uses tRPC preferences instead of localStorage helpers
- [ ] Notation display controls use tRPC preferences instead of localStorage
      helpers
- [ ] Product code no longer imports or uses `notationPreferencesStore`,
      `playAlongTemposStore`, or `scoringPreferencesStore`
- [ ] Existing local preferences are ignored; no import bridge is added
- [ ] Clearing browser storage does not reset preferences after sign-in
- [ ] Tests cover defaults, reads, writes, per-user isolation, tempo clamping,
      and invalid values
- [ ] `bun run --cwd codebase check` passes

## Verification

- Run `bun run --cwd codebase check`
- With local Postgres running and migrations applied, change all preference
  types, clear browser storage, reload signed in, and verify preferences return
  from Postgres
