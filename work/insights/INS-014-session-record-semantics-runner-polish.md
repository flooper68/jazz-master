---
id: INS-014
title: Session-record semantics questions and runner polish deferred from TASK-013 review
status: deferred
revisit_when: next content-model/error-boundary task, or EPIC-010 score persistence changing session semantics
created: 2026-07-06
source: TASK-013
---

TASK-013's review passes surfaced items that are product/consumer decisions or
low-priority polish, not defects in the shipped runner. Parking them here so the
EPIC-011 (planner) and EPIC-012 (history) tasks resolve the semantics before
building on the record, and so the polish isn't lost.

**Record-semantics questions (answer before EPIC-011/012 consume `sessions`):**

- `durationSeconds` is time from start to the *latest grade*, not wall-clock
  session length — a run graded once at t=30s then abandoned at t=5min records
  30. Consistent with the field's doc, but confirm which semantics the planner
  and history actually want.
- A run abandoned before any grade persists nothing. Defensible (no history was
  earned), but if the planner ever wants "user started X and bailed" as a
  signal, a started-session record would be needed.
- Rapid double-clicking a grade button grades two exercises (the second unseen).
  State and persisted record stay consistent (post-review fix moved persistence
  to an effect), but a debounce/disable-on-advance would prevent accidental
  grades. Related deferred idea: an End-lesson confirm once lessons get longer.

2026-07-06 (TASK-018): history consumed the record with the documented semantics —
`durationSeconds` (time-to-last-grade) is displayed as the session duration, and
zero-grade abandons persisting nothing means they simply don't appear in history
(decision noted in TASK-018's Log). Still open on this bullet list: whether the
*planner* wants wall-clock duration or a started-and-bailed signal, and the
double-click debounce.

2026-07-06 (TASK-019): the dashboard also consumed the documented semantics —
minutes-this-week sums `durationSeconds` (time-to-last-grade), so it undercounts
wall-clock practice for runs abandoned after their last grade; the streak counts
any persisted session (a grade was earned), so zero-grade abandons don't extend
it. Both consistent with TASK-018's reading. The open questions above are
unchanged.

**Polish (fold into the next runner-touching task):**

- `resolveExercise` throws in render on a broken content reference with no error
  boundary; `validateLessons` guards authored packs (and [[INS-013]] proposes a
  dev-time assertion), but an error boundary around the runner would degrade
  gracefully instead of blanking the page.
- An exercise whose `display` lacks `'fretboard'` (e.g. future
  `chordDiagram`-only material) renders only tempo/countdown — silently no
  visual. Fine for the all-fretboard v1 pack; needs handling with the first
  chord content.
- Runner component tests run a real 1 s `setInterval` under async
  interactions — fast tests win the race today; fake timers would make the
  countdown deterministic if flakes appear.

## Triage note

2026-07-06 (TASK-030 sweep) — Deferred. History (TASK-018) and dashboard
(TASK-019) both consumed the documented semantics, so the record contract has
two consistent consumers; what remains is (a) whether the *planner* ever wants
wall-clock duration or a started-and-bailed signal — a question that only
matters when planner heuristics evolve or EPIC-010 scoring lands — and (b) the
polish list, which folds into the next runner-touching task. No standalone
task warranted.

2026-07-08 TASK-053 sweep - TASK-049 changed the timer to count active
playthrough time, so the old "time to latest grade" caveat is no longer the
dominant semantics risk. Keep this deferred for the next session-record shape
change, most likely score persistence in TASK-043, or for content/error-boundary
work that touches the runner's failure states.
