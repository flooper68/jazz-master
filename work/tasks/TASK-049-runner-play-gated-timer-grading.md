---
id: TASK-049
title: Gate exercise timing and grading behind playthrough
epic: EPIC-008
status: backlog
depends_on: []
source: NOTE-011
created: 2026-07-08
---

# TASK-049 - Gate exercise timing and grading behind playthrough

## Goal

Exercises count practice time only after playback starts, then ask for the
self-grade at the natural completion point.

## Problem brief

Current condition: the countdown starts when an exercise panel mounts, and the
grade buttons are always visible even before the player has played the
exercise.
Desired condition: entering a lesson is setup time; pressing Play starts the
practice timer, and grading appears automatically after playback completes or
when the user chooses Next.
Affected user/workflow: every guided lesson, especially short exercises where
setup time dominates.
Evidence: NOTE-011 owner feedback; current `PracticeRunner` renders
`Countdown` immediately and grade buttons outside the playthrough lifecycle.
Baseline: timer starts on mount; four-minute authored exercises can feel too
long; grade controls are always exposed.
Target: timer starts on Play, starter lesson durations are tuned down where
needed, and grading appears in a focused dialog after play finishes or Next.
How we will know it improved: session duration better reflects actual playing,
and the runner reads as play -> assess -> continue instead of timer + buttons.

## Context

This is runner behavior, not scoring. It may use the play-along engine's
completion callback or add a non-looping play mode. Be explicit about looped
playback: if looping is on, Next is the user-controlled completion signal. When
tuning authored durations, keep the lesson estimated minutes and planner totals
consistent with the exercise data.

## Acceptance criteria

- [ ] Minute-based exercise countdowns do not start until the user starts
      playback or otherwise begins the exercise
- [ ] The user has an explicit Next action for ending the current playthrough
      before grading
- [ ] The Got it/Shaky/Missed choices appear in a dialog or equivalent focused
      prompt after playback completes or the user hits Next
- [ ] Starter-pack exercises with excessive durations are shortened, with tests
      updated so lesson estimates still match exercise durations
- [ ] Session record `durationSeconds` semantics remain documented and tested
- [ ] `bun run --cwd codebase check` passes
- [ ] `bun run --cwd codebase check:e2e` passes

## Verification

- `bun run --cwd codebase check`
- `bun run --cwd codebase check:e2e`
- Manual browser pass: enter a lesson, wait without playing, confirm countdown
  does not move; press Play, confirm countdown starts; hit Next and grade from
  the focused prompt.
