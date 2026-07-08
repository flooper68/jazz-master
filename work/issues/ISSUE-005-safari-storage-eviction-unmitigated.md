---
id: ISSUE-005
title: Safari/WebKit storage eviction can silently erase local-first practice data
status: fixed
severity: major
created: 2026-07-08
source: TASK-054
---

# ISSUE-005 - Safari/WebKit storage eviction can silently erase local-first practice data

## Steps to reproduce

1. Use Jazz Master in Safari/WebKit with persisted local practice data
   (`profile`, `sessions`, `daily-plans`, or `play-along-tempos`).
2. Do not interact with the site long enough for WebKit's script-writable
   storage eviction policy to apply.
3. Return to the app.

## Expected

Practice data either survives the inactivity window or the app provides a
deliberate mitigation such as an export/backup path, a persistent-storage
request where supported, or a clearly accepted product trade-off.

## Actual

ADR-002 and `architecture/overview.md` document the risk, but the product has
no mitigation. If the browser evicts `localStorage`, the typed stores correctly
fall back to defaults, which avoids crashes but loses practice history.

## Notes

Found during TASK-054 security/privacy review. Provenance is INS-023 and
RES-014: Safari/WebKit can evict script-writable storage, including
`localStorage`, after a period without user interaction. This is major because
it can silently wipe the user's profile, plans, and session history.

Candidate fixes: add a user-owned JSON export/import path for all typed stores,
request persistent storage where browsers support it, and/or add product copy
that makes the local-only durability trade-off explicit.

## Log

### 2026-07-08 - claimed (agent)
Plan: ship the narrow durability mitigation ADR-002 already names: user-owned JSON
backup export/import for the typed local stores. Add the import/export contract
inside `apps/web/src/storage/`, validate the whole backup before writing any
store, expose controls on the Profile page, and cover the storage contract plus
page behavior with Vitest. Security/privacy plan: no new dependency or network;
reject malformed/oversized imports before durable writes.

### 2026-07-08 - fixed
Added Profile-page JSON backup export/import for `profile`, `sessions`,
`daily-plans`, `play-along-tempos`, and `notation-preferences`. Restore validates
the entire backup first, rejects oversized/malformed/unsupported/bad-date files,
then writes versioned envelopes transactionally inside `apps/web/src/storage/`
and verifies durable bytes before reporting success. Independent review found
two issues in the first draft (false success on swallowed write failures and
weak date validation); both were fixed with regression tests. Security/privacy
checklist: no new dependency, no network, import schema validated before durable
writes, malformed data fails closed. Verification: focused Vitest files green;
`bun run --cwd codebase check` green (Wrangler printed the known sandbox
log-file EPERM but exited 0); `bun run --cwd codebase check:e2e` initially hit
sandbox `listen EPERM`, reran escalated, 5/5 Playwright smoke specs passed.
