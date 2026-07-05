---
id: TASK-003
title: Fretboard model and SVG fretboard component
epic: EPIC-001
status: done
depends_on: [TASK-002]
created: 2026-07-05
---

# TASK-003 — Fretboard model and SVG fretboard component

## Goal

A fretboard domain model (strings, frets, standard tuning, note-at-position) and a reusable SVG `<Fretboard>` React component that highlights arbitrary positions.

## Context

Depends on TASK-002's theory core for note math. Model lives in `src/theory/fretboard.ts` (pure), component in `src/components/Fretboard.tsx`. Standard tuning EADGBE; design the model so alternate tunings are possible but don't build UI for them.

## Acceptance criteria

- [x] `noteAt(string, fret)` returns the correct note for standard tuning (unit-tested across all strings, frets 0–15)
- [x] `positionsOf(note | pitchClass)` finds all positions within a fret range
- [x] `<Fretboard>` renders strings, frets, nut, and fret markers (3/5/7/9/12) as SVG; scales to container width
- [x] Accepts a list of positions to highlight, each with optional label (note name, interval degree) and color role (root vs other)
- [x] Handles a fret-range window (e.g. frets 3–8) for position-based display
- [x] Component test: given positions for C major triad, the right dots with the right labels appear
- [x] `bun run check` passes

## Verification

```
bun run check
bun run dev   # temporary demo on the dashboard showing a highlighted fretboard is fine; remove or keep behind the dashboard stub
```

## Log

### 2026-07-05 — claimed (agent)

Plan: `src/theory/fretboard.ts` (pure) — `Tuning` as array of open-string
notes indexed by string number (1 = high E … 6 = low E, guitarist
convention), `STANDARD_TUNING`, `noteAt(string, fret)` (open note + fret
semitones; fretted notes spelled with sharps as the chromatic default —
callers wanting key-correct spelling pass labels themselves), and
`positionsOf(note | pitchClass, {minFret, maxFret})` matching by pitch
class. Test-first per theory-core rule. Then `src/components/Fretboard.tsx`:
scalable SVG (fixed viewBox, width 100%), strings/frets/nut, markers at
3/5/7/9/12 (double at 12), fret-range window prop, highlight list with
optional label + `root`/`other` color role. Component test: C major triad
positions render correct dots/labels. Temporary demo on DashboardPage.

Measurable aim (derived): baseline — no way to display any fretboard;
target — a reusable `<Fretboard>` renders arbitrary highlighted positions
with correct note math (signal: exhaustive `noteAt` tests + component test
+ visual check in `bun run dev`).

### 2026-07-05 — done

Model + component implemented as planned; Cmaj7 demo kept on the dashboard
(marked temporary). Reviewed by code-reviewer + ui-code-reviewer agents; all
acceptance criteria confirmed met. Review fixes applied: SVG colors moved
from hardcoded hex to Tailwind zinc/amber utility classes (verified present
in built CSS); labels render ASCII accidentals as ♭/♯ (convention rule) with
a component test; double-dot octave markers generalized to frets 12 and 24;
marker test hooks via `data-marker` instead of a magic radius; JSDoc guidance
on `aria-label` and `label`; inverted `fretRange` clamps to an empty span;
`positionsOf` rejects fractional numeric pitch classes. Three low-severity
findings deferred with justification → INS-004 (partial-Tuning guard —
unreachable by types; duplicate-position key collision — impossible for real
fretboard data; brittle line-count assertion — intent documentation).
Verification: `bun run check` green (203 tests); `bun run dev` visual check
done via browser screenshot — nut, open strings, markers at 3/5, amber roots
and correct Cmaj7 spellings all render correctly. Watch in next QA review:
fretboard legibility at small container widths and dot contrast.
