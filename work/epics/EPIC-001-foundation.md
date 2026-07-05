---
id: EPIC-001
title: Foundation — app shell, theory core, fretboard
vision: VIS-001
status: in-progress
created: 2026-07-05
---

# EPIC-001 — Foundation

## Goal

Everything the feature epics build on: an app shell with navigation, a well-tested music-theory domain core, and reusable fretboard/chord-diagram rendering.

## Why first

Every pillar (voicings, progressions, repertoire, ear training) needs to name notes, spell chords, and draw fretboards. Getting these primitives right — pure, typed, tested — makes every later epic a UI exercise instead of a theory-debugging exercise.

## Scope

- App shell: routing, layout, navigation between practice modules
- Theory core (`src/theory/`): pitch classes, notes, intervals, chord spelling (maj7, m7, 7, m7b5, dim7, alterations), key/scale basics
- Fretboard model: strings/frets/tuning, mapping notes to positions
- Rendering: SVG `<Fretboard>` and `<ChordDiagram>` components
- Local persistence layer (localStorage wrapper) for later progress tracking

## Out of scope

- Audio of any kind (EPIC-004 owns the metronome)
- Actual drill/practice logic (feature epics own that)

## Tasks

- TASK-001 — App shell with routing and navigation
- TASK-002 — Music theory core: notes, intervals, chord spelling
- TASK-003 — Fretboard model and SVG fretboard component
- TASK-004 — Chord diagram component
- (more as discovered)

## Done when

A developer can `import { spellChord } from '@/theory'`, get correct notes for `Cmaj7`, and render them on a `<Fretboard>` — all covered by tests, navigable from the app shell.
