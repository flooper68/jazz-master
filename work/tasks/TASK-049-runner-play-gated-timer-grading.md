---
id: TASK-049
title: Gate exercise timing and grading behind playthrough
epic: EPIC-008
status: done
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

- [x] Minute-based exercise countdowns do not start until the user starts
      playback or otherwise begins the exercise
- [x] The user has an explicit Next action for ending the current playthrough
      before grading
- [x] The Got it/Shaky/Missed choices appear in a dialog or equivalent focused
      prompt after playback completes or the user hits Next
- [x] Starter-pack exercises with excessive durations are shortened, with tests
      updated so lesson estimates still match exercise durations
- [x] Session record `durationSeconds` semantics remain documented and tested
- [x] `bun run --cwd codebase check` passes
- [x] `bun run --cwd codebase check:e2e` passes

## Verification

- `bun run --cwd codebase check`
- `bun run --cwd codebase check:e2e`
- Manual browser pass: enter a lesson, wait without playing, confirm countdown
  does not move; press Play, confirm countdown starts; hit Next and grade from
  the focused prompt.

## Log

### 2026-07-08 - claimed (agent)

Plan: update the runner state machine so minute timers stay idle until playback
or an explicit begin action; add a Next completion path that opens a focused
grading prompt; shorten overlong starter-pack exercise durations while keeping
lesson estimates derived consistently; update session-duration documentation and
behavior tests; then run the full check, e2e smoke suite, and manual browser
verification.

### 2026-07-08 - completed (agent)

Implemented a playthrough lifecycle for `PracticeRunner`: exercises remain in
setup until Begin, Play, or recording starts; active playthroughs can end via
Next, countdown expiry, or non-looping playback completion; grading now appears
in a focused dialog. Completing a playthrough stops playback and active
recording/count-in state before opening the grade prompt.

Updated `usePracticeRunner` so `durationSeconds` records accumulated active
exercise time only, with setup and grading time excluded. Documented that
semantics in storage/history/dashboard code and `architecture/overview.md`.
Shortened the excessive starter major-scale exercises from four minutes to two
minutes and kept lesson estimates/tests aligned.

Review: independent review flagged active recording continuing after Next,
missing e2e coverage for the Play path, and generated Playwright artifacts.
Fixed recording cleanup, added a Play-starts-timer e2e smoke test, and removed
the generated artifacts.

Verification:

- `bun run --cwd codebase check` — passed; 42 test files / 602 tests passed,
  build exited 0. Wrangler printed its known sandbox log-file warning.
- `bun run --cwd codebase check:e2e` — passed with escalation for local port
  binding; 5 Playwright tests passed.
- Manual browser pass — started a lesson, waited before playing and confirmed
  the countdown stayed at 2:00; pressed Play and confirmed countdown movement,
  Stop visibility, and enabled Next; clicked Next and graded from the focused
  prompt.
