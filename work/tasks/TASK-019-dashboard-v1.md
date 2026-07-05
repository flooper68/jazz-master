---
id: TASK-019
title: Dashboard v1
epic: EPIC-012
status: backlog
depends_on: [TASK-017, TASK-018]
created: 2026-07-05
---

# TASK-019 — Dashboard v1

## Goal

Replace the `/` stub with the product's front door: today's plan with a start button, streak, this week's minutes, and per-area status — the "open app, see everything, start playing" moment.

## Context

Composes what already exists — the TASK-017 plan (with reasons), TASK-013/018 session records — into `codebase/apps/web/src/pages/DashboardPage.tsx`. Suggested layout: today's plan front and center (items, minutes, one primary Start action), a stats row (current streak in days, minutes this week vs time budget), per-area glance (last grades / needs-attention callouts, e.g. "arpeggios: 2 shaky lessons"), and a link into history. Stats derivation is pure functions (unit-tested), components thin. Simple SVG/CSS visuals only — no charting library. Empty states must funnel: no profile → onboarding (TASK-016); profile but no sessions → today's starter plan.

## Acceptance criteria

- [ ] Dashboard shows today's plan with reasons and a working Start → runner handoff
- [ ] Streak and minutes-this-week computed correctly (unit tests on the derivation functions, incl. timezone/day-boundary cases)
- [ ] Per-area status with needs-attention callouts driven by recent grades
- [ ] Both empty states behave as specified
- [ ] `bun run check` passes

## Verification

`bun run test`. `bun run dev` → with seeded history: dashboard numbers match the sessions; fresh storage: onboarding funnel works end to end.
