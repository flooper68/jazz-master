---
id: TASK-013
title: Guided practice session runner
epic: EPIC-008
status: backlog
depends_on: [TASK-008, TASK-012]
created: 2026-07-05
---

# TASK-013 — Guided practice session runner

## Goal

The heart of the product loop: start a lesson, be guided exercise by exercise (display + timer + self-grade), and have the finished session persisted as a session record.

## Context

Runner UI on the Practice page (`src/pages/PracticePage.tsx` + components). Per exercise: show what to play (fretboard via TASK-003 rendering the TASK-010 positions; tempo target as text until the metronome exists), a countdown or repetition counter, and self-grade buttons — got it / shaky / missed — then advance. End of lesson: summary screen, session persisted.

This task also defines the **session record** (the contract EPIC-011 planner and EPIC-012 history consume): id, timestamp, lesson id, per-exercise grades, duration, and an optional `score` slot reserved for EPIC-010. Store it via TASK-008 storage under a `sessions` store. Keep session-flow state in a plain reducer/hook, components thin.

## Acceptance criteria

- [ ] From the lesson list, "Start" runs the runner through all exercises in order with per-exercise self-grading
- [ ] Fretboard display shows the exercise's actual positions (not a placeholder)
- [ ] Abandoning mid-lesson persists a partial session (marked incomplete) — no lost history
- [ ] Completed session persisted with the record shape above; summary screen shows grades
- [ ] Component tests: full happy path through a 2-exercise fixture lesson, and the abandon path
- [ ] `bun run check` passes

## Verification

`bun run test`. `bun run dev` → run a real lesson end to end; refresh; session JSON visible via the storage layer (devtools) with correct grades.
