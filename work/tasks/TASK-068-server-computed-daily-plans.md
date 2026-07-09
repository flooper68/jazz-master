---
id: TASK-068
title: Move daily planning to server-computed tRPC
epic: EPIC-013
status: backlog
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

- [ ] Authenticated tRPC exposes a today-plan/planner endpoint
- [ ] Server planner reads profile from Postgres
- [ ] Server planner reads session history/progress from Postgres
- [ ] Server planner uses the existing curriculum/lesson model
- [ ] Practice page reads today's plan through tRPC
- [ ] Dashboard reads today's plan/progress through tRPC
- [ ] Product code no longer imports or uses `dailyPlansStore`
- [ ] `dailyPlansStore` tests are removed or replaced with server planner, tRPC,
      and page tests
- [ ] Clearing browser storage does not change today's plan after sign-in
- [ ] Tests cover baseline plan, session-influenced progress, missing profile
      behavior, and repeated reads
- [ ] Existing local daily plans are ignored; no import bridge is added
- [ ] `bun run --cwd codebase check` passes

## Verification

- Run `bun run --cwd codebase check`
- With local Postgres running and migrations applied, verify signed-in dashboard
  and practice pages show a plan derived from profile and session rows, then
  clear browser storage and verify the same server-computed state returns
