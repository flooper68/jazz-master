---
id: TASK-041
title: Recording capture flow in the practice runner
epic: EPIC-010
status: done
depends_on: []
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
Target: a take is recordable and replayable from the runner, with human-only
browser/device risks routed to QA rather than task completion.
How we will know it improved: automated component coverage proves the
permission, meter, count-in, replay, cleanup, and denial states; QA catches any
browser/device-specific defects as issues.

## Context

Per RES-014: request mic on the record gesture only; constraints
`{ echoCancellation: false, noiseSuppression: false, autoGainControl: false }`
(tolerate browsers ignoring them); AudioContext created/resumed inside the
gesture (iOS); read `audioContext.sampleRate` at runtime; MediaRecorder
`audio/webm;codecs=opus` with `audio/mp4` fallback (Safari < 18.4); count-in
metronome anchors the take timeline — no backing track during recording in v1.
Take stays in memory (replay), is NOT persisted. Audio never leaves the device.
This task touches browser permissions → include `processes/security-review.md`
in the plan.

Owner decision 2026-07-08 (NOTE-010): TASK-040's real-guitar validation was
abandoned. Proceed from RES-014's defaults and browser compatibility findings;
do not wait for measured real-take capture parameters before building the
capture flow. Watch for capture-path problems during QA/product review and file
issues rather than reviving the spike by default.

## Acceptance criteria

- [x] Record button asks for mic permission on first use with a pre-permission explanation; denial produces a friendly recoverable state
- [x] Live input level meter while armed/recording
- [x] Count-in (metronome clicks at exercise tempo) precedes capture; take timeline starts at a known beat grid
- [x] Recorded take is replayable in-session; discarded on leaving the exercise (no persistence)
- [x] Cross-browser/device risks are routed to QA/product review rather than treated as a task completion gate
- [x] `bun run check` passes

## Verification

Automated: component tests for the permission/level-meter/record state machine
per `processes/testing-strategy.md`; `bun run --cwd codebase check`.

QA follow-up: during the next QA/product review, run an exercise on available
desktop/mobile browsers, record and replay a take, deny permission, and confirm
recovery. Browser/device-specific failures become issues; they do not block this
task's `done` status.

## Deferred follow-up questions

1. Is count-in-only recording acceptable for v1, or does practicing without the
   backing track playing change the exercise too much to be worth scoring?
   (RES-014 chose count-in to avoid latency calibration.)
2. Should the take replay survive navigation within the session (e.g. compare
   two takes), or is strictly in-exercise replay enough for v1?

## Log

### 2026-07-08 - unblocked by owner risk decision (agent)

Owner chose to skip TASK-040's real-guitar feasibility check and assume the
RES-014 pipeline works well enough to proceed (NOTE-010). Removed TASK-040 from
`depends_on`; this task remains backlog and should carry the accepted risk into
its implementation plan.

### 2026-07-08 - claimed (agent)

Plan: add an in-runner recording panel for each exercise with explicit
pre-permission copy, gesture-bound mic request, Web Audio level meter, four-beat
metronome count-in at the exercise tempo, MediaRecorder capture, and in-memory
replay URL cleanup on exercise unmount. Keep takes out of storage and network;
factor browser capture helpers plus the recording state reducer into
`apps/web/src/audio/recording.ts` for focused unit coverage, then cover the
runner permission/denial/replay states with Testing Library. Measurable aim:
baseline = no take can be captured; target = a take can be armed, recorded, and
replayed from the runner without persisting audio. Security/privacy checklist in
scope because this requests microphone permission; no new dependencies planned.

### 2026-07-08 - implemented, blocked on manual browser/device verification (agent)

Added the runner take recorder and `apps/web/src/audio/recording.ts`: raw-ish
`getUserMedia` constraints, Web Audio input-level meter, four-beat synthesized
count-in, MediaRecorder MIME fallback (`audio/webm;codecs=opus` then
`audio/mp4`), in-memory replay URL cleanup, and denial/unsupported/error states.
Automated verification: focused recording + runner tests pass; `bun run --cwd
codebase check` exits 0 (typecheck, lint, 587 tests, build; existing jsdom
canvas warnings and Wrangler log-file sandbox warning observed). Security/privacy
checklist: no new dependencies, no network, no durable audio storage; mic
permission is tied to the Record button with explanatory copy. Blocker: the
required desktop Firefox/Safari and iOS Safari manual mic verification cannot be
performed from this environment, so the cross-browser acceptance criterion is
left unchecked and the task remains blocked rather than done.

### 2026-07-08 - review fixes (agent)

Independent review found three capture-path issues: MediaRecorder constructor or
`start()` failures were outside the count-in callback's error handling; recorder
start used a separate wall-clock duration instead of the scheduled count-in beat
time; AudioContext creation/resume happened after awaiting `getUserMedia`, which
is risky for iOS user activation. Fixed all three: create/resume AudioContext
before the permission await, use `scheduleCountInClicks`' returned beat-zero
audio time to compute recorder-start delay, and recover recorder-start failures
with cleanup plus an enabled retry state. Added component tests for AudioContext
ordering and MediaRecorder start-failure recovery.

### 2026-07-08 - marked done after process decision (agent)

Owner decision (NOTE-012): ignore human-only browser/device verification as a
task completion gate. Updated the process so future tasks must be verifiable by
automated checks or agent-runnable browser/local steps; manual device/browser
coverage belongs in QA/product review and produces issues when it finds defects.
TASK-041 is therefore done on its implemented and reviewed scope: capture UI,
permission denial recovery, level meter, count-in, in-session replay, no audio
persistence, and prior `bun run --cwd codebase check` pass. Residual
Firefox/Safari/iOS Safari mic risk is deferred to QA.
