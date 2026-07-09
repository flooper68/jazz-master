---
id: TASK-065
title: Add Clerk-keyed user database anchor
epic: EPIC-013
status: backlog
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

- [ ] Drizzle schema includes a `users` table keyed by `clerkUserId`
- [ ] `users.clerkUserId` is the primary key or unique key used by future
      app-data tables
- [ ] User row stores only app-owned metadata: `clerkUserId`, `createdAt`, and
      `updatedAt`
- [ ] Server-only repository exposes `ensureUser(clerkUserId)`
- [ ] Authenticated tRPC context exposes `clerkUserId`
- [ ] Protected procedures call `ensureUser` only when they need a DB-backed
      user anchor
- [ ] Unauthenticated code cannot create or read user rows
- [ ] Tests cover first authenticated access creating a user row, repeat access
      reusing it, and unauthenticated access being rejected
- [ ] No email/name/profile PII is duplicated from Clerk into Postgres
- [ ] `bun run --cwd codebase check` passes

## Verification

- Run `bun run --cwd codebase check`
- With local Postgres running and migrations applied, verify an authenticated
  server path creates one `users` row keyed by Clerk user ID and repeat access
  does not duplicate it
