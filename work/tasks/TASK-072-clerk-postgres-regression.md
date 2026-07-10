---
id: TASK-072
title: Run Clerk/Postgres migration regression pass
epic: EPIC-013
status: done
depends_on: [TASK-071]
source: NOTE-013
created: 2026-07-09
---

# TASK-072 — Run Clerk/Postgres migration regression pass

## Goal

Verify the complete migration after all slices are moved: app access requires
Clerk, all current features use Postgres, and clearing browser storage does not
lose product data.

## Problem brief

Current condition: The migration touches auth, routing, tRPC, database schema,
and every current app-data workflow.

Desired condition: The full signed-in practice loop works against Clerk/Postgres
with no localStorage-backed product data.

Affected user/workflow: Sign-in, onboarding/profile, practice, scoring, history,
dashboard, notation, play-along, and preferences.

Evidence: Owner decision on 2026-07-09: migrate all current features to
Clerk/Postgres and retire localStorage.

Baseline: Earlier tasks verify slices independently.

Target: End-to-end regression verifies the whole migrated product surface.

How we will know it improved: A signed-in user can complete the current product
loop, clear browser storage, reload, and recover product state from Postgres.

## Context

Keep this as a real task rather than relying only on per-slice verification,
because this migration crosses auth, DB, routing, tRPC, and all product
workflows.

## Acceptance criteria

- [x] Regression checklist covers signed-out `/app/*` redirect to sign-in
- [x] Signed-in user can complete onboarding/profile setup
- [x] Profile survives browser storage clearing
- [x] Signed-in user can start and complete a practice session
- [x] Incomplete/abandoned session persists
- [x] Grades and machine scores persist
- [x] History shows server-backed sessions
- [x] Dashboard stats and today's plan reflect server-backed profile/session
      data
- [x] Notation display preference persists
- [x] Scoring tolerance preference persists
- [x] Per-exercise play-along tempo persists
- [x] Backup/import UI is absent
- [x] `rg localStorage codebase/apps/web/src` shows no product persistence usage
- [x] `rg defineStore codebase/apps/web/src` returns no usage
- [x] `bun run --cwd codebase check` passes
- [x] Playwright or manual browser regression verifies a clear-storage/reload
      path

## Verification

- Run `bun run --cwd codebase check`
- Run `rg localStorage codebase/apps/web/src`
- Run `rg defineStore codebase/apps/web/src`
- Run the app with local Postgres and Clerk env vars, exercise the signed-in
  regression checklist, clear browser storage, reload, and confirm product state
  returns from Postgres

## Log

### 2026-07-10 — claimed (Codex)

Plan: refresh the regression pack for the completed Clerk/Postgres migration;
run the automated gate and current e2e suite; exercise signed-out auth plus the
full signed-in onboarding, practice, history, dashboard, scoring, play-along,
and preference flows against local Postgres; clear browser storage and verify
server-backed state returns; fix or file any reproducible findings; then obtain
an independent review and ship the tracker, regression evidence, and any
in-scope fixes together. Baseline: each migration slice was verified in
isolation. Target: one end-to-end browser run proves the current product loop
and durable state recovery after browser storage is cleared.

### 2026-07-10 — regression verified (Codex)

Compiled `work/REGRESSION.md` and ran every migration scenario. The in-app
browser confirmed signed-out `/app` redirects to app-hosted `/sign-in` with the
return URL. The expanded Playwright pack now completes all onboarding steps,
finishes a planned lesson, verifies History/Dashboard, persists an abandoned
session, changes notation/scoring/tempo preferences, clears local and session
storage, reloads, and confirms all server-backed state returns; it also proves
backup/import controls are absent. The final run passed 7/7 Chromium tests at
desktop and 375×812.

