---
id: TASK-041
title: Recording capture flow in the practice runner
epic: EPIC-010
status: backlog
depends_on: [TASK-040]
source: TASK-015
research: RES-014
created: 2026-07-07
---

# TASK-041 — Recording capture flow in the practice runner

## Goal

During a guided exercise the user can record a take: clean mic-permission flow,
level meter, metronome count-in, record/stop, and in-session replay — the
capture half of EPIC-010, with no scoring yet.

## Problem brief

Current condition: the runner (EPIC-008) plays exercises but the user gets no
capture of what they played; feedback is self-graded only.
Desired condition: one tap starts a count-in and records the take; the user can
replay it immediately (self-review is high-leverage practice per RES-014 [35]).
Affected user/workflow: practice runner, every exercise.
Evidence: RES-014 findings Q4/Q6.
Baseline: zero takes can be captured — no recording surface exists in the app.
Target: a take is recordable and replayable from the runner on the supported browsers below.
How we will know it improved: a take can be recorded and replayed on desktop
Chrome/Firefox/Safari and iOS Safari.

## Context

Per RES-014: request mic on the record gesture only; constraints
`{ echoCancellation: false, noiseSuppression: false, autoGainControl: false }`
(tolerate browsers ignoring them); AudioContext created/resumed inside the
gesture (iOS); read `audioContext.sampleRate` at runtime; MediaRecorder
`audio/webm;codecs=opus` with `audio/mp4` fallback (Safari < 18.4); count-in
metronome anchors the take timeline — no backing track during recording in v1.
Take stays in memory (replay), is NOT persisted. Audio never leaves the device.
This task touches browser permissions → include `processes/security-review.md`
in the plan. Carry forward any capture-path parameter picks from TASK-040's Log.

## Acceptance criteria

- [ ] Record button asks for mic permission on first use with a pre-permission explanation; denial produces a friendly recoverable state
- [ ] Live input level meter while armed/recording
- [ ] Count-in (metronome clicks at exercise tempo) precedes capture; take timeline starts at a known beat grid
- [ ] Recorded take is replayable in-session; discarded on leaving the exercise (no persistence)
- [ ] Works on desktop Chrome/Firefox/Safari and iOS Safari (manual verification)
- [ ] `bun run check` passes

## Verification

Manual: `bun run --cwd codebase dev`, run an exercise, record and replay a take
on desktop + iOS Safari; deny permission and confirm recovery. Component tests
for the permission/level-meter/record state machine per
`processes/testing-strategy.md`.

## Open questions (deferred grill)

1. Is count-in-only recording acceptable for v1, or does practicing without the
   backing track playing change the exercise too much to be worth scoring?
   (RES-014 chose count-in to avoid latency calibration.)
2. Should the take replay survive navigation within the session (e.g. compare
   two takes), or is strictly in-exercise replay enough for v1?
3. iOS Safari is listed as a must-verify platform — is it actually a v1 target
   for recording, or is desktop-first acceptable if iOS quirks bite?
