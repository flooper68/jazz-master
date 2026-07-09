---
id: TASK-067
title: Migrate practice sessions, grades, and scores to Clerk/Postgres
epic: EPIC-013
status: backlog
depends_on: [TASK-066]
source: NOTE-013
created: 2026-07-09
---

# TASK-067 — Migrate practice sessions, grades, and scores to Clerk/Postgres

## Goal

Move practice session persistence from `sessionsStore` localStorage to
authenticated tRPC plus Postgres, including incomplete sessions, exercise grades,
machine score summaries, and per-note score details.

## Problem brief

Current condition: Session history, abandoned sessions, grades, and machine
scores live in browser storage.

Desired condition: Signed-in users' session history lives in Postgres and is
available across browser storage clears.

Affected user/workflow: Practice runner writes, history, dashboard statistics,
and score review.

Evidence: Owner decision on 2026-07-09: migrate all current features to
Clerk/Postgres, keep session UUIDs client-generated for automated tests, and
normalize score details.

Baseline: Product code imports `sessionsStore` and `upsertSession`.

Target: Runner, history, and dashboard use authenticated tRPC/Postgres for
session data.

How we will know it improved: A signed-in user can practice, clear browser
storage, reload, and still see sessions/history/scores from Postgres.

## Context

Session IDs remain client-generated UUIDs. Score data should be normalized,
including per-note details.

Schema direction:

- `practice_sessions`
  - `id` primary key, client-generated UUID
  - `clerkUserId`
  - `lessonId`
  - `startedAt`
  - `durationSeconds`
  - `completed`
  - `score`
  - `createdAt`
  - `updatedAt`
- `practice_session_results`
  - `sessionId`
  - `exerciseId`
  - `position`
  - `grade`
  - optional score summary fields: `score`, `tolerance`, `pitchScore`,
    `timingScore`, `completenessScore`, `extras`, `analyzedAt`
- `practice_session_score_notes`
  - `sessionId`
  - `exerciseId` or result ID
  - `position`
  - `expectedId`
  - `expectedNote`
  - `verdict`
  - `timingOffsetSeconds`
  - `pitchCents`

Existing local sessions are intentionally ignored.

## Acceptance criteria

- [ ] Drizzle schema includes normalized session, result, and score-note tables
- [ ] Client-generated session IDs are accepted and scoped to the signed-in
      Clerk user
- [ ] Session upsert rejects attempts to overwrite another user's session
- [ ] Session records preserve current contract: lesson ID, startedAt,
      durationSeconds, completed, optional session score
- [ ] Exercise results preserve grades and lesson order
- [ ] Exercise grades are constrained to `got-it`, `shaky`, and `missed`
- [ ] Machine score summary metadata is persisted for scored exercise results
- [ ] Per-note score details are normalized, not JSON
- [ ] Runner writes session progress through authenticated tRPC, not localStorage
- [ ] Abandoned/incomplete sessions still persist
- [ ] History page reads sessions through tRPC/Postgres
- [ ] Dashboard stats read sessions through tRPC/Postgres
- [ ] Product code no longer imports or uses `sessionsStore` or `upsertSession`
- [ ] Clearing browser storage does not remove session history after sign-in
- [ ] Existing local sessions are ignored; no import bridge is added
- [ ] `bun run --cwd codebase check` passes

## Verification

- Run `bun run --cwd codebase check`
- With local Postgres running and migrations applied, complete and abandon
  practice sessions, verify rows are written, clear browser storage, reload
  signed in, and verify history/dashboard still show the data
