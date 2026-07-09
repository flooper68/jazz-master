---
id: TASK-072
title: Run Clerk/Postgres migration regression pass
epic: EPIC-013
status: backlog
depends_on: [TASK-071]
source: NOTE-013
created: 2026-07-09
---

# TASK-072 — Run Clerk/Postgres migration regression pass

## Goal

Verify the complete migration after all slices are moved: app access requires
Clerk, all current features use Postgres, and clearing browser storage does not
lose product data.

## Problem brief

Current condition: The migration touches auth, routing, tRPC, database schema,
and every current app-data workflow.

Desired condition: The full signed-in practice loop works against Clerk/Postgres
with no localStorage-backed product data.

Affected user/workflow: Sign-in, onboarding/profile, practice, scoring, history,
dashboard, notation, play-along, and preferences.

Evidence: Owner decision on 2026-07-09: migrate all current features to
Clerk/Postgres and retire localStorage.

Baseline: Earlier tasks verify slices independently.

Target: End-to-end regression verifies the whole migrated product surface.

How we will know it improved: A signed-in user can complete the current product
loop, clear browser storage, reload, and recover product state from Postgres.

## Context

Keep this as a real task rather than relying only on per-slice verification,
because this migration crosses auth, DB, routing, tRPC, and all product
workflows.

## Acceptance criteria

- [ ] Regression checklist covers signed-out `/app/*` redirect to sign-in
- [ ] Signed-in user can complete onboarding/profile setup
- [ ] Profile survives browser storage clearing
- [ ] Signed-in user can start and complete a practice session
- [ ] Incomplete/abandoned session persists
- [ ] Grades and machine scores persist
- [ ] History shows server-backed sessions
- [ ] Dashboard stats and today's plan reflect server-backed profile/session
      data
- [ ] Notation display preference persists
- [ ] Scoring tolerance preference persists
- [ ] Per-exercise play-along tempo persists
- [ ] Backup/import UI is absent
- [ ] `rg localStorage codebase/apps/web/src` shows no product persistence usage
- [ ] `rg defineStore codebase/apps/web/src` returns no usage
- [ ] `bun run --cwd codebase check` passes
- [ ] Playwright or manual browser regression verifies a clear-storage/reload
      path

## Verification

- Run `bun run --cwd codebase check`
- Run `rg localStorage codebase/apps/web/src`
- Run `rg defineStore codebase/apps/web/src`
- Run the app with local Postgres and Clerk env vars, exercise the signed-in
  regression checklist, clear browser storage, reload, and confirm product state
  returns from Postgres
