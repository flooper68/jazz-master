---
id: TASK-071
title: Remove generic localStorage store layer
epic: EPIC-013
status: backlog
depends_on: [TASK-070]
source: NOTE-013
created: 2026-07-09
---

# TASK-071 — Remove generic localStorage store layer

## Goal

Remove the now-unused localStorage abstraction after all product data has moved
to Clerk/Postgres.

## Problem brief

Current condition: Shared app-data types and localStorage implementation details
are mixed under `src/storage/`.

Desired condition: Client-safe app-data contracts live under `src/appData/`,
server persistence lives under `src/server/`, and `src/storage/` is gone.

Affected user/workflow: No direct user workflow; this removes obsolete
architecture after the migration.

Evidence: Owner decision on 2026-07-09: retire localStorage during migration and
use `src/appData/` for shared data contracts.

Baseline: `defineStore` and localStorage-backed store modules remain in
`apps/web/src/storage/`.

Target: No product path uses `localStorage` or `defineStore`.

How we will know it improved: `rg localStorage codebase/apps/web/src` and
`rg defineStore codebase/apps/web/src` show no product persistence usage.

## Context

Dependencies: profile migration, sessions/scores migration, server-computed
daily plans, preferences migration, and backup/import removal.

Move shared client-safe contracts to `src/appData/`, for example:

- `src/appData/profile.ts`
- `src/appData/sessions.ts`
- `src/appData/preferences.ts`

Keep server repositories under `src/server/db/` and tRPC routers under
`src/server/trpc/`.

## Acceptance criteria

- [ ] `src/appData/profile.ts`, `src/appData/sessions.ts`, and
      `src/appData/preferences.ts` or equivalent grouped files exist for shared
      client-safe app-data contracts
- [ ] Components/pages import shared data types and pure helpers from
      `src/appData/`, not `src/storage/`
- [ ] `storage/store.ts` is deleted
- [ ] `storage/store.test.ts` is deleted
- [ ] Remaining localStorage-backed store files are deleted:
      `profile.ts`, `sessions.ts`, `dailyPlans.ts`, `notationPreferences.ts`,
      `playAlongTempos.ts`, and `scoringPreferences.ts`
- [ ] `src/storage/` is deleted if empty
- [ ] `rg localStorage codebase/apps/web/src` returns no product persistence
      usage
- [ ] `rg defineStore codebase/apps/web/src` returns no usage
- [ ] AGENTS.md and architecture docs no longer say app data uses typed local
      stores
- [ ] `bun run --cwd codebase check` passes

## Verification

- Run `bun run --cwd codebase check`
- Run `rg localStorage codebase/apps/web/src`
- Run `rg defineStore codebase/apps/web/src`
