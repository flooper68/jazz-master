---
id: TASK-070
title: Remove local backup and import
epic: EPIC-013
status: backlog
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

- [ ] Backup/import UI is removed from product paths
- [ ] `storage/backup.ts` is deleted
- [ ] `storage/backup.test.ts` is deleted
- [ ] Storage exports for backup/import are removed from `storage/index.ts`
- [ ] No product or test code imports `createStorageBackup`,
      `serializeStorageBackup`, `importStorageBackupText`, `StorageBackup`, or
      `ImportStorageBackupResult`
- [ ] User-facing copy about backup/restore is removed
- [ ] If there is still a product need for export later, a deferred insight or
      backlog task is filed, but no export/import implementation remains
- [ ] `bun run --cwd codebase check` passes

## Verification

- Run `bun run --cwd codebase check`
- Run `rg "createStorageBackup|serializeStorageBackup|importStorageBackupText|StorageBackup|ImportStorageBackupResult" codebase/apps/web/src` and confirm no product/test imports remain
