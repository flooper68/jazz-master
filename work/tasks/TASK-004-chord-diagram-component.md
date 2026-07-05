---
id: TASK-004
title: Chord diagram component
epic: EPIC-001
status: done
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

- [x] Renders 4–5 fret window, nut vs base-fret ("5fr") handling correct
- [x] Dots with optional finger numbers; `x`/`o` markers above the nut line
- [x] Chord symbol label above the diagram
- [x] Crisp at both small (~90px) and large (~240px) rendered widths
- [x] Component tests for a nut-position grip and a 6th-fret grip
- [x] `bun run check` passes

## Verification

```
bun run check
bun run dev   # render a demo grid: Cmaj7, Dm7, G7, Fmaj7 grips
```

## Log

### 2026-07-05 — claimed (agent)
Plan: `Grip` type in the component file (like `FretboardHighlight`) — six frets written
low E → high E as guitarists write grips (`x32000`), absolute fret numbers, `fingers`
aligned, `baseFret` derived from the grip when omitted (nut window if it fits in 4 frets,
else the lowest fretted fret). Vertical SVG: chord label, x/o marker row, nut vs "Nfr"
side label, dots with finger numbers. Extract `displayAccidentals` from Fretboard into
shared `src/components/notation.ts`. Demo grid of Cmaj7/Dm7/G7/Fmaj7 on VoicingsPage as
the in-app verification surface. Measurable aim: EPIC-002 drills can show ~8 clean
diagrams per screen; verification signal = component tests + demo grid at small width.

### 2026-07-05 — done
`<ChordDiagram>` shipped with `Grip` type (frets low-E→high-E 6-tuple, absolute
fret numbers, `fingers` 6-tuple, derived-or-explicit `baseFret`; fretted notes
below baseFret throw). `displayAccidentals` extracted to `components/notation.ts`,
shared with Fretboard. Demo grid (Cmaj7/Dm7/G7/Fmaj7) on VoicingsPage. Verified
in browser via Playwright at ~95px grid width and 240px single diagram — crisp
at both, all four grips visually correct; both reviewer agents confirmed the
grips note-by-note. Review (code-reviewer + ui-code-reviewer): no must-fix;
fixed the should-fixes (symmetric padding so nut-position diagrams center in
their grid track, fingers tightened to a 6-tuple, baseFret guard + tests,
`data-basefret` test hook). Deferred with justification → INS-005 (barre
indicator, >5-fret window cap, aria accidentals — EPIC-002's voicing library
should drive these). Discovered pre-existing mobile horizontal overflow in the
app shell → ISSUE-001. `bun run check` green, 210 tests.
