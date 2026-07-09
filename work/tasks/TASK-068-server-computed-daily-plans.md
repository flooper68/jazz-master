---
id: TASK-068
title: Move daily planning to server-computed tRPC
epic: EPIC-013
status: done
depends_on: [TASK-067]
source: NOTE-013
created: 2026-07-09
---

# TASK-068 — Move daily planning to server-computed tRPC

## Goal

Remove `dailyPlansStore` localStorage and make today's plan a server-computed
authenticated tRPC result derived from Postgres profile, Postgres session
history, and curriculum.

## Problem brief

Current condition: Daily plan snapshots can be stored in browser storage.

Desired condition: Daily planning is server-owned and recomputed on request from
durable profile/session state.

Affected user/workflow: Dashboard and practice page plan/progress display.

Evidence: Owner decision on 2026-07-09: choose server-computed daily plans
rather than a `daily_plans` table.

Baseline: Product code imports `dailyPlansStore`.

Target: Practice and dashboard pages receive today's plan/progress via
authenticated tRPC, with no localStorage plan state.

How we will know it improved: Clearing browser storage does not change today's
plan/progress after sign-in.

## Context

No `daily_plans` table should be created initially. Add persistence later only
if stable day snapshots become a real product need.

Existing local daily plans are intentionally ignored.

## Acceptance criteria

- [x] Authenticated tRPC exposes a today-plan/planner endpoint
- [x] Server planner reads profile from Postgres
- [x] Server planner reads session history/progress from Postgres
- [x] Server planner uses the existing curriculum/lesson model
- [x] Practice page reads today's plan through tRPC
- [x] Dashboard reads today's plan/progress through tRPC
- [x] Product code no longer imports or uses `dailyPlansStore`
- [x] `dailyPlansStore` tests are removed or replaced with server planner, tRPC,
      and page tests
- [x] Clearing browser storage does not change today's plan after sign-in
- [x] Tests cover baseline plan, session-influenced progress, missing profile
      behavior, and repeated reads
- [x] Existing local daily plans are ignored; no import bridge is added
- [x] `bun run --cwd codebase check` passes

## Verification

- Run `bun run --cwd codebase check`
- With local Postgres running and migrations applied, verify signed-in dashboard
  and practice pages show a plan derived from profile and session rows, then
  clear browser storage and verify the same server-computed state returns

## Log

### 2026-07-09 — claimed (agent)

Plan: keep the existing pure `generatePlan` logic, add a protected `planner.today`
tRPC procedure that reads the authenticated profile and session history from the
server repositories, switch dashboard/practice plan reads to that procedure,
remove the daily-plan localStorage store and backup/import handling, and replace
local-store tests with router/page tests proving server-derived plans and legacy
local plan data being ignored.

### 2026-07-09 — done (agent)

Implemented protected `planner.today` as the server-computed daily plan path. It
reads the authenticated Clerk/Postgres profile and session history, uses the
existing curriculum and pure `generatePlan` engine, and accepts the browser's
local `yyyy-mm-dd` plan date so server UTC boundaries do not advance a user's
day early. Dashboard and Practice now read plan/progress through this tRPC
result and show planner loading/error states distinctly from the legitimate
empty-plan prompt.

Removed `dailyPlansStore`, its tests, exports, and backup/import participation.
Legacy `jazz-master:daily-plans` browser data and legacy daily-plan backup keys
are intentionally ignored with no import bridge.

Independent review found two issues before completion: server wall-clock date
could disagree with the user's local day, and planner errors were collapsed into
an empty plan. Both were fixed and covered with router/page tests. Security
review found no new sensitive data exposure; the change narrows browser storage
by deleting plan snapshots and preserves authenticated tRPC boundaries.

The required e2e smoke pass exposed two follow-up app/test issues: session
upserts must still invalidate `sessions.list` for History, and Done must wait
for the final completed session upsert before leaving the runner summary. Both
were fixed. The e2e suite now uses an explicit development-only Playwright auth
header and local sample-audio stub so it can exercise the Clerk-protected app
without real Clerk credentials or third-party audio network dependence.

Verification:

- `bun run --cwd codebase test -- apps/web/src/server/trpc/router.test.ts apps/web/src/app/pages/DashboardPage.test.tsx apps/web/src/app/pages/PracticePage.test.tsx apps/web/src/storage/backup.test.ts` passed: 51 tests.
- `bun run --cwd codebase check` passed: typecheck, lint, 680 tests, and build.
- `CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE=postgresql://jazz_master:jazz_master@127.0.0.1:55432/jazz_master bun run --cwd codebase check:e2e` passed: 6 Playwright smoke tests. The first non-escalated e2e attempt failed because the Cloudflare dev plugin could not bind its inspector port in the sandbox; the passing run used escalation and the local Hyperdrive/Postgres connection string.
- Local Postgres verification passed after migrations: `planner.today` returned
  a plan from real profile/session repositories and prioritized the missed
  server session.
- Real Clerk sign-in browser verification was not completed because this
  environment has no Clerk test login. Page tests exercise the dashboard and
  practice flows through the real route tree and in-process tRPC fetch, including
  localStorage clearing/legacy-key behavior; e2e exercises the protected app via
  the explicit Playwright auth seam.

Known verification noise: Vitest prints existing jsdom canvas `getContext`
warnings from notation tests, and Wrangler prints a sandboxed debug-log write
warning during build; both commands exited 0.
