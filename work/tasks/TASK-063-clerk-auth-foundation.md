---
id: TASK-063
title: Add Clerk auth foundation
epic: EPIC-013
status: done
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

- [x] `@clerk/astro` is installed and configured in `apps/web`
- [x] Required local and production Clerk environment variables are documented
- [x] Local runtime fails clearly when required Clerk env vars are missing
- [x] Astro Clerk middleware is added
- [x] `/` remains public
- [x] `/app/*` redirects signed-out users to a sign-in page
- [x] Signed-in app shell exposes a basic account control
- [x] tRPC context includes authenticated Clerk user ID for protected procedures
- [x] Protected tRPC procedures reject unauthenticated requests
- [x] Existing public health procedures stay public; `dbSmoke` is documented as
      temporary until real app-data procedures replace smoke-only DB verification
- [x] Tests cover authenticated vs unauthenticated tRPC context behavior without
      calling Clerk
- [x] `bun run --cwd codebase check` passes

## Verification

- Run `bun run --cwd codebase check`
- Start the app with owner-provided Clerk env vars and verify signed-out `/app/*`
  redirects to sign-in
- Sign in and verify `/app/*` renders
- Call a protected tRPC procedure unauthenticated in a test and verify rejection

## Log

### 2026-07-09 — done

Installed and configured `@clerk/astro`; added Clerk middleware with a pre-Clerk
runtime env assertion for `PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`;
protected `/app/*` while leaving `/` public; added Clerk `UserButton` to the app
shell; threaded Clerk `userId` from Astro locals into tRPC context; added
`protectedProcedure` and protected `auth.me`; documented Clerk env vars and
`dbSmoke`'s temporary status; updated architecture overview, engineering log,
and wiki. Tests cover missing Clerk env, signed-out app redirect decision,
public health with no auth, unauthenticated protected rejection, and
authenticated `userId` context without calling Clerk.

Review: independent review subagent was not spawned because higher-priority tool
policy requires explicit user delegation; completed the documented degraded
self-review plus security/privacy checklist instead. Security/privacy checklist:
no concerns; no secrets committed; dependency and lockfile change are scoped to
Clerk auth.

Verification: `bun run --cwd codebase check` passed after implementation and
again after the redirect helper refactor (49 test files, 656 tests; build green).
Live local HTTP redirect/sign-in verification could not be completed because no
real Clerk env is present in the workspace or shell, and local Astro
dev/preview ports were not reachable from `curl` in this environment even when
the server reported ready. The signed-out redirect and protected tRPC behaviors
are covered by unit/router tests; a real Clerk sign-in smoke remains the first
thing to check once the owner-provided env is available to the local shell.

### 2026-07-09 — claimed (agent)

Plan: install and configure `@clerk/astro`; add Astro middleware that protects
`/app/*` while keeping `/` public; surface a signed-in account control in the app
shell; thread Clerk user identity into tRPC context with a protected procedure
helper and tests that mock context directly. Verification target: `bun run
--cwd codebase check` plus an agent-runnable signed-out `/app/*` redirect check
with real local Clerk env when available.

### 2026-07-09 — ungated by TASK-062 (agent)

ADR-012 is accepted and the owner provided the required local Clerk environment
values during TASK-062. Status moved from `gated` to `backlog`; no env file is
tracked.
