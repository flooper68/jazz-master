---
id: TASK-018
title: Practice history page
epic: EPIC-012
status: backlog
depends_on: [TASK-013]
created: 2026-07-05
---

# TASK-018 — Practice history page

## Goal

Every past practice session is findable and inspectable: a history page listing sessions by day with drill-down into exercises and grades.

## Context

Consumes the session records TASK-013 persists (the record shape is defined there; extend it only if display forces it, and then in agreement with the runner). Needs a route + nav entry (`/history`). Keep it read-only and fast: group by day, show lesson title, duration, grade summary (e.g. 5 ✓ / 2 ~ / 1 ✗); expanding a session shows per-exercise grades. Reserve visual space for scores (EPIC-010) without building for them. Simple filters: by area, and a date-range or "last 7/30 days" toggle — no charting libraries.

## Acceptance criteria

- [ ] `/history` route with nav link; sessions grouped by day, newest first
- [ ] Session drill-down shows per-exercise self-grades; incomplete sessions visibly marked
- [ ] Area filter and a time-range filter work
- [ ] Sensible empty state pointing a new user at practice
- [ ] Component tests with fixture sessions (grouping, filtering, empty state)
- [ ] `bun run check` passes

## Verification

`bun run test`. `bun run dev` → run two lessons via the runner, find both in history with correct grades.
