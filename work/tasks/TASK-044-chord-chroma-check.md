---
id: TASK-044
title: Chord "close enough" check via chroma template matching
epic: EPIC-010
status: gated
gated_until: monophonic scoring (TASK-043) is shipped and validated by owner dogfooding, and the polyphonic-model landscape is re-checked against RES-014
depends_on: [TASK-043]
source: TASK-015
research: RES-014
created: 2026-07-07
---

# TASK-044 — Chord "close enough" check via chroma template matching

## Goal

For chord exercises, a forgiving boolean-ish check — "that sounded like the
expected Cmaj7" — via chromagram correlation against the expected chord's
pitch-class template, explicitly not per-string transcription.

## Context

RES-014 Q3: full client-side polyphonic transcription is rejected (Basic Pitch
frozen since 2022, unverified strummed-chord accuracy, heavy runtime), but
chroma/PCP template matching (Fujishima 1999 lineage) can credibly answer
"roughly the right chord?" with a forgiving threshold. Compute a chromagram of
the strummed segment (hand-rolled from FFT bins, or essentia.js HPCP if its
staleness is acceptable), correlate against the expected quality's template,
threshold generously. Expectation-setting in UI: this is a "sounds right"
check, never per-note chord feedback. Re-read RES-014's stale_when before
starting — a better browser polyphonic model may have shipped.

## Acceptance criteria

- [ ] Chroma-based match/no-match (or match-confidence) for a strummed chord vs the exercise's expected chord, offline after the take
- [ ] Validated on real strummed takes across at least maj7/m7/7 qualities in several keys; false-negative rate on correct playing measured and recorded in the Log
- [ ] UI copy frames the result as a rough check, not per-note feedback
- [ ] `bun run check` passes

## Verification

Fixture tests with synthesized chords (right chord, wrong quality, wrong root);
manual dogfood on real strums recorded via TASK-041's capture flow.

## Open questions (deferred grill)

1. Is a boolean-ish "sounded right" check valuable enough for chord lessons, or
   does anything short of per-note feedback disappoint more than it helps?
2. The gate re-checks the polyphonic-model landscape — if a credible browser
   model exists by then, should this task be replaced rather than built?

## Log

### 2026-07-09 — paused with epic

Owner paused EPIC-010 so the project can focus on EPIC-013's server-owned
persistence work. This task remains `gated` and should not be picked until the
epic is resumed, monophonic scoring has been dogfooded, and the polyphonic model
landscape is re-checked against RES-014.
