---
id: TASK-038
title: Show notation in the practice runner via a display hint
epic: EPIC-009
status: backlog
depends_on: [TASK-037]
source: TASK-014
research: RES-013
created: 2026-07-07
---

# TASK-038 — Show notation in the practice runner via a display hint

## Goal

A practicing guitarist sees staff + TAB for melodic exercises inside the guided
practice runner, alongside (not replacing) the fretboard view.

## Problem brief

Current condition: runner exercises display fretboard/chord-diagram hints only;
melodic material (scales, arpeggios, lines) cannot be *read*, only located.
Desired condition: exercises whose lesson wants notation render an aligned
staff + TAB pair in the runner, spelled exactly as the theory core spells.
Affected user/workflow: guided practice (EPIC-008 runner), lesson content authors.
Evidence: EPIC-009 Why — the desired practice flow shows "both notes and tabs";
reading notation is itself a jazz-guitar skill.
Baseline: 0 exercises show notation.
Target: every scale/arpeggio exercise in the shipped lesson pack can opt in via
its display hints and renders correctly.
How we will know it improved: runner shows notation for opted-in exercises in dev;
QA review reads a flat-key exercise without spotting a respelled note.

## Context

- Extend `ExerciseDisplay` in `apps/web/src/content/types.ts` with `'notation'`
  (ADR-010 consequence); update `validateLessons` only if display validation
  exists to touch.
- Runner (`TASK-013`'s practice runner) renders `<Notation>` (TASK-037) when the
  hint is present, fed from `resolveExercise` output — staff and TAB are two
  projections of the same resolved data.
- Keep the component lazy: the runner must not pull VexFlow into the initial
  `/app` chunk (React `lazy`/dynamic import + suspense fallback).
- Opt in the existing lesson pack's scale/arpeggio exercises as part of this task.

## Acceptance criteria

- [ ] `'notation'` display hint exists and is honored by the runner
- [ ] Lesson-pack scale/arpeggio exercises opted in and rendering in dev
- [ ] Runner test: exercise with the hint renders notation; without it, none
- [ ] Initial `/app` load still excludes VexFlow (build-output check)
- [ ] `bun run check` passes

## Verification

`bun run --cwd codebase check`; `bun run --cwd codebase dev`, run a lesson with a
flat-key exercise and read the staff+TAB; check network/chunks that VexFlow loads
only when a notation exercise appears.

## Open questions (deferred grill)

1. Should notation *replace* the fretboard for melodic exercises or sit beside it?
   This task stacks them (both hints honored) — confirm the runner layout doesn't
   drown the primary instruction.
2. ADR-010 Q1 applies here concretely: label opted-in eighth-note exercises
   "swing 8ths" as plain text, or leave rhythm feel unstated?
