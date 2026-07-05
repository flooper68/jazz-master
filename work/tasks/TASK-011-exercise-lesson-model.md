---
id: TASK-011
title: Exercise & lesson content model
epic: EPIC-008
status: backlog
depends_on: [TASK-009]
created: 2026-07-05
---

# TASK-011 — Exercise & lesson content model

## Goal

Typed models for Exercise and Lesson — the shared contract between curriculum content (TASK-012), the practice runner (TASK-013), and the planner (EPIC-011).

## Context

An **exercise** is one playable unit: what to play (a theory-core reference — scale/arpeggio/chord + key + position — not hard-coded note lists), target tempo, duration or repetitions, and display hints (fretboard, diagrams; notation once EPIC-009 lands). A **lesson** is an ordered list of exercises plus metadata: `area` (`scales | arpeggios | chords | standards`), `level`, prerequisites (lesson ids), estimated minutes.

Suggested home: types in `codebase/apps/web/src/content/types.ts` (or `codebase/packages/theory/` if purely structural — implementer's call, document it), lesson data as typed TS modules in `codebase/apps/web/src/content/`. Keep the model minimal — only what TASK-012/013 need; the planner fields (`level`, `area`, prerequisites) must be there from day one.

## Acceptance criteria

- [ ] `Exercise` and `Lesson` types exported, with area/level/prerequisites/estimated-minutes on lessons
- [ ] Exercises reference theory-core constructs (validated: a helper resolves an exercise to concrete notes/positions, unit-tested)
- [ ] A `validateLesson` (or equivalent) catches broken references and cyclic/missing prerequisites, tested
- [ ] Architecture overview updated (new `apps/web/src/content/` layer and its dependency rule)
- [ ] `bun run check` passes

## Verification

`bun run test`. A deliberately broken lesson fixture fails validation in a test.
