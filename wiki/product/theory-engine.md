---
title: How the theory engine works
updated: 2026-07-06
sources:
  - codebase/packages/theory/src/note.ts
  - codebase/packages/theory/src/interval.ts
  - codebase/packages/theory/src/chord.ts
  - codebase/packages/theory/src/scale.ts
  - codebase/packages/theory/src/fretboard.ts
  - codebase/packages/theory/src/positions.ts
  - architecture/overview.md
  - CLAUDE.md
---

# How the theory engine works

`@jazz-master/theory` (`codebase/packages/theory/`) is the product's domain core: pure TypeScript, zero runtime dependencies, no React or DOM, exhaustively tested across all twelve keys. Everything musical the app displays or drills is computed here; components only render what it returns. The public API is the `index.ts` barrel.

## Why spelling is the whole point

In jazz, enharmonics carry meaning: the seventh of Eb7 is **Db**, never C#, because a seventh chord stacks thirds — root, third, fifth, seventh must land on *different letters* (Eb–G–Bb–Db). A pitch-class-only model (just "semitone 1 of 12") cannot express that distinction, so the engine is built around *spelled* notes and only collapses to pitch class where sameness-of-sound is genuinely the question (fretboard matching, below).

## The representation

A `Note` is a letter (`A`–`G`) plus an accidental offset (`-2` = 𝄫 … `+2` = 𝄪): Eb is `{E, -1}`. `pitchClass()` derives the chromatic 0–11 value (C = 0) when needed. Parsing and formatting round-trip ASCII names (`Eb`, `F#`, `Bbb`) — per repo convention, `b`/`#` in code and data, Unicode ♭/♯ only in rendered UI text.

## Correct by construction: transpose moves the letter first

The load-bearing design decision (`interval.ts`): every named interval is a pair of **letter steps + semitones** — a minor seventh is "6 letters up, 10 semitones up". `transpose()` advances the letter first, then derives whatever accidental makes the semitone count true. Eb up a m7: six letters above E is D; ten semitones above Eb is pitch class 1; the accidental that puts a D on pitch class 1 is ♭ — result **Db**, never C#. There is no lookup table of correct spellings to maintain; correctness falls out of the arithmetic in every key, which is why the tests can demand all twelve.

## Chords and scales are data

Chord qualities (`maj7`, `7`, `m7`, `m7b5`, `dim7`, `6`, `m6` — written as guitarists write them) and scale types (the seven major modes, melodic/harmonic minor, pentatonics, blues) are declared as interval stacks over the root. `spellChord`/`spellScale` just map the formula through `transpose`, and an arpeggio *is* its chord formula played melodically. Adding a quality or scale is a data change, not new logic.

## Error edges, by design

Two deliberate boundaries:

- **User input returns `null`, programmer input throws.** `parseNote`/`parseChord` return `null` on garbage (UI handles it); `spellChord`/`spellScale` throw on an unparseable string root (that's a bug, not user error).
- **Beyond double accidentals is unnameable.** Transposition math can exceed ±2 (a diminished seventh over an exotic root like Bbb heads toward triple flats); `noteName` throws there rather than invent names that would break the parse round-trip.

## The fretboard bridge: chromatic frets, key-aware labels

A fret has no inherent key, so `fretboard.ts` treats the neck chromatically: `noteAt` spells fretted notes with a sharp-biased default, and `positionsOf` matches by pitch class — Gb finds the same frets as F#. The key-awareness comes back in `positions.ts`: a `PositionedNote` binds a fret to what it means *in a sequence*, keeping the sequence's spelling (in an Eb7 arpeggio drill, the fret that `noteAt` would call C# is labeled **Db**, degree 4). Positions are generated inside a fret window — the window *is* the position system: anchored ~4–5-fret windows now, with CAGED or 3-notes-per-string layers later just supplying their own windows. Strings follow guitar convention (1 = high E, 6 = low E, standard tuning default), and results are ordered low string then ascending fret — an ascending playable path, ready to drill.
