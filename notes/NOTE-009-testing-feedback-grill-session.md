---
id: NOTE-009
title: Testing-feedback grill — play-along, moving exercises, JSON packs, notation size
created: 2026-07-07
source_type: grill-session
participants: [owner, agent]
processed: true
---

# NOTE-009 - Testing-feedback grill — play-along, moving exercises, JSON packs, notation size

## Context

The owner tested the app and reported five items of feedback. Implicit grill
trigger (feedback on shipped work, `processes/grilling.md`). Agenda proposed
and confirmed: grill play-along, boring-exercises, and JSON-authoring in
depth; one question on notation size; capture the staff/TAB toggle without
grilling. Routing confirmed: everything becomes insights (no reproducible
defects), transcript here.

The raw feedback, verbatim in substance:

1. Defining new exercises isn't easy — they should be just data in JSON.
2. Play-along for exercises: hear the notes, loop, metronome at a tempo.
3. Tabs/notation are quite small — want a fullscreen focus mode.
4. Toggle tabs/notes/both to reclaim space.
5. Exercises are boring — e.g. arpeggios with chord progressions in
   different keys would be great.

## Discussion

One question per turn; each answer below is the owner's selection.

**Q1 (play-along scope).** If only one half shipped first — hearing the
exercise's notes, or metronome + loop? → **Genuinely both**: neither half is
useful alone; the minimum is "play the notes in time, looped, with a click".

**Q2 (sound bar).** Three-months test on a synthetic beep vs. sampled
instrument timbre? → **Needs real timbre**: a beep would stop being used;
budget sampled sound (guitar/piano) from the start.

**Q3 (priority).** Play-along vs. the queued recording/scoring pillar
(TASK-040–044): which absence hurts more in three months? → **Play-along
first**: hearing/looping exercises changes every session now; scoring waits a
cycle. This reorders the roadmap ahead of EPIC-010's task chain.

**Q4 (boredom, item 5).** Static repetition, key monotony, or missing musical
context? → **Static repetition**: an exercise should move — the arpeggio of
each chord as a progression cycles, changing every bar. Implies a
content-model extension (sequence of chords, not a single material).

**Q5 (sequencing of moving exercises).** Worth building before play-along
exists? → **Wait for play-along**: playing changes without hearing them is
"static repetition with extra steps". One arc: loop first, then moving
content inside it.

**Q6 (JSON authoring, item 1).** Who defines exercises in this picture? →
**Agent/generated packs**: the point is scale — agents/scripts emit packs as
data, schema-validated at load, without TS code review. (Not owner
file-editing, not in-app authoring.)

**Q7 (JSON sequencing).** Pipeline now, or fold into the moving-exercise
model redesign? → **One redesign, later**: nothing blocks on it today; design
the pack format once, when the moving-exercise model change happens.

**Q8 (notation size, item 3).** Too small at music-stand distance only, or
even up close? → **Small even up close**: the inline default rendering must
grow; fullscreen focus mode comes on top.

Item 4 (staff/TAB/both toggle) was captured directly per the agreed agenda.

## Decisions

- Play-along v1 = notes played in time + loop + metronome click, with real
  sampled timbre from day one; synth-only is rejected.
- **Roadmap: play-along takes priority over the recording/scoring track**
  (TASK-040–044 queue behind it). Pillar-sized → epic proposed to the owner
  (pending owner go-ahead; agents don't create epics unasked). Research phase
  first: sampled-instrument playback on the web.
- Moving exercises (arpeggios over progressions, per-bar changes, cycling
  keys) are the answer to "boring", and wait for play-along.
- Exercise packs become agent-emittable JSON, folded into that same
  exercise-model redesign — one redesign, not two; likely an ADR at design
  time.
- Notation default rendering grows; a fullscreen focus mode is added on top;
  staff/TAB/both toggle requested — all batched as one notation-sizing pass
  together with INS-029 §3 and INS-030 §1.

## Action items

- ~~Owner to confirm creating the play-along epic (proposed at close-out).~~
  Confirmed in the same session → EPIC-014 created with TASK-045 (research)
  as its blocking first item. The creation-hook grill added two decisions:
  **tempo is adjustable on the loop and remembered per exercise**, and
  **guitar timbre preferred** (piano fallback if guitar loses badly on
  quality-per-megabyte).
- Next triage processes INS-031–035; prioritization applies the
  play-along-over-recording ordering.
- Deep-research task for sampled playback precedes any play-along
  implementation task.

## Extracted work

- [[INS-031]] — play-along audio (scope, timbre bar, priority decision)
- EPIC-014 — play-along epic (owner-approved in-session)
- [[TASK-045]] — research: sampled-instrument playback for play-along
- [[INS-032]] — moving exercises over progressions (waits on INS-031)
- [[INS-033]] — JSON exercise packs (folds into INS-032's model redesign)
- [[INS-034]] — notation default size + fullscreen focus mode
- [[INS-035]] — staff/TAB/both toggle
