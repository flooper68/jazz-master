---
id: TASK-002
title: Music theory core — notes, intervals, chord spelling
epic: EPIC-001
status: done
depends_on: []
created: 2026-07-05
---

# TASK-002 — Music theory core

## Goal

A pure, fully-tested TypeScript module (`src/theory/`) that models notes, intervals, and jazz chord spelling — no React, no DOM.

## Context

This is the foundation every feature builds on, so correctness and good types matter more than speed of delivery. Enharmonics must be right: the third of Eb7 is G, the seventh is Db (not C#). Spell chords by stacking interval names over the root, not by counting semitones.

## Acceptance criteria

- [x] Note representation with letter + accidental (supports Cb, E#, double accidentals internally if needed)
- [x] Pitch-class math: transpose a note by a named interval (m3, M3, P5, m7, M7, b9, #11, ...) with correct spelling
- [x] `spellChord(root, quality)` for at least: maj7, 7, m7, m7b5, dim7, m6, 6, maj6/9-optional (6/9 deferred — marked optional); returns correctly spelled note names
- [x] Chord-symbol parsing for the common forms (`Cmaj7`, `F#m7b5`, `Bb7`, `Ebm6`)
- [x] All twelve keys covered in tests, including flat keys (Db, Gb) and sharp spellings where conventional
- [x] Zero React/DOM imports; everything exported from `src/theory/index.ts`
- [x] `bun run check` passes

## Verification

```
bun run check
```

Test cases must include at least: `spellChord('Eb', '7') → Eb G Bb Db`, `spellChord('F#', 'm7b5') → F# A C E`, `spellChord('B', 'maj7') → B D# F# A#`.

## Log

### 2026-07-05 — claimed (agent)
Plan: three pure modules + barrel. `note.ts`: `Note = { letter, accidental: -2..2 }`, `parseNote`/`noteName` (ASCII `b`/`#`, doubles supported). `interval.ts`: interval table keyed by name (`P1…M7`, `d5`, `d7`, extensions `b9 9 #9 11 #11 b13 13`) → `{ letterSteps, semitones }`; `transpose` moves the letter by steps and derives the accidental from the semitone target — spelling falls out correct by construction, never semitone-counting against a chromatic scale. `chord.ts`: `CHORD_FORMULAS` (maj7, 7, m7, m7b5, dim7, 6, m6) as interval-name stacks; `spellChord(root, quality) → Note[]`; `parseChord('F#m7b5') → { root, quality } | null` (null for unparseable input; `spellChord` throws on a bad root string since that's a programmer error). 6/9 left out (task marks it optional) — add when a voicing needs it. Test-first: full 12-key expectation tables for all seven qualities, hand-derived, plus tricky transposition spot checks (Cb, E#, double flats).

### 2026-07-05 — done
Shipped as planned: `note.ts` / `interval.ts` / `chord.ts` / `index.ts`, 165 theory tests (175 total in repo), all task-mandated cases pass (`Eb7 → Eb G Bb Db`, `F#m7b5 → F# A C E`, `Bmaj7 → B D# F# A#`). Tests written first and confirmed red before implementing. Review: code-reviewer found no must-fix; fixed now: `noteName` throws beyond double accidentals (transposing exotic roots like Bbb can yield triple flats that would silently break the parse round-trip — behavior pinned by test), `LETTERS`/`LETTER_PITCH_CLASS` trimmed from the public barrel (theory internals). A second, independent theory-checker agent verified all 130 hand-derived expectations against the formulas without reading the implementation — zero errors. Deviations: 6/9 quality deferred (task marks it optional). Discovery filed: INS-003 (RES-001 ID collision with owner's parallel research file — left untouched, kept out of this commit). `bun run check` green.
