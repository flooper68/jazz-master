---
id: TASK-019
title: Dashboard v1
epic: EPIC-012
status: done
depends_on: [TASK-017, TASK-018]
created: 2026-07-05
---

# TASK-019 — Dashboard v1

## Goal

Replace the `/` stub with the product's front door: today's plan with a start button, streak, this week's minutes, and per-area status — the "open app, see everything, start playing" moment.

## Context

Composes what already exists — the TASK-017 plan (with reasons), TASK-013/018 session records — into `codebase/apps/web/src/pages/DashboardPage.tsx`. Suggested layout: today's plan front and center (items, minutes, one primary Start action), a stats row (current streak in days, minutes this week vs time budget), per-area glance (last grades / needs-attention callouts, e.g. "arpeggios: 2 shaky lessons"), and a link into history. Stats derivation is pure functions (unit-tested), components thin. Simple SVG/CSS visuals only — no charting library. Empty states must funnel: no profile → onboarding (TASK-016); profile but no sessions → today's starter plan.

## Acceptance criteria

- [x] Dashboard shows today's plan with reasons and a working Start → runner handoff
- [x] Streak and minutes-this-week computed correctly (unit tests on the derivation functions, incl. timezone/day-boundary cases)
- [x] Per-area status with needs-attention callouts driven by recent grades
- [x] Both empty states behave as specified
- [x] `bun run check` passes

## Verification

`bun run test`. `bun run dev` → with seeded history: dashboard numbers match the sessions; fresh storage: onboarding funnel works end to end.

## Log

### 2026-07-06 — claimed (agent)

Plan:
- Measurable aim (RES-008): baseline — `/` is a leftover fretboard demo stub with no
  product content; target — `/` shows today's plan (with reasons), streak, minutes
  this week vs budget, and per-area status, with Start reaching the runner in one
  click. Verification signal: page tests + manual dev check (seeded vs fresh storage).
- New `apps/web/src/dashboard/` module (mirrors `history/`): pure derivations
  `currentStreakDays`, `minutesThisWeek` (+ weekly budget), `areaStatuses`
  (needs-attention from latest session per lesson, same grade rule as the planner) —
  unit-tested incl. local day-boundary cases via local-time Date constructors.
- Extract the PracticePage plan bootstrapping (stored plan ?? generate + persist)
  into a shared `useTodayPlan` hook so dashboard and practice render the same plan.
- Dashboard Start → `navigate('/practice', { state: { startLessonId } })`;
  PracticePage consumes the handoff state once and auto-starts the run.
- Empty states: no profile is already gated app-wide (App.tsx onboarding gate) —
  verify the funnel lands on the dashboard; no sessions → starter plan + zeroed
  stats with copy nudging the first session.
- Session semantics: minutes-this-week sums `durationSeconds` (time-to-last-grade,
  per INS-014 / TASK-018 precedent); zero-grade abandons don't exist in the store.
- Tests: stats unit tests; DashboardPage page tests (MemoryRouter with dashboard +
  practice routes for the handoff); wrap existing PracticePage tests in MemoryRouter
  (it gains router hooks).

### 2026-07-06 — done

Shipped as planned: `dashboard/dashboardStats.ts` (streak, week minutes, area
statuses, completed-today — 20 unit tests incl. midnight/month-boundary cases),
shared `planner/useTodayPlan` hook, dashboard page (plan + primary Start, stats
row with CSS progress bar, per-area glance, history link), location-state
handoff into the PracticePage runner (consumed once so refresh/back doesn't
restart), and AREA_LABELS deduped into `components/areaLabels.ts`.

Review: `code-reviewer` + `ui-code-reviewer` agents, no must-fix findings.
Applied their quick wins (extracted the repeated link class string; corrected
the useTodayPlan comment's "in sync" wording). Accepted as-is with the
reviewers' own justification: runner-id minting in a useState initializer
(recognized pattern, benign under StrictMode), the theoretical midnight race in
the page test's relative dates (the pure stats tests use fixed dates), the
dashboard persisting today's plan on first render (the intended sync mechanism),
and the type-only PracticeLocationState import from PracticePage.

Verification: `bun run check` green (514 tests). Manual via dev server +
Playwright — fresh storage: onboarding wizard gates `/`, completing it lands on
the dashboard with the starter plan and zeroed stats; Start practicing opened
the planned lesson in the runner, grades persisted; with seeded history (today
38 s shaky, yesterday 600 s, 2 days ago 900 s missed, 8 days ago 1200 s) every
number matched: streak 3 days, 26 of 140 min (8-days-ago excluded), 2 of 5
lessons per area, needs-attention callouts on both areas, plan-complete state
with "Practice again".

Semantics note: minutes-this-week sums `durationSeconds` (time-to-last-grade)
per the documented record contract — noted on INS-014 like TASK-018. Deviation:
none in scope; per-area *trend over time* visuals (epic scope mentions
accuracy/scores) deferred until EPIC-010 scores exist — filed as an insight.
For the next QA review: `/` changed for every user — watch the empty states,
plan/practice consistency, and the stats math against real usage.
