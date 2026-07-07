---
id: TASK-037
title: Notation component — staff + TAB via VexFlow
epic: EPIC-009
status: backlog
depends_on: []
source: TASK-014
research: RES-013
created: 2026-07-07
---

# TASK-037 — Notation component: staff + TAB via VexFlow

## Goal

A reusable `<Notation>` component that renders an exercise's resolved notes as an
aligned staff + tablature pair, with enharmonic spelling identical to the theory
core's — the ADR-010 seam made real.

## Context

Implements ADR-010 decisions 1–4 (read it first; RES-013 has the evidence).
Shape of the work:

- `bun add vexflow` in `apps/web` (v5.x, MIT). **Start with a spike**: the
  formatter/font documentation RES-013 cites is partly VexFlow-4-era — verify in a
  scratch test that `Stave` + `TabStave` + `Formatter.joinVoices/formatToStave`
  and explicit `Accidental` modifiers work as described in v5 before committing
  component structure. If the spike hits a wall, the recorded fallback is custom
  SVG (RES-013) — stop and re-scope rather than fight the library.
- A pure rhythm-derivation helper beside the content model
  (`apps/web/src/content/`): resolved exercise notes → duration events
  (straight-eighths default, beam groups of four, bars split by material length).
  No change to the `Exercise` type.
- `<Notation>` in `apps/web/src/components/`: props are theory-core
  spelled notes + positions (+ derived durations), renders SVG into a ref'd
  container via effect (external-synchronization exception). Only this component
  imports VexFlow; export it lazily (dynamic `import()` boundary) so VexFlow stays
  out of the initial `/app` chunk (ADR-010 decision 5).
- Enharmonic verbatim rule: keys come straight from theory-core spellings with
  explicit accidental glyphs; never `applyAccidentals`/key-signature derivation.

## Acceptance criteria

- [ ] VexFlow 5 spike confirmed (or fallback triggered and task re-scoped): staff +
      TAB aligned via one Formatter pass in our stack
- [ ] `<Notation>` renders a scale and an arpeggio exercise as staff + TAB, aligned
- [ ] Component tests assert rendered output carries theory-core spellings verbatim
      across flat keys (Db arpeggio content shows Db/flat glyphs, never C#)
- [ ] TAB numbers match the theory core's positioned notes for the exercise's fret
      window (no auto-refingering)
- [ ] Rhythm helper unit-tested (eighths default, beaming, bar split)
- [ ] VexFlow appears only behind the component's dynamic-import boundary (verify
      chunking in the build output)
- [ ] `bun run check` passes

## Verification

`bun run --cwd codebase check`; component tests green; `bun run --cwd codebase dev`
and view a flat-key exercise's staff+TAB manually; inspect `astro build` output for
a separate VexFlow-bearing chunk.
