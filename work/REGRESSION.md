# Regression Pack

Living manual/browser regression checklist for Jazz Master. Maintained by
`processes/regression-testing.md`.

## Status

Compiled and first run completed on 2026-07-10 for TASK-072. The P0 pack
covers public/auth entry, onboarding, the complete guided-practice loop, and
server-backed recovery after browser storage is cleared.

## Global setup

1. Start the repo-owned Postgres service and apply migrations. Port `55432` is
   the documented fallback when `5432` is occupied.
2. Keep real Clerk keys in `codebase/apps/web/.env`; never copy them into this
   pack or test output.
3. Run the automated gate and e2e pack:

```sh
JAZZ_MASTER_POSTGRES_PORT=55432 docker compose up -d
DATABASE_URL=postgresql://jazz_master:jazz_master@127.0.0.1:55432/jazz_master bun run --cwd codebase db:migrate
DATABASE_URL=postgresql://jazz_master:jazz_master@127.0.0.1:55432/jazz_master bun run --cwd codebase regression:db
bun run --cwd codebase check
CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE=postgresql://jazz_master:jazz_master@127.0.0.1:55432/jazz_master DATABASE_URL=postgresql://jazz_master:jazz_master@127.0.0.1:55432/jazz_master bun run --cwd codebase check:e2e
```

The e2e server enables the explicit development-only test-auth seam and uses a
fresh Clerk-shaped user ID per test. Production rejects that seam. For a real
Clerk session, start `bun run --cwd codebase dev` with the same local
Hyperdrive connection and use the dedicated
`premysl.ciompa+test@gmail.com` account. Its intentionally public, test-only
credential is documented in `codebase/apps/web/.env.example` and README; never
reuse it for a privileged or data-bearing account. Clerk currently rejects the
literal `test` password as compromised, so real identity checks use an emailed
OTP or a short-lived Backend API sign-in token until the owner changes the
tenant policy or test password.

Storage reset convention: clear `localStorage` and `sessionStorage`, retain the
current test identity, reload, and prove product state returns from Postgres.
This tests data durability rather than Clerk session persistence.

## Scenario table

| ID | Priority | Area | Source tasks | Preconditions | Steps | Expected result | Failure evidence |
|---|---|---|---|---|---|---|---|
| AUTH-01 | P0 | Public/auth routing | TASK-063, TASK-074, TASK-075 | Real Clerk env configured; signed out | Open `/`; follow app entry or open `/app` directly | Landing links to app-hosted auth; `/app` redirects to `/sign-in?redirect_url=%2Fapp` | Final URL, response status/location, console/network errors |
| AUTH-02 | P0 | Real Clerk identity handoff | TASK-063, TASK-066, TASK-072 | Real Clerk env configured; dedicated test account plus a valid OTP or short-lived sign-in token | Sign in through app-hosted `/sign-in`; complete or edit the profile; reload and open another protected app route | Clerk sign-in returns to `/app`; protected tRPC reads/writes use the Clerk user ID and Postgres state returns without the synthetic auth header | Final URL, visible profile state, failed Clerk/tRPC requests, sanitized server log |
| PROFILE-01 | P0 | Onboarding/profile | TASK-016, TASK-066 | Fresh authenticated test user | Open `/app/practice`; complete all three onboarding steps; choose 30 min/day | Practice app opens without the onboarding gate; profile is written for the authenticated user | Failing step/control, profile tRPC response, server log |
| PRACTICE-01 | P0 | Guided practice | TASK-013, TASK-049, TASK-067, TASK-068 | PROFILE-01 complete | Start the first planned lesson; verify notation; begin/end and grade every exercise; finish | Lesson summary appears; History shows a completed session; Dashboard shows a one-day streak and completed lesson progress | Lesson/exercise ID, route, console/network errors, history row |
| DURABLE-01 | P0 | Server persistence | TASK-066 through TASK-072 | Fresh authenticated test user; local Postgres | Start a planned lesson; set staff-only notation, strict scoring, and 72 BPM; grade one exercise; clear local/session storage; reload | Onboarding stays complete; the same plan returns; all three preferences return; History shows the abandoned session as incomplete | User ID, preference/session rows, failed tRPC response, route after reload |
| SCORE-01 | P1 | Scores/normalized details | TASK-041 through TASK-043, TASK-067 | Local Postgres; migrations applied | Run `DATABASE_URL=postgresql://jazz_master:jazz_master@127.0.0.1:55432/jazz_master bun run --cwd codebase regression:db` | Score `92`, component/tolerance metadata, and ordered per-note detail round-trip through fresh repository connections; another incomplete session remains incomplete | Command output and repository error; never raw audio |
| PROFILE-02 | P1 | Data-retirement UI | TASK-070, TASK-071 | Authenticated profile exists | Open `/app/profile`; inspect the data section; search product source for `localStorage` and `defineStore` | Data sync copy is visible; export/import controls are absent; both source searches have no product persistence matches | Visible stale control/copy and matching source path |
| RESPONSIVE-01 | P1 | Mobile shell | ISSUE-001, TASK-035 | Test-auth app available at 375×812 | Open landing, onboarding, dashboard, practice, history, and profile | No page has horizontal overflow | Route, viewport, screenshot, scroll/client widths |

## Run matrix

- Every regression run: AUTH-01, PROFILE-01, PRACTICE-01, DURABLE-01.
- Auth/persistence migrations and Clerk configuration changes: also AUTH-02.
- Storage/auth/practice changes: also SCORE-01 and PROFILE-02.
- Layout/navigation changes or periodic QA: also RESPONSIVE-01.
- Recording/scoring algorithm changes: run SCORE-01 plus the scoring unit
  fixtures; real microphone/device quality remains QA/product-review coverage.

## Latest run — 2026-07-10

- Commit tested: `31f999c` plus the TASK-072 regression-only diff.
- Commands: local migrations passed; `bun run --cwd codebase check` passed
  (44 files, 663 tests, typecheck, lint, production build); expanded
  `check:e2e` passed (7 Chromium tests, including nested Clerk routes).
- Browser/viewport: Codex in-app browser for signed-out and real Clerk identity
  handoff; Playwright Chromium desktop plus the `responsive.spec.ts` 375×812
  overflow run; local Postgres on port `55432`.
- Scenarios run: AUTH-01, AUTH-02, PROFILE-01, PRACTICE-01,
  DURABLE-01, SCORE-01, PROFILE-02, RESPONSIVE-01.
- Evidence: signed-out `/app` redirected to app-hosted sign-in; a short-lived
  Clerk sign-in token for the dedicated account returned through app-hosted
  `/sign-in` to `/app` without synthetic auth; that real session completed a
  30-minute profile, reloaded it from Postgres, and completed a three-exercise
  lesson with persisted grades and no browser errors. E2e storage clearing
  preserved profile, plan, notation/scoring/tempo preferences, and an
  incomplete session; a fresh Postgres repository round-trip restored a
  completed machine score `92`, one normalized note result, and an incomplete
  session.
- Scenarios skipped: real microphone/device scoring quality, which remains
  QA/product-review coverage. Interactive password sign-in remains unavailable
  because Clerk rejects the owner-approved `test` password as compromised;
  email OTP and short-lived sign-in tokens remain the supported test paths.
- Findings filed: ISSUE-010 fixed the nested Clerk factor-route 404. ISSUE-009
  was already fixed by TASK-068's Clerk-aware test-auth harness and is closed by
  this run.
- Result: pass. TASK-072 and EPIC-013 are complete.
