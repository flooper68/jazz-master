---
id: TASK-009
title: Theory core — scales, modes, and arpeggios
epic: EPIC-001
status: backlog
depends_on: []
created: 2026-07-05
---

# TASK-009 — Theory core: scales, modes, and arpeggios

## Goal

Extend `src/theory/` with correctly spelled scales/modes and arpeggios, so lesson content (EPIC-008) can be generated from theory rather than hand-typed note lists.

## Context

Scales and arpeggios are two of the four lesson areas in the new direction and the first lesson pack (TASK-012) is built on them. Follow the existing pattern: formulas as named-interval stacks over a root (like `chord.ts`), spelling via `transpose` so enharmonics are correct by construction (the b7 of F7 is Eb, not D#). Arpeggios are chord-tone sequences — derive them from the existing chord formulas rather than duplicating.

Jazz-first scale set: major and its modes (at minimum ionian, dorian, mixolydian, locrian), melodic minor (jazz minor), harmonic minor, major/minor pentatonic, blues. Design the formula table so adding more is data, not code.

## Acceptance criteria

- [ ] `spellScale(root, type)` returns correctly spelled notes for the listed scale types
- [ ] Modes spelled correctly in all 12 keys (12-key tests, matching the chord-test style; e.g. Eb dorian contains Cb, not B)
- [ ] `arpeggio(root, quality)` returns chord tones in order for the existing qualities, reusing chord formulas
- [ ] Exported via the `index.ts` barrel; invalid type/root behavior consistent with existing API (`null` for bad parse input, throw for programmer error)
- [ ] `bun run check` passes

## Verification

`bun run test` — scale suite green, including the 12-key enharmonic cases.
