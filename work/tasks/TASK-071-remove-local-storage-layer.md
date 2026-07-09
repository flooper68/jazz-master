---
id: TASK-071
title: Remove generic localStorage store layer
epic: EPIC-013
status: done
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

- [x] `src/appData/profile.ts`, `src/appData/sessions.ts`, and
      `src/appData/preferences.ts` or equivalent grouped files exist for shared
      client-safe app-data contracts
- [x] Components/pages import shared data types and pure helpers from
      `src/appData/`, not `src/storage/`
- [x] `storage/store.ts` is deleted
- [x] `storage/store.test.ts` is deleted
- [x] Remaining localStorage-backed preference store files are deleted:
      `notationPreferences.ts`, `playAlongTempos.ts`, and
      `scoringPreferences.ts`
- [x] `src/storage/` is deleted if empty
- [x] `rg localStorage codebase/apps/web/src` returns no product persistence
      usage
- [x] `rg defineStore codebase/apps/web/src` returns no usage
- [x] AGENTS.md and architecture docs no longer say app data uses typed local
      stores
- [x] `bun run --cwd codebase check` passes

## Verification

- Run `bun run --cwd codebase check`
- Run `rg localStorage codebase/apps/web/src`
- Run `rg defineStore codebase/apps/web/src`

## Log

### 2026-07-10 — claimed (agent)

Plan: inventory every remaining `src/storage/` consumer, move shared client-safe
contracts and pure helpers into `src/appData/`, remove the generic store and
obsolete preference modules, then update architecture/agent documentation. Verify
with focused tests, the two required ripgrep checks, the full repository gate,
and the storage-triggered Playwright smoke suite; complete an independent review
before shipping.

### 2026-07-10 — done

Deleted `src/storage/` after confirming every product consumer already uses
`src/appData/` contracts and Clerk-scoped tRPC/Postgres persistence. Relocated
the profile contract test, removed obsolete browser-storage fixtures from page
and component tests, and updated current agent, development, testing, security,
architecture, and wiki guidance. Independent review found stale testing/security
wording and an inaccurate architecture-graph edge; both were fixed, and the
reviewer confirmed no remaining findings. Security/privacy checklist: no
concerns—this removes an unused data path, introduces no dependencies or network
access, and does not migrate or delete server-owned user data.

Verification: focused profile/practice tests passed (15/15); both required
`rg` commands return no matches; `bun run --cwd codebase check` passed (44 test
files, 663 tests, typecheck, lint, and both app builds). The first E2E attempt
failed because the sandbox blocked the local inspector port, and the first
escalated rerun lacked the local Hyperdrive connection variable; the rerun with
the repository's local Postgres/Hyperdrive connection passed all 6 Playwright
tests. Wrangler also printed a sandbox-only log-file EPERM message during the
full build, but the build and gate completed with exit code 0.
