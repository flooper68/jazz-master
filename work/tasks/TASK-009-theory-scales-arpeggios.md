---
id: TASK-009
title: Theory core — scales, modes, and arpeggios
epic: EPIC-001
status: done
depends_on: []
created: 2026-07-05
---

# TASK-009 — Theory core: scales, modes, and arpeggios

## Goal

Extend `codebase/packages/theory/` with correctly spelled scales/modes and arpeggios, so lesson content (EPIC-008) can be generated from theory rather than hand-typed note lists.

## Context

Scales and arpeggios are two of the four lesson areas in the new direction and the first lesson pack (TASK-012) is built on them. Follow the existing pattern: formulas as named-interval stacks over a root (like `chord.ts`), spelling via `transpose` so enharmonics are correct by construction (the b7 of F7 is Eb, not D#). Arpeggios are chord-tone sequences — derive them from the existing chord formulas rather than duplicating.

Jazz-first scale set: major and its modes (at minimum ionian, dorian, mixolydian, locrian), melodic minor (jazz minor), harmonic minor, major/minor pentatonic, blues. Design the formula table so adding more is data, not code.

## Acceptance criteria

- [x] `spellScale(root, type)` returns correctly spelled notes for the listed scale types
- [x] Modes spelled correctly in all 12 keys (12-key tests, matching the chord-test style; e.g. Eb dorian contains Cb, not B) — *note: the Cb example belongs to Eb aeolian/phrygian/locrian, which are tested for it; Eb dorian correctly contains C natural (see Log)*
- [x] `arpeggio(root, quality)` returns chord tones in order for the existing qualities, reusing chord formulas
- [x] Exported via the `index.ts` barrel; invalid type/root behavior consistent with existing API (`null` for bad parse input, throw for programmer error)
- [x] `bun run check` passes

## Verification

`bun run test` — scale suite green, including the 12-key enharmonic cases.

## Log

### 2026-07-05 — claimed (agent)

Plan: `scale.ts` mirrors `chord.ts` — `SCALE_FORMULAS` as named-interval stacks
(`IntervalName[]`), `spellScale` composing `transpose`, so spelling is correct by
construction. All seven major modes (data-only to include the extra three), melodic
minor, harmonic minor, both pentatonics, blues (b5 as `d5`). `arpeggio(root, quality)`
lives in `chord.ts`, delegating to the chord formulas per the task. Test-first:
hand-derived 12-key tables in `scale.test.ts` matching the chord-test style.

Note: the acceptance-criteria example "Eb dorian contains Cb, not B" is musically
incorrect — dorian has a major sixth, so Eb dorian contains C natural. The modes of Eb
that contain Cb (aeolian, phrygian, locrian) are tested for exactly that; Eb dorian is
tested with its correct C. Spirit of the criterion (flat-key modes spelled with Cb/Fb,
never B/E) is fully covered.

### 2026-07-05 — done

`scale.ts` ships all seven diatonic modes plus melodicMinor, harmonicMinor,
majorPentatonic, minorPentatonic, blues — formulas as `IntervalName[]` data, spelled
via `transpose`. `arpeggio` in `chord.ts` delegates to the chord formulas.
148 hand-derived 12-key scale rows + arpeggio tests; suite now 370 tests, all green.
Independent code review (code-reviewer agent) verified every formula and the extreme
rows (G# melodic minor → F##, Eb locrian → Bbb, Eb blues → Bbb/Bb) — no musical
errors. Review findings fixed pre-commit: tautological arpeggio test rewritten to
assert against expected note-name strings; `SCALE_TYPES` completeness test added.
`bun run check` green, pushed.
