---
id: TASK-010
title: Scale & arpeggio fretboard positions
epic: EPIC-001
status: done
depends_on: [TASK-003, TASK-009]
created: 2026-07-05
---

# TASK-010 — Scale & arpeggio fretboard positions

## Goal

Given a scale or arpeggio and a fretboard position (fret window), produce the ordered, playable sequence of string/fret positions — the raw material of every scale/arpeggio exercise.

## Context

TASK-003 gives `noteAt`/`positionsOf`; TASK-009 gives scale/arpeggio spelling. Exercises (TASK-011/012) need "play C major, position 2, ascending and descending": a deterministic mapping from (notes × fret window) to an ordered path across the strings. Lives in `codebase/packages/theory/` (pure). Start with one clear position system (e.g. anchored fret windows of ~4–5 frets); CAGED/3-notes-per-string labeling can come later — design so the position system is a parameter, not baked in.

## Acceptance criteria

- [x] `scalePositions(scale, window)` returns positions ordered low→high (string then pitch), each carrying its note and scale degree
- [x] Every returned position's note is verified against `noteAt` (property-style test)
- [x] Works for arpeggios (fewer notes, same mechanism)
- [x] Unit tests: at least C major and F# dorian across two windows, one arpeggio case
- [x] `bun run check` passes

## Verification

`bun run test`. Manual sanity: render one result on the `<Fretboard>` component in a scratch test and eyeball a known pattern.

## Log

### 2026-07-05 — claimed (agent)

Plan: new `packages/theory/src/positions.ts`. Core is `notePositions(notes, window, tuning)` — walks strings 6→1, frets min→max, emits `PositionedNote {string, fret, note, degree}` for every fret whose pitch class matches a note in the sequence; note carries the *scale's* spelling (Eb7's Db, not noteAt's C#), degree is the 1-based index in the sequence. `scalePositions({root, type}, window)` and `arpeggioPositions(chord, window)` are thin wrappers over `spellScale`/`arpeggio` — same mechanism, so the position system (anchored fret window) stays a parameter and arpeggios come free. Add `Scale` interface to scale.ts mirroring `Chord`. Test-first: exact hand-derived tables for C ionian (two windows incl. open strings), F# dorian (two windows), Eb7 arpeggio (asserting Db spelling), plus a property test over all scale types × roots × windows checking noteAt pitch-class agreement, window containment, ordering, and exhaustiveness. Measurable aim: theory package gains the (notes × window) → ordered-path capability TASK-011/012 need; signal = new exhaustive test suite green in `bun run check` + eyeballed C-major pattern on `<Fretboard>`.

### 2026-07-06 — done

Shipped as planned: `notePositions` engine + `scalePositions`/`arpeggioPositions` wrappers + `Scale` interface, all exported from the package index. 9 tests: exact tables for C ionian (frets 7–10 and 0–3 incl. open strings), F# dorian (1–4 and 8–12), Eb7 arpeggio (5–9, asserting the seventh is spelled Db not C#), drop-D tuning, pitch-class-collision precedence, invalid windows, and a property suite over all 12 scale types × 13 root spellings × 4 windows (noteAt agreement, spelling identity, window containment, ordering, two-way exhaustiveness). Manual verification: rendered C major 7–10 on `<Fretboard>` in a scratch test (deleted after) — ASCII grid matched the standard 7th-position pattern; 17 dots, 3 roots. Independent review (code-reviewer agent): no correctness/purity findings; its two should-fixes (tracker updates, tuning-parameter test) fixed in this commit, remaining nit (shared fret-window validation helper across fretboard.ts/positions.ts) filed as INS-007. `bun run check` green.
