---
id: TASK-070
title: Remove local backup and import
epic: EPIC-013
status: done
depends_on: [TASK-069]
source: NOTE-013
created: 2026-07-09
---

# TASK-070 — Remove local backup and import

## Goal

Delete the localStorage backup/import feature because Clerk/Postgres becomes the
source of truth and current local data is intentionally not migrated.

## Problem brief

Current condition: Backup/import exports and imports localStorage-backed app
data.

Desired condition: No local JSON backup/import remains in product paths.

Affected user/workflow: Profile/history/preferences backup and restore.

Evidence: Owner decision on 2026-07-09: remove backup/import entirely during the
Clerk/Postgres migration arc.

Baseline: `storage/backup.ts` serializes profile, sessions, daily plans,
play-along tempos, notation preferences, and scoring preferences from
localStorage.

Target: No product or test code uses the local backup/import API.

How we will know it improved: Backup/import code is gone and `bun run check`
passes without it.

## Context

Do not build server-backed export/import in this arc. Data portability can be a
future task if it becomes important.

## Acceptance criteria

- [x] Backup/import UI is removed from product paths
- [x] `storage/backup.ts` is deleted
- [x] `storage/backup.test.ts` is deleted
- [x] Storage exports for backup/import are removed from `storage/index.ts`
- [x] No product or test code imports `createStorageBackup`,
      `serializeStorageBackup`, `importStorageBackupText`, `StorageBackup`, or
      `ImportStorageBackupResult`
- [x] User-facing copy about backup/restore is removed
- [x] If there is still a product need for export later, a deferred insight or
      backlog task is filed, but no export/import implementation remains
- [x] `bun run --cwd codebase check` passes

## Verification

- Run `bun run --cwd codebase check`
- Run `rg "createStorageBackup|serializeStorageBackup|importStorageBackupText|StorageBackup|ImportStorageBackupResult" codebase/apps/web/src` and confirm no product/test imports remain

## Log

### 2026-07-10 — claimed (agent)

Plan: remove the obsolete backup/import UI and user-facing copy from the profile
surface, delete the legacy backup module and tests, and remove its public storage
exports. The baseline is a localStorage JSON portability path that no longer
matches the Clerk/Postgres source of truth; the target is zero product or test
references to the backup API. Verify with the task's zero-reference search,
`bun run --cwd codebase check`, and the storage-triggered Playwright smoke suite.
Security/data-loss review applies because this intentionally removes import and
export behavior; no server-backed replacement or local-data migration is in
scope.

### 2026-07-10 — done

Deleted the transitional backup serializer/parser and its tests, removed every
backup/import export from the storage barrel, and replaced the last legacy
backup sentence on Profile with account-sync copy. No product need for a new
export path was found, so no follow-up portability work was filed. Updated the
architecture overview/log, EPIC-013, and product wiki to identify TASK-071 as
the next migration item.

Independent review found no code or security defect and one must-fix knowledge
consistency issue: deeper architecture and epic sections still described
TASK-070 as future work. Those statements were corrected and sent through a
focused re-review. Security/privacy checklist: no concerns; the authorized
local-data portability removal introduces no dependency, input, secret,
permission, or network change.

Verification: the required backup-API `rg` search returned no matches; the
focused ProfilePage suite passed 4/4; `bun run --cwd codebase check` passed
typecheck, lint, 45 test files / 677 tests, and the production build. The build
printed the known sandbox-only Wrangler log-file EPERM warning but exited 0.
The storage-triggered Playwright pass used the local Hyperdrive/Postgres
connection with escalated port access and passed 6/6 tests.
