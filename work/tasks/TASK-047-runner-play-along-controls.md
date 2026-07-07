---
id: TASK-047
title: Add runner play-along controls and per-exercise tempo persistence
epic: EPIC-014
status: backlog
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

- [ ] Runner exercise panel includes play/stop, loop, click/count-in state, and
      loading/error states with accessible button names
- [ ] Tempo control allows slower practice up to the authored BPM and persists
      per `Exercise.id` through a typed versioned store
- [ ] Starting playback lazy-loads the audio engine and selected samples; simply
      visiting Practice does not
- [ ] Advancing, ending, or completing a lesson stops any active playback
- [ ] Tests cover tempo persistence defaults/updates and runner control behavior
      through Testing Library queries/interactions
- [ ] `bun run --cwd codebase check` passes

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

(empty — not yet claimed)
