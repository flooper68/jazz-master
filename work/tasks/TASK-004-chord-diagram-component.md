---
id: TASK-004
title: Chord diagram component
epic: EPIC-001
status: backlog
depends_on: [TASK-003]
created: 2026-07-05
---

# TASK-004 — Chord diagram component

## Goal

A `<ChordDiagram>` component rendering the classic vertical grip chart: a small fretboard window with dots, fingerings, open/muted string markers, and a base-fret indicator.

## Context

This is the primary way voicings are shown in EPIC-002's drills, so it must look clean at small sizes (grid of ~8 diagrams on screen). Distinct from `<Fretboard>` (TASK-003), which is the full horizontal neck — but they may share low-level SVG helpers.

Grip data shape (align with the theory core's types): per string, either a fret number, `0` (open), or `x` (muted); optional finger numbers; optional base fret for grips above the nut.

## Acceptance criteria

- [ ] Renders 4–5 fret window, nut vs base-fret ("5fr") handling correct
- [ ] Dots with optional finger numbers; `x`/`o` markers above the nut line
- [ ] Chord symbol label above the diagram
- [ ] Crisp at both small (~90px) and large (~240px) rendered widths
- [ ] Component tests for a nut-position grip and a 6th-fret grip
- [ ] `bun run check` passes

## Verification

```
bun run check
bun run dev   # render a demo grid: Cmaj7, Dm7, G7, Fmaj7 grips
```
