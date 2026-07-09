---
id: TASK-065
title: Add Clerk-keyed user database anchor
epic: EPIC-013
status: done
depends_on: [TASK-063]
source: NOTE-013
created: 2026-07-09
---

# TASK-065 — Add Clerk-keyed user database anchor

## Goal

Create the authenticated user anchor in Postgres: every signed-in Clerk user can
get a corresponding app user row keyed directly by Clerk user ID.

## Problem brief

Current condition: Authenticated server code can know the Clerk user ID, but app
data tables do not yet have a stable user-scoping anchor.

Desired condition: Server-owned app-data tables can key directly to
`users.clerkUserId`.

Affected user/workflow: Every future profile, session, plan, preference, and
history query.

Evidence: Owner decision on 2026-07-09: use Clerk IDs directly and read email/name
from Clerk rather than duplicating them in Postgres.

Baseline: The database has mock/smoke app data only.

Target: A minimal `users` table keyed by Clerk ID plus a server-only
`ensureUser(clerkUserId)` path.

How we will know it improved: Authenticated server code can ensure/reuse a user
row and unauthenticated code cannot create or read user rows.

## Context

Use Clerk user IDs directly as the app-data user key. Do not introduce a
separate internal user UUID unless a later requirement appears. Do not store
email, name, or other Clerk-owned profile data in Postgres now.

## Acceptance criteria

- [x] Drizzle schema includes a `users` table keyed by `clerkUserId`
- [x] `users.clerkUserId` is the primary key or unique key used by future
      app-data tables
- [x] User row stores only app-owned metadata: `clerkUserId`, `createdAt`, and
      `updatedAt`
- [x] Server-only repository exposes `ensureUser(clerkUserId)`
- [x] Authenticated tRPC context exposes `clerkUserId`
- [x] Protected procedures call `ensureUser` only when they need a DB-backed
      user anchor
- [x] Unauthenticated code cannot create or read user rows
- [x] Tests cover first authenticated access creating a user row, repeat access
      reusing it, and unauthenticated access being rejected
- [x] No email/name/profile PII is duplicated from Clerk into Postgres
- [x] `bun run --cwd codebase check` passes

## Verification

- Run `bun run --cwd codebase check`
- With local Postgres running and migrations applied, verify an authenticated
  server path creates one `users` row keyed by Clerk user ID and repeat access
  does not duplicate it

## Log

### 2026-07-09 — claimed (agent)

Plan: add a minimal Drizzle `users` table keyed by `clerkUserId`, expose a
server-only `ensureUser(clerkUserId)` repository, and wire a protected tRPC path
that ensures the row only for authenticated callers. Tests will cover first
access, repeat access, unauthenticated rejection, and no Clerk-owned PII copied
into Postgres. Security/privacy checklist applies because this touches auth and
server persistence.

### 2026-07-09 — done

Implemented a minimal Drizzle `users` table keyed by `clerk_user_id`, generated
the committed migration, added the server-only `ensureUser(clerkUserId)`
repository, and exposed protected `users.ensure` as the first DB-backed user
anchor path. Renamed tRPC auth context to `auth.clerkUserId`; `auth.me` remains
auth-only and tests assert it does not ensure a user row. Router tests cover
first authenticated access, repeat access, unconfigured DB, and unauthenticated
rejection before the repository is called. Local Postgres verification used the
documented alternate port 55432: migration succeeded after rerunning outside the
sandbox, `ensureUser("user_task_065_verify")` twice returned one row with only
`clerkUserId`, `createdAt`, and `updatedAt`, then the Compose service was
stopped with the named volume preserved. Review: degraded-mode self-review
because subagent tools are present but current tool policy only permits spawning
when explicitly requested by the user; no findings. Security/privacy checklist:
no secrets, no Clerk email/name/profile duplication, no client-side database
access, and no new dependencies. Verification: focused router test passed and
`bun run --cwd codebase check` passed; Wrangler printed the known sandbox
log-file EPERM noise during build but exited 0.
