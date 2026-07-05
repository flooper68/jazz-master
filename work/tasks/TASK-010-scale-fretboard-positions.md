---
id: TASK-010
title: Scale & arpeggio fretboard positions
epic: EPIC-001
status: backlog
depends_on: [TASK-003, TASK-009]
created: 2026-07-05
---

# TASK-010 — Scale & arpeggio fretboard positions

## Goal

Given a scale or arpeggio and a fretboard position (fret window), produce the ordered, playable sequence of string/fret positions — the raw material of every scale/arpeggio exercise.

## Context

TASK-003 gives `noteAt`/`positionsOf`; TASK-009 gives scale/arpeggio spelling. Exercises (TASK-011/012) need "play C major, position 2, ascending and descending": a deterministic mapping from (notes × fret window) to an ordered path across the strings. Lives in `src/theory/` (pure). Start with one clear position system (e.g. anchored fret windows of ~4–5 frets); CAGED/3-notes-per-string labeling can come later — design so the position system is a parameter, not baked in.

## Acceptance criteria

- [ ] `scalePositions(scale, window)` returns positions ordered low→high (string then pitch), each carrying its note and scale degree
- [ ] Every returned position's note is verified against `noteAt` (property-style test)
- [ ] Works for arpeggios (fewer notes, same mechanism)
- [ ] Unit tests: at least C major and F# dorian across two windows, one arpeggio case
- [ ] `bun run check` passes

## Verification

`bun run test`. Manual sanity: render one result on the `<Fretboard>` component in a scratch test and eyeball a known pattern.
