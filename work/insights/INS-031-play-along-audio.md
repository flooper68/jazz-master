---
id: INS-031
title: Play-along — hear the exercise, loop it, metronome at tempo
status: accepted
outcome: [EPIC-014, TASK-045]
created: 2026-07-07
source: NOTE-009
---

Owner testing feedback (grilled, NOTE-009): exercises need a play-along mode —
the app plays the exercise's notes in time, loopable, with a metronome click at
the exercise's tempo. Decisions made in the grill session:

1. **Scope of the first cut is both halves.** Hearing the notes once and
   looping with a click were judged not useful alone; the minimum feature is
   "play the exercise's notes in time, looped, with a click".
2. **Real timbre from day one.** A clean-but-synthetic beep fails the
   three-months test ("I'd quietly stop using it"). Budget for sampled
   instrument sound (guitar/piano) from the start — sample library selection,
   loading strategy, asset weight, and licensing are all open.
3. **Priority: play-along jumps the queue ahead of the recording/scoring
   track** (TASK-040–044, EPIC-010). Owner's call on the three-months test:
   not being able to hear/loop any exercise hurts practice more than not
   getting scored feedback. The dev loop takes this pillar first.

Why it matters to the practice loop: every exercise today is silent — the
player has no model to imitate and nothing keeping them in time, which also
feeds the "exercises are boring" finding ([[INS-032]] waits on this feature).

Shape of the work: pillar-sized — the owner approved the epic in the same
session. Accepted into [[EPIC-014]] with the research task [[TASK-045]]
(sampled-instrument playback on the web) as its blocking first item. Two
follow-up grill answers recorded there: tempo is adjustable and remembered
per exercise; guitar timbre preferred, piano fallback.
