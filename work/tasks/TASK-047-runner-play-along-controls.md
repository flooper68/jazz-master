---
id: TASK-047
title: Add runner play-along controls and per-exercise tempo persistence
epic: EPIC-014
status: done
depends_on: [TASK-046]
source: TASK-045
research: RES-015
created: 2026-07-07
---

# TASK-047 — Add runner play-along controls and per-exercise tempo persistence

## Goal

The practice runner lets the player start/stop looped sampled playback with a
click, adjust tempo at or below the authored target, and return later to the
same exercise tempo.

## Problem brief

Current condition: the runner shows fretboard/notation and a static authored BPM,
but provides no audio model, click, loop, or tempo memory.
Desired condition: each exercise has ergonomic playback controls and remembers
the player's slow-practice tempo locally.
Affected user/workflow: practicing an exercise from the guided runner.
Evidence: NOTE-009 owner feedback; RES-015 and ADR-011 define the chosen audio
stack.
Baseline: no runner audio controls and no tempo store.
Target: on any existing exercise, the player can play/stop, loop with click,
lower tempo, and see that tempo restored next session.
How we will know it improved: component/page tests cover the controls and store;
manual browser verification confirms audible playback through the runner.

## Context

Depends on TASK-046's audio engine. Tempo persistence must use a typed store in
`apps/web/src/storage/`; do not touch `localStorage` outside that directory
(ADR-002). Cap the control at the authored `exercise.tempoBpm`; v1 does not need
tempo above target, swing feel, or humanized playback. Keep controls compact in
the existing runner card and avoid loading audio until the player explicitly
starts playback.

## Acceptance criteria

- [x] Runner exercise panel includes play/stop, loop, click/count-in state, and
      loading/error states with accessible button names
- [x] Tempo control allows slower practice up to the authored BPM and persists
      per `Exercise.id` through a typed versioned store
- [x] Starting playback lazy-loads the audio engine and selected samples; simply
      visiting Practice does not
- [x] Advancing, ending, or completing a lesson stops any active playback
- [x] Tests cover tempo persistence defaults/updates and runner control behavior
      through Testing Library queries/interactions
- [x] `bun run --cwd codebase check` passes

## Verification

- `bun run --cwd codebase check`
- `bun run --cwd codebase check:e2e` because this touches the practice flow
- Manual browser pass: start a lesson, play the first exercise, lower tempo,
  stop, advance/end the run, restart the exercise, and confirm the tempo is
  remembered and no console errors occur.

## Open questions (deferred grill)

1. Should loop restart include a count-in on every repeat, only before the first
   pass, or be user-toggleable?
2. What is the lowest allowed tempo: a fixed floor (for example 40 BPM) or a
   percentage of the authored tempo?
3. Should the remembered tempo be shown in lesson lists/dashboard before a run
   starts, or only inside the exercise panel?

## Log

### 2026-07-08 — claimed (agent)

Plan: wire the existing TASK-046 audio engine into the practice runner with a
compact control group, lazy dynamic import on first play, loop/click/count-in
toggles, and explicit stop behavior when the exercise changes or the run ends.
Add a typed versioned `storage/` store keyed by `Exercise.id` for slow-practice
tempo, clamped to the authored tempo with a fixed 40 BPM floor for v1. Baseline:
runner shows only static BPM and no persisted tempo. Target: user can start
sampled playback with click, adjust tempo below/at target, return to the
exercise, and see the same tempo restored. Verification signal: storage tests,
Testing Library runner behavior tests, `bun run --cwd codebase check`,
`check:e2e`, and manual browser pass with clean console.

### 2026-07-08 — done (agent)

Implemented runner play/stop controls with loop and click/count-in toggles,
lazy audio-module import, loading/error UI, and stop/dispose behavior when the
exercise panel unmounts or the runner exits. Added `play-along-tempos`, a
versioned typed store keyed by `Exercise.id`, with a fixed 40 BPM floor and the
authored BPM as the ceiling. A manual browser pass found a React StrictMode
mount-guard bug that left playback stuck on Loading in dev; the effect now
resets the guard on mount before async playback continues.

Verification:

- `bun run --cwd codebase test -- apps/web/src/storage/playAlongTempos.test.ts apps/web/src/audio/timeline.test.ts apps/web/src/components/PracticeRunner.test.tsx --reporter=dot`
- `bun run --cwd codebase check`
- `bun run --cwd codebase check:e2e`
- Manual Playwright browser pass with MP3 requests fulfilled locally: start a
  lesson, lower tempo to 48 BPM, play until Stop appears, stop, advance/end,
  restart, confirm 48 BPM is restored and no console/request failures occurred.

Review/security notes: local code-review pass found no follow-up changes after
the StrictMode fix; subagent review was unavailable under the current delegation
policy. Persistence remains inside `apps/web/src/storage/`; stored data is only
per-exercise numeric BPM, no sensitive data.