A fresh-connection local Postgres round-trip restored the profile, all three
preferences, a completed score of 92 with one normalized per-note result, and
an incomplete session. `rg` found no `localStorage` or `defineStore` usage in
product source. `bun run --cwd codebase check` passed typecheck, lint, 44 test
files/663 tests, and production build. Security/privacy checklist: no concerns;
the regression adds no production data path, dependency, secret, or permission.

Verification deviations/noise: real Clerk credentials were not entered; the
signed-in browser flows used the repository's production-disabled test-auth
seam while real Clerk env configuration remained loaded. The first sandboxed
migration attempt could not reach localhost and passed after approved
escalation. One expanded e2e attempt reused a manually started real-Clerk server
without the test-auth flag and correctly redirected all app tests to sign-in;
after stopping that server, two consecutive suite-owned runs passed. Vitest
printed the existing jsdom canvas warnings and Wrangler printed its known
sandbox log-file warning; the gate exited 0.

### 2026-07-10 — independent review

Review found two reproducibility gaps and one evidence gap. Fixed the setup to
bind Compose consistently on port 55432 and added the repeatable
`bun run --cwd codebase regression:db` command for real Postgres profile,
preference, machine-score, normalized-note, and incomplete-session round trips.
The remaining gap is an actual Clerk session: the signed-in e2e coverage uses
the production-disabled test-auth seam, so the two explicitly signed-in criteria
remain unchecked until an owner-controlled Clerk test account exercises the
middleware identity handoff. No security/privacy findings.

### 2026-07-10 — owner Clerk setup and real-session attempt

Mapped the owner-provided Next.js publishable value to Jazz Master's
`PUBLIC_CLERK_PUBLISHABLE_KEY`, updated the ignored Astro `.env`, added ignored
Wrangler `.dev.vars`, and updated Wrangler's committed public var. Documented
the dedicated `premysl.ciompa+test@gmail.com` account for manual and automated
testing. By explicit owner decision, its disposable password is intentionally
public in `.env.example` and the web README; it must be rotated or removed if
the account ever gains private data or privileges.

The real Clerk browser flow reached `/sign-in/factor-one` and exposed
ISSUE-010: nested Clerk path states fell through to the app 404. Fixed with
shared auth views and Astro rest routes for `/sign-in/*` and `/sign-up/*`; the
seven-test browser pack now guards both route families and passes. Clerk then
rejected `test` under compromised-password protection. The email-code method
remains app-hosted, but the development code `424242` is not valid for this
ordinary Gmail alias. The two real signed-in criteria remain open pending the
actual emailed one-time code or an owner-side Clerk policy/account change.

### 2026-07-10 — real Clerk/Postgres regression completed

Completed the real identity handoff with a five-minute Clerk Backend API
sign-in token for the dedicated `premysl.ciompa+test@gmail.com` user. The
app-hosted `/sign-in` route consumed the token and returned to `/app` without
the synthetic test-auth header. In that real Clerk session, the user completed
all onboarding steps with a 30-minute profile, reloaded to prove the profile
and plan returned from Postgres, completed the three-exercise Major scale I
lesson with persisted grades, and returned to the updated Practice plan. The
browser reported no console errors; server logs recorded successful protected
tRPC requests.

The owner-requested public password value remains committed, but Clerk's
current compromised-password protection does not accept `test` for password
sign-in. Real-Clerk scenarios must therefore use an emailed OTP or a short-lived
Backend API sign-in token until the owner changes the tenant policy or test
password. This does not affect the verified Clerk identity or Postgres data
path.

Final-review fixes: Playwright now refuses to reuse an arbitrary local server,
so the development-only test-auth flags cannot silently be omitted. The
existing `responsive.spec.ts` run is explicitly documented as the 375×812
overflow assertion across landing, onboarding, dashboard, practice, history,
and profile. The final suite-owned e2e run passed 7/7, the repeatable database
regression restored profile/preferences/score 92/normalized note/incomplete
session through fresh connections, and the full gate passed 44 files/663 tests
plus production build. Independent review findings are resolved.
