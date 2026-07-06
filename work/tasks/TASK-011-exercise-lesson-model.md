---
id: TASK-011
title: Exercise & lesson content model
epic: EPIC-008
status: done
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

- [x] `Exercise` and `Lesson` types exported, with area/level/prerequisites/estimated-minutes on lessons
- [x] Exercises reference theory-core constructs (validated: a helper resolves an exercise to concrete notes/positions, unit-tested)
- [x] A `validateLesson` (or equivalent) catches broken references and cyclic/missing prerequisites, tested (`validateLessons`, whole-set signature so the prerequisite graph is checkable)
- [x] Architecture overview updated (new `apps/web/src/content/` layer and its dependency rule)
- [x] `bun run check` passes

## Verification

`bun run test`. A deliberately broken lesson fixture fails validation in a test.

## Log

### 2026-07-06 — claimed (agent)

Plan: model lives in `apps/web/src/content/` (not `packages/theory`) — it is app curriculum
vocabulary that *references* theory, not music theory itself; dependency rule
`pages → content → theory`, content never imports components/React. Files: `types.ts`
(`Exercise`, `Lesson`, `ExerciseMaterial` as a scale|arpeggio union — the minimal set
TASK-012/013 need; chords/standards areas exist on `LessonArea` for the planner but get
material kinds only when a task needs them), `resolve.ts` (`resolveExercise` → concrete
notes + `PositionedNote[]` via spellScale/arpeggio + scalePositions/arpeggioPositions),
`validate.ts` (`validateLessons` returns a problem list: unparseable roots, bad fret
windows, non-positive tempo/duration/minutes, duplicate ids, missing/cyclic
prerequisites). Roots authored as `NoteName` strings (`Letter` ± `b`/`#`) for ergonomic
typed data with compile-time narrowing. Measurable aim: shared contract exists such that
TASK-012 can author a lesson pack and TASK-013 can render/run it without model changes;
verification signal = unit tests incl. a deliberately broken fixture failing validation.

### 2026-07-06 — done

Shipped `apps/web/src/content/`: `types.ts` (Exercise/Lesson + NoteName/material/duration/display
unions), `resolve.ts` (`resolveExercise` → spelled notes + PositionedNote[]; throws on broken
refs), `validate.ts` (`validateLessons(lessons)` → problem list; covers unparseable roots,
unknown scale/quality, invalid windows, non-positive tempo/duration/level/minutes, empty
lessons, duplicate ids, unknown prerequisites, prerequisite cycles incl. self-reference),
`index.ts` barrel; 22 tests incl. broken fixtures (bad root, bad window, cycle a↔b) failing
validation, enharmonic assertions (Bb major has Eb; the seventh of Eb7 resolves to Db at
string 4 fret 11, degree 4). Independent review (code-reviewer agent): logic confirmed
correct; two fix-or-file findings fixed in-diff — validator now also checks scale/quality
against SCALE_TYPES/CHORD_QUALITIES (was root-only, asymmetric with what resolve throws on),
and exercise ids are unique curriculum-wide, not per-lesson (session records will key on
them; documented on the type). Review nits (empty `display`, fractional repetition counts,
scale material with chordDiagram display) deferred → INS-011. Architecture overview: content
layer added to diagram/table/dep-direction + a "Content model" section; wiki
`product/overview` synced. `bun run check` green (411 tests). Deviation from suggested home:
none — chose `apps/web/src/content/` over `packages/theory` since the model is app
curriculum vocabulary, not music theory; documented in overview.md.
