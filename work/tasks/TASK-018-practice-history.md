---
id: TASK-018
title: Practice history page
epic: EPIC-012
status: done
depends_on: [TASK-013]
created: 2026-07-05
---

# TASK-018 — Practice history page

## Goal

Every past practice session is findable and inspectable: a history page listing sessions by day with drill-down into exercises and grades.

## Context

Consumes the session records TASK-013 persists (the record shape is defined there; extend it only if display forces it, and then in agreement with the runner). Needs a route + nav entry (`/history`). Keep it read-only and fast: group by day, show lesson title, duration, grade summary (e.g. 5 ✓ / 2 ~ / 1 ✗); expanding a session shows per-exercise grades. Reserve visual space for scores (EPIC-010) without building for them. Simple filters: by area, and a date-range or "last 7/30 days" toggle — no charting libraries.

## Acceptance criteria

- [x] `/history` route with nav link; sessions grouped by day, newest first
- [x] Session drill-down shows per-exercise self-grades; incomplete sessions visibly marked
- [x] Area filter and a time-range filter work
- [x] Sensible empty state pointing a new user at practice
- [x] Component tests with fixture sessions (grouping, filtering, empty state)
- [x] `bun run check` passes

## Verification

`bun run test`. `bun run dev` → run two lessons via the runner, find both in history with correct grades.

## Log

### 2026-07-06 — claimed (agent)

Plan: read-only `/history` page consuming the TASK-013 `sessions` store as-is (no record changes). Pure view logic in `apps/web/src/history/sessionHistory.ts` (mirrors `planner/`): filter by area (via lessonId → lesson lookup) and time range (all / last 7 / last 30 calendar days, local dates via `toPlanDate` — consistent with PracticePage's day grouping), group by local day newest-first, grade tally per session. `pages/HistoryPage.tsx` renders day groups → session rows (lesson title from content with lessonId fallback, duration, `✓/~/✗` tally with sr-only words, "Incomplete" badge, `score` shown only when present — reserved slot, nothing built) with a drill-down toggle (aria-expanded) listing per-exercise grades. Filters as labelled selects. Empty states: no sessions → pointer to `/practice`; filters match nothing → distinct message. Route + nav entry in `App.tsx`/`Layout.tsx`. Tests: unit tests on the pure helpers (grouping order, range cutoffs, area filter, unknown lessonId) + component tests with fixture sessions (grouping, filtering, drill-down, incomplete marking, both empty states). Measurable aim: baseline = persisted sessions are invisible except as devtools JSON; target = every session findable on `/history` and inspectable to per-exercise grades — signal is the component tests plus a manual two-lesson dev run per Verification. INS-014 note: history displays `durationSeconds` (time-to-last-grade) as the session duration, matching the field's documented semantics; zero-grade abandons persist nothing so they rightly don't appear.

### 2026-07-06 — done

Shipped as planned; all criteria verified. Session record untouched. Tests: 13 unit tests on the pure helpers (grouping order, calendar-day range cutoffs, area filter incl. unknown-lesson exclusion, tally, duration/time formatting) + 8 HistoryPage component tests (day grouping, drill-down with aria-expanded, incomplete marking with "N of M graded", area + range filters, both empty states, orphaned lesson/exercise-id fallbacks) + the `/history` route/nav rows in App.test.tsx — `bun run check` green (489 tests). Manual verification in the dev server (Playwright): ran "Major scale I" (got-it/shaky/missed) and "Maj7 arpeggios" (all got-it) end to end; both appeared on `/history` under today with exact tallies and per-exercise grades on drill-down; a pre-existing abandoned run showed the Incomplete badge; area filter narrowed correctly. Review: `code-reviewer` + `ui-code-reviewer` passes, no must-fix. Fixed from review: DST-safe calendar-day range cutoff (`setDate` instead of fixed 24h blocks), details-button accessible name now contains its visible text in both states (WCAG 2.5.3), `formatTime` zero-pads hours and moved to the history module beside `formatDuration`, `formatDuration` rounds fractional seconds, exercise-id fallback got test coverage. Left as-is per reviewer judgment: `aria-controls` pointing at the collapsed-away region (APG tolerates it), the guarded reserved `score` slot (task asks to reserve space). EPIC-012 set in-progress (first task shipped — INS-012 precedent); wiki `product/overview` + `architecture/overview.md` updated in the same change.
