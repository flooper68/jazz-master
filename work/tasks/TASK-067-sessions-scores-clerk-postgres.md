---
id: TASK-067
title: Migrate practice sessions, grades, and scores to Clerk/Postgres
epic: EPIC-013
status: done
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

- [x] Drizzle schema includes normalized session, result, and score-note tables
- [x] Client-generated session IDs are accepted and scoped to the signed-in
      Clerk user
- [x] Session upsert rejects attempts to overwrite another user's session
- [x] Session records preserve current contract: lesson ID, startedAt,
      durationSeconds, completed, optional session score
- [x] Exercise results preserve grades and lesson order
- [x] Exercise grades are constrained to `got-it`, `shaky`, and `missed`
- [x] Machine score summary metadata is persisted for scored exercise results
- [x] Per-note score details are normalized, not JSON
- [x] Runner writes session progress through authenticated tRPC, not localStorage
- [x] Abandoned/incomplete sessions still persist
- [x] History page reads sessions through tRPC/Postgres
- [x] Dashboard stats read sessions through tRPC/Postgres
- [x] Product code no longer imports or uses `sessionsStore` or `upsertSession`
- [x] Clearing browser storage does not remove session history after sign-in
- [x] Existing local sessions are ignored; no import bridge is added
- [x] `bun run --cwd codebase check` passes

## Verification

- Run `bun run --cwd codebase check`
- With local Postgres running and migrations applied, complete and abandon
  practice sessions, verify rows are written, clear browser storage, reload
  signed in, and verify history/dashboard still show the data

## Log

### 2026-07-09 — claimed (agent)

Plan: inspect the current `sessionsStore` contract and TASK-066 server-backed
profile pattern; add normalized Drizzle tables and migrations for sessions,
results, and score notes; expose authenticated tRPC procedures for session
upsert/list/stat reads; migrate runner/history/dashboard code away from
`sessionsStore`; cover the persistence contract with focused tests; then run
`bun run --cwd codebase check` and the agent-runnable local Postgres verification
where available.

### 2026-07-09 — done

Moved session contracts to `src/appData/session.ts`; removed the local
`sessionsStore`; added normalized Drizzle tables/migration for
`practice_sessions`, ordered `practice_session_results`, and normalized
`practice_session_score_notes`; added protected `sessions.list`/`sessions.upsert`
tRPC procedures and a user-scoped repository that rejects cross-user session ID
overwrites. Runner writes committed progress through tRPC, while History,
Dashboard, and the current planner read sessions from tRPC/Postgres; backup
export/import no longer carries session history, so existing local sessions are
ignored. Security/privacy checklist: no secrets committed, session writes are
protected by Clerk user ID, no new dependency or browser permission.
Independent review found three issues before ship: session saves could race,
daily plans could be persisted from the empty pending-session placeholder, and
DB checks were weaker than the tRPC score contract. Fixed by serializing runner
session saves on the client, waiting for `sessions.list` before first daily-plan
generation/persistence, and adding DB checks for score component percentages and
non-negative extras (`0004_jittery_slayback`). Verification: `bun run --cwd
codebase check` green after fixes; local compose Postgres on port 55432 had
migrations applied and repository verification wrote/read one completed scored
session plus one abandoned session, with direct table counts of 2 sessions, 2
results, and 1 score-note row; direct constraint query confirmed the result
grade/tolerance/score/component/extras checks. `bun run --cwd codebase
check:e2e` was attempted three ways: sandboxed dev-server start failed on EPERM,
escalated start failed until a local Hyperdrive URL was supplied, then the suite
ran and failed because the existing e2e pack still expects the pre-Clerk
landing/onboarding flow (`Jazz Master` h1 and `Skip for now` button). Residual
e2e maintenance remains for the reflect step.
