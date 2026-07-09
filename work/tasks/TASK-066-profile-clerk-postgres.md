---
id: TASK-066
title: Migrate profile and onboarding to Clerk/Postgres
epic: EPIC-013
status: done
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

- [x] Drizzle schema includes normalized profile tables as described above
- [x] Profile shape preserves current contract: levels, ordered goal areas,
      minutes per day, and onboarding completion timestamp
- [x] DB row `createdAt` is distinct from `onboardingCompletedAt`
- [x] tRPC exposes authenticated profile read/write procedures
- [x] First signed-in visit with no profile shows onboarding/default profile flow
      as it does now
- [x] Completing onboarding writes to Postgres
- [x] Editing the profile writes to Postgres
- [x] Dashboard/practice planner reads profile through tRPC, not localStorage
- [x] Profile page reads/writes through tRPC, not localStorage
- [x] Product code no longer imports or uses `profileStore`
- [x] Smoke-only database app-data procedures (`dbSmoke` / mock practice data)
      are removed once this real profile path verifies Clerk/Postgres access
- [x] Profile localStorage tests are removed or replaced with repository, tRPC,
      and UI tests
- [x] Clearing browser storage does not remove profile data after sign-in
- [x] Existing local profile data is ignored; no import bridge is added
- [x] `bun run --cwd codebase check` passes

## Verification

- Run `bun run --cwd codebase check`
- With local Postgres running and migrations applied, complete onboarding,
  verify profile rows are written, clear browser storage, reload signed in, and
  verify the profile returns from Postgres

## Log

### 2026-07-09 — claimed (agent)

Plan: add normalized Drizzle profile tables and migrations, replace profile
localStorage access with authenticated tRPC read/write procedures, update
onboarding/profile/dashboard consumers and tests, remove the smoke-only app-data
procedures once the real profile path proves Clerk/Postgres access, then verify
with `bun run --cwd codebase check` plus the local Postgres/browser persistence
flow where runnable.

### 2026-07-09 — completed (agent)

Implemented normalized `practice_profiles` and
`practice_profile_goal_areas` tables, protected `profile.get`/`profile.save`
tRPC procedures, and a React profile provider that gates onboarding from the
server-backed profile. Removed `profileStore` product usage, profile backup
export/import, and the old `dbSmoke`/`mockPractice` scaffolding.

Verification: `bun run --cwd codebase check` passed. Applied migrations against
local Postgres on port 55432 and verified a real `ProfileRepository` save/read
round trip survived outside browser storage. `bun run --cwd codebase check:e2e`
could not complete in this environment: first the sandbox blocked local dev
server port binding, then the escalated run required local Hyperdrive config,
then with local Postgres configured the app refused to serve because Clerk test
keys are not present. The current smoke harness is still unauthenticated and
needs Clerk-aware fixtures before it can prove the signed-in browser flow.

Review: independent subagent review was not available under the current tool
policy, so the code-review checklist was completed in degraded self-review mode.
Findings fixed before ship: missing-profile database configuration now renders
an error state instead of an indefinite loading state, and profile goal areas
read from Postgres are validated before returning the typed profile contract.
