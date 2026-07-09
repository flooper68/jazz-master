---
id: TASK-074
title: Add app-hosted Clerk sign-in and sign-up pages
epic: EPIC-013
status: backlog
priority: blocker
depends_on: [TASK-063]
source: owner request 2026-07-09
research: RES-020
created: 2026-07-09
---

# TASK-074 - Add app-hosted Clerk sign-in and sign-up pages

## Goal

Make Jazz Master's Clerk auth entry points fully app-hosted so signed-out users
can sign in, sign up, recover passwords, and complete Clerk-required second
factor/session-task flows without relying on Clerk Account Portal.

## Problem brief

Current condition: `/app/*` is protected by Clerk, but signed-out users are
redirected through Clerk's default sign-in behavior. With Account Portal
disabled in the Clerk dashboard and no local `/sign-in` route, users see a
development 404 instead of a usable login screen.

Desired condition: Astro owns `/sign-in` and `/sign-up` pages that render
Clerk's prebuilt auth UI, Clerk redirects target those local pages, and users
can complete the Clerk-configured sign-in, sign-up, password recovery, and
MFA/session-task paths before returning to `/app`.

Affected user/workflow: First app entry, returning signed-out app access,
account creation, password recovery, and any user with Clerk MFA/2FA enabled or
required.

Evidence: Owner reported the Clerk development 404 on 2026-07-09 after Account
Portal was disabled. RES-020 confirms Clerk requires app-owned flows when
Account Portal is disabled.

Baseline: Visiting `/app/*` signed out can redirect to a missing or
Account-Portal-backed sign-in page.

Target: Visiting `/app/*` signed out lands on the app's `/sign-in` page, all
auth links stay on app-hosted routes, and successful auth returns the user to
the requested app route or `/app`.

How we will know it improved: A signed-out browser can reach `/sign-in`, switch
to `/sign-up`, complete Clerk test-mode sign-up/sign-in, exercise password
recovery where enabled, see/complete any Clerk MFA or session-task prompt, and
arrive in the protected app without seeing Clerk's Account Portal 404.

## Context

Research: `research/RES-020-clerk-app-hosted-auth-pages.md`.

Use Clerk's prebuilt Astro components rather than custom auth flows. Clerk
documents custom flows as advanced and explicitly requires extra MFA handling
for custom sign-in; the prebuilt components are controlled by Clerk Dashboard
settings and display required session tasks.

Likely code/docs:

- `codebase/apps/web/src/pages/sign-in.astro`
- `codebase/apps/web/src/pages/sign-up.astro`
- `codebase/apps/web/src/middleware.ts`
- `codebase/apps/web/src/server/auth/appRouteAuth.ts`
- `codebase/apps/web/src/server/auth/appRouteAuth.test.ts`
- `codebase/apps/web/src/server/auth/clerkEnv.ts`
- `codebase/apps/web/README.md`

Preserve ADR-006 route ownership: Astro owns `/sign-in` and `/sign-up`; the
React/TanStack app still owns only `/app/*`.

## Acceptance criteria

- [ ] `/sign-in` renders an Astro-owned Clerk `<SignIn />` page
- [ ] `/sign-up` renders an Astro-owned Clerk `<SignUp />` page
- [ ] Signed-out `/app/*` requests redirect to app-hosted `/sign-in` and
      preserve the return destination
- [ ] Sign-in and sign-up cross-links stay on app-hosted routes rather than
      Account Portal
- [ ] Successful sign-in and sign-up fall back to `/app` when no explicit return
      destination is present
- [ ] The sign-in page exposes Clerk's password recovery/reset path when
      password auth is enabled in the Clerk instance
- [ ] Clerk-enabled MFA/2FA and required session tasks are handled by Clerk's
      prebuilt UI, including authenticator app/SMS/backup-code prompts when
      those strategies are configured
- [ ] Required Clerk local and production env vars are documented, including
      app-hosted sign-in/sign-up URLs and fallback redirects
- [ ] Tests cover route protection/redirect selection without calling Clerk
- [ ] `bun run --cwd codebase check` passes

## Verification

- Run `bun run --cwd codebase check`
- Start the app with owner-provided Clerk development keys and documented auth
  URL env vars
- Visit `/sign-in` and `/sign-up` directly and verify both render without
  redirecting to Account Portal
- In a signed-out browser, visit `/app/practice` and verify the response lands
  on `/sign-in` with a return path back to `/app/practice`
- Use Clerk test-mode identifiers and code `424242` where applicable to verify
  sign-up and sign-in complete and return to `/app`
- With password auth enabled, start the forgot-password/recovery path from
  `/sign-in` and verify it stays within the app-hosted Clerk UI
- If the development Clerk instance has MFA enabled or required, sign in as an
  MFA-enrolled test user and verify the second-factor or `setup-mfa` prompt is
  shown and completable inside `/sign-in`

## Log

### 2026-07-09 - filed and prioritized (agent)

Owner reported the Clerk Account Portal-disabled 404 and requested full
app-hosted sign-in/sign-up pages with reset-password and 2FA coverage. RES-020
completed first using official Clerk docs. Priority set to `blocker` because
protected `/app/*` access can fail before users reach the practice app; this
should run before the remaining Clerk/Postgres migration chain.

Review: independent review subagent was not spawned because the available
subagent tool in this session forbids spawning unless the user explicitly asks
for delegation; completed the documented degraded self-review. No findings:
scope is knowledge/tracker only, no secrets or code changes, RES/TASK/EPIC
links are consistent, and the task remains backlog with unchecked future
implementation criteria.

Verification: `bun run --cwd codebase check` passed (49 test files, 669 tests,
build green). Wrangler emitted a sandbox warning while trying to write its log
under `~/Library/Preferences/.wrangler`, but the build exited successfully.
