---
id: TASK-002
title: Music theory core — notes, intervals, chord spelling
epic: EPIC-001
status: backlog
depends_on: []
created: 2026-07-05
---

# TASK-002 — Music theory core

## Goal

A pure, fully-tested TypeScript module (`src/theory/`) that models notes, intervals, and jazz chord spelling — no React, no DOM.

## Context

This is the foundation every feature builds on, so correctness and good types matter more than speed of delivery. Enharmonics must be right: the third of Eb7 is G, the seventh is Db (not C#). Spell chords by stacking interval names over the root, not by counting semitones.

## Acceptance criteria

- [ ] Note representation with letter + accidental (supports Cb, E#, double accidentals internally if needed)
- [ ] Pitch-class math: transpose a note by a named interval (m3, M3, P5, m7, M7, b9, #11, ...) with correct spelling
- [ ] `spellChord(root, quality)` for at least: maj7, 7, m7, m7b5, dim7, m6, 6, maj6/9-optional; returns correctly spelled note names
- [ ] Chord-symbol parsing for the common forms (`Cmaj7`, `F#m7b5`, `Bb7`, `Ebm6`)
- [ ] All twelve keys covered in tests, including flat keys (Db, Gb) and sharp spellings where conventional
- [ ] Zero React/DOM imports; everything exported from `src/theory/index.ts`
- [ ] `bun run check` passes

## Verification

```
bun run check
```

Test cases must include at least: `spellChord('Eb', '7') → Eb G Bb Db`, `spellChord('F#', 'm7b5') → F# A C E`, `spellChord('B', 'maj7') → B D# F# A#`.
