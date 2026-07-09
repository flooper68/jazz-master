---
id: TASK-063
title: Add Clerk auth foundation
epic: EPIC-013
status: backlog
depends_on: [TASK-062]
source: NOTE-013
created: 2026-07-09
---

# TASK-063 — Add Clerk auth foundation

## Goal

Add Clerk authentication to the Astro/Workers app and make authenticated identity
available to tRPC/server code, without migrating product data yet.

## Problem brief

Current condition: The app has tRPC and database infrastructure, but no user
identity; all real practice data is still browser-local.

Desired condition: Signed-in users access `/app/*`, server code can identify the
current Clerk user, and protected tRPC procedures can reject unauthenticated
requests.

Affected user/workflow: Any future server-backed app-data read/write.

Evidence: Owner decision on 2026-07-09: use Clerk, require real local Clerk
keys, redirect signed-out app users to sign-in, and move all current features to
Clerk/Postgres.

Baseline: `/app/*` is accessible without identity and tRPC context has no Clerk
user ID.

Target: `/` remains public, `/app/*` requires sign-in, and protected tRPC
procedures receive an authenticated Clerk user ID.

How we will know it improved: Signed-out app access redirects to sign-in, signed
in app access succeeds, and unauthenticated protected tRPC calls fail.

## Context

Use `@clerk/astro` with Astro middleware. Local dev should require real Clerk
environment keys from `.env`; tests should mock the tRPC auth context directly
and never call Clerk. `dbSmoke` may remain temporarily during foundation work,
but should be removed once real Clerk/Postgres app-data paths exist.

## Acceptance criteria

- [ ] `@clerk/astro` is installed and configured in `apps/web`
- [ ] Required local and production Clerk environment variables are documented
- [ ] Local runtime fails clearly when required Clerk env vars are missing
- [ ] Astro Clerk middleware is added
- [ ] `/` remains public
- [ ] `/app/*` redirects signed-out users to a sign-in page
- [ ] Signed-in app shell exposes a basic account control
- [ ] tRPC context includes authenticated Clerk user ID for protected procedures
- [ ] Protected tRPC procedures reject unauthenticated requests
- [ ] Existing public health procedures stay public; `dbSmoke` is documented as
      temporary until real app-data procedures replace smoke-only DB verification
- [ ] Tests cover authenticated vs unauthenticated tRPC context behavior without
      calling Clerk
- [ ] `bun run --cwd codebase check` passes

## Verification

- Run `bun run --cwd codebase check`
- Start the app with owner-provided Clerk env vars and verify signed-out `/app/*`
  redirects to sign-in
- Sign in and verify `/app/*` renders
- Call a protected tRPC procedure unauthenticated in a test and verify rejection

## Log

### 2026-07-09 — ungated by TASK-062 (agent)

ADR-012 is accepted and the owner provided the required local Clerk environment
values during TASK-062. Status moved from `gated` to `backlog`; no env file is
tracked.
