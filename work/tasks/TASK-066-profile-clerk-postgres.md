---
id: TASK-066
title: Migrate profile and onboarding to Clerk/Postgres
epic: EPIC-013
status: backlog
depends_on: [TASK-065]
source: NOTE-013
created: 2026-07-09
---

# TASK-066 — Migrate profile and onboarding to Clerk/Postgres

## Goal

Move practice profile and onboarding completion from `profileStore`
localStorage to authenticated tRPC plus Postgres, and remove profile
localStorage usage in the same task.

## Problem brief

Current condition: Profile/onboarding state lives in localStorage and disappears
with browser storage.

Desired condition: Signed-in users' practice profiles live in Postgres and are
read/written through authenticated server APIs.

Affected user/workflow: Onboarding, profile editing, dashboard planning, and
practice recommendations.

Evidence: Owner decision on 2026-07-09: migrate all current features to
Clerk/Postgres, discard existing local data, and retire localStorage during each
migration.

Baseline: Product code imports `profileStore`.

Target: Product code reads/writes profile through tRPC and no product path uses
profile localStorage.

How we will know it improved: Clearing browser storage after sign-in does not
remove profile data.

## Context

Prefer normalized columns when the data shape is stable. Keep product lifecycle
time separate from DB row metadata.

Schema direction:

- `practice_profiles`
  - `clerkUserId` primary/foreign key to `users.clerkUserId`
  - `scalesLevel`
  - `arpeggiosLevel`
  - `chordsLevel`
  - `standardsLevel`
  - `earsLevel`
  - `minutesPerDay`
  - `onboardingCompletedAt`
  - `createdAt`
  - `updatedAt`
- `practice_profile_goal_areas`
  - `clerkUserId`
  - `area`
  - `position`

Existing local profile data is intentionally ignored.

## Acceptance criteria

- [ ] Drizzle schema includes normalized profile tables as described above
- [ ] Profile shape preserves current contract: levels, ordered goal areas,
      minutes per day, and onboarding completion timestamp
- [ ] DB row `createdAt` is distinct from `onboardingCompletedAt`
- [ ] tRPC exposes authenticated profile read/write procedures
- [ ] First signed-in visit with no profile shows onboarding/default profile flow
      as it does now
- [ ] Completing onboarding writes to Postgres
- [ ] Editing the profile writes to Postgres
- [ ] Dashboard/practice planner reads profile through tRPC, not localStorage
- [ ] Profile page reads/writes through tRPC, not localStorage
- [ ] Product code no longer imports or uses `profileStore`
- [ ] Smoke-only database app-data procedures (`dbSmoke` / mock practice data)
      are removed once this real profile path verifies Clerk/Postgres access
- [ ] Profile localStorage tests are removed or replaced with repository, tRPC,
      and UI tests
- [ ] Clearing browser storage does not remove profile data after sign-in
- [ ] Existing local profile data is ignored; no import bridge is added
- [ ] `bun run --cwd codebase check` passes

## Verification

- Run `bun run --cwd codebase check`
- With local Postgres running and migrations applied, complete onboarding,
  verify profile rows are written, clear browser storage, reload signed in, and
  verify the profile returns from Postgres
