---
id: INS-016
title: Per-area trend-over-time visuals deferred from dashboard v1
status: deferred
revisit_when: EPIC-010 machine scores land, or the owner answers the deferred-grill question below (self-grade trends earlier?)
created: 2026-07-06
source: TASK-019
---

EPIC-012's scope named "per-area trend (accuracy/scores)" for the dashboard.
TASK-019 shipped per-area *current status* — completed-lesson counts, last
practiced date, and needs-attention callouts from each lesson's latest grades —
which satisfies the epic's Done-when, but nothing shows direction over time
("arpeggios improving, scales flat").

Self-grades alone (got-it/shaky/missed per exercise) are a thin signal for a
trend line; per-day or per-week aggregation of grade ratios is possible now but
easily reads as noise with one-lesson sample sizes. Machine scores (EPIC-010)
are the signal trends actually want — the `PracticeSession.score` field is
already reserved for them.

Suggested shape when picked up: a small sparkline-style per-area visual (simple
SVG, per the epic's no-charting-library constraint) fed by a pure derivation in
`apps/web/src/dashboard/`, arriving with or after EPIC-010 scoring. Until then
the dashboard's callouts cover the "what needs attention" question.

Deferred-grill question for the owner: are self-grade-ratio trends worth
shipping before machine scores exist, or is trend work strictly gated on
EPIC-010?

## Triage note

2026-07-06 (TASK-030 sweep) — Deferred on the insight's own analysis:
self-grades are a thin signal and one-lesson sample sizes make trend lines read
as noise; machine scores (EPIC-010) are the signal trends want, and the
`PracticeSession.score` field is already reserved. The deferred-grill question
above stands for the owner: ship self-grade-ratio trends before machine scores
exist, or gate trend work on EPIC-010?
