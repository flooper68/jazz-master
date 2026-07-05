---
id: TASK-003
title: Fretboard model and SVG fretboard component
epic: EPIC-001
status: backlog
depends_on: [TASK-002]
created: 2026-07-05
---

# TASK-003 — Fretboard model and SVG fretboard component

## Goal

A fretboard domain model (strings, frets, standard tuning, note-at-position) and a reusable SVG `<Fretboard>` React component that highlights arbitrary positions.

## Context

Depends on TASK-002's theory core for note math. Model lives in `src/theory/fretboard.ts` (pure), component in `src/components/Fretboard.tsx`. Standard tuning EADGBE; design the model so alternate tunings are possible but don't build UI for them.

## Acceptance criteria

- [ ] `noteAt(string, fret)` returns the correct note for standard tuning (unit-tested across all strings, frets 0–15)
- [ ] `positionsOf(note | pitchClass)` finds all positions within a fret range
- [ ] `<Fretboard>` renders strings, frets, nut, and fret markers (3/5/7/9/12) as SVG; scales to container width
- [ ] Accepts a list of positions to highlight, each with optional label (note name, interval degree) and color role (root vs other)
- [ ] Handles a fret-range window (e.g. frets 3–8) for position-based display
- [ ] Component test: given positions for C major triad, the right dots with the right labels appear
- [ ] `bun run check` passes

## Verification

```
bun run check
bun run dev   # temporary demo on the dashboard showing a highlighted fretboard is fine; remove or keep behind the dashboard stub
```
