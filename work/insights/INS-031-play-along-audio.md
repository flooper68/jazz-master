---
id: INS-031
title: Play-along — hear the exercise, loop it, metronome at tempo
status: new
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

Shape of the work: pillar-sized — an epic was proposed to the owner at the
grill close-out (agents don't create epics unasked). Needs a research phase
first (`processes/deep-research.md`): sampled-instrument playback on the web
(soundfont/sampler libraries, WebAudio scheduling for loop + click accuracy,
asset size vs. the bundle-trim concerns of TASK-039).
