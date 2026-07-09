---
id: TASK-074
title: Add app-hosted Clerk sign-in and sign-up pages
epic: EPIC-013
status: done
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

- [x] `/sign-in` renders an Astro-owned Clerk `<SignIn />` page
- [x] `/sign-up` renders an Astro-owned Clerk `<SignUp />` page
- [x] Signed-out `/app/*` requests redirect to app-hosted `/sign-in` and
      preserve the return destination
- [x] Sign-in and sign-up cross-links stay on app-hosted routes rather than
      Account Portal
- [x] Successful sign-in and sign-up fall back to `/app` when no explicit return
      destination is present
- [x] The sign-in page exposes Clerk's password recovery/reset path when
      password auth is enabled in the Clerk instance
- [x] Clerk-enabled MFA/2FA and required session tasks are handled by Clerk's
      prebuilt UI, including authenticator app/SMS/backup-code prompts when
      those strategies are configured
- [x] Required Clerk local and production env vars are documented, including
      app-hosted sign-in/sign-up URLs and fallback redirects
- [x] Tests cover route protection/redirect selection without calling Clerk
- [x] `bun run --cwd codebase check` passes

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

### 2026-07-09 - follow-up config (agent)

Owner clarified that the correct Clerk values already exist in the repo-root
gitignored `.env` as `VITE_CLERK_PUBLISHABLE_KEY` plus `CLERK_SECRET_KEY`.
Created an ignored `codebase/apps/web/.env` for local Astro/Clerk runtime using
those values, mapped the publishable key to Clerk Astro's required
`PUBLIC_CLERK_PUBLISHABLE_KEY` name, and configured that publishable key as a
public Worker var in `apps/web/wrangler.jsonc`. The secret key remains local/a
Worker secret only and is not committed. Verification: `bun run --cwd codebase
check` passed, the build output includes the Worker public publishable-key var,
and the ignored app `.env` contains the expected Clerk variable names. Local
Worker preview was not run because the required sandbox escalation was rejected:
the Cloudflare preview runtime would bind an inspector on `0.0.0.0:9229` while
real Clerk keys were loaded.

### 2026-07-09 - done

Added Astro-owned `/sign-in` and `/sign-up` pages using Clerk prebuilt
components, with local cross-links and `/app` fallback redirects. Replaced the
signed-out `/app/*` redirect helper with an app-hosted `/sign-in` redirect that
preserves the requested app path in Clerk's `redirect_url` parameter, and added
tests for direct app-route redirect selection and query-string preservation
without calling Clerk. Documented the required app-hosted Clerk URL/fallback env
vars in `apps/web/README.md`, updated architecture/wiki docs, and corrected the
current `dbSmoke` documentation to match the restored observability probe.

Review: independent review subagent was not spawned because the available
subagent tool forbids spawning unless the user explicitly asks for delegation;
completed the documented degraded self-review instead. Findings fixed before
ship: README/wiki/architecture `dbSmoke` wording was stale/inconsistent with
ISSUE-008's restored public observability probe. Security/privacy checklist: no
concerns; no secrets or private data committed; auth redirects are same-origin
and use a return path derived from the current request, not user-supplied
external input.

Verification: focused `bun run --cwd codebase test --
apps/web/src/server/auth/appRouteAuth.test.ts` passed (18 tests). Final
`bun run --cwd codebase check` passed (49 test files, 670 tests, build green).
Wrangler still emits a sandbox EPERM warning when trying to write its log under
`~/Library/Preferences/.wrangler`, but the build exits 0. Local live Clerk smoke
steps for rendering `/sign-in`/`/sign-up`, test-mode sign-up/sign-in, password
recovery, and MFA/session-task prompts were not run because this shell has no
`PUBLIC_CLERK_PUBLISHABLE_KEY`, no `CLERK_SECRET_KEY`, and no local web `.env`.
Those flows are delegated to Clerk's prebuilt UI per RES-020 and should be smoke
checked when owner-provided Clerk development keys are present.

### 2026-07-09 - claimed (agent)

Plan: add Astro-owned `/sign-in` and `/sign-up` pages using Clerk prebuilt
components; update the existing app-route auth redirect helper so signed-out
`/app/*` requests target `/sign-in` with the requested app path preserved;
document the app-hosted Clerk URL and fallback redirect env vars; add focused
tests around redirect URL selection without calling Clerk. Security/privacy
review applies because this is auth entry-point work; target verification is
`bun run --cwd codebase check` plus the task's Clerk smoke steps where local
owner-provided keys are available.

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
