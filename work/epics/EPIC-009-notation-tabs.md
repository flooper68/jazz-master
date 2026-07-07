---
id: EPIC-009
title: Notation & tabs — render exercises as staff notation + tablature
vision: VIS-001
status: done
created: 2026-07-05
---

# EPIC-009 — Notation & tabs

## Goal

Every exercise in the practice view can be read two ways at once: standard notation and guitar tablature, cleanly rendered and in sync.

## Why

The desired practice flow shows "both notes and tabs." Fretboard/diagram views (EPIC-001) cover grips and positions, but melodic material — scales, arpeggios, lines — reads naturally as a staff + TAB pair. Reading notation is itself a skill jazz guitarists need.

## Scope

- Research + ADR: rendering approach (VexFlow, alphaTab, custom SVG over the theory core, …) — bundle size, React 19 fit, enharmonic-spelling control are the criteria
- A `<Notation>` component: takes exercise data (theory-core notes + rhythm + optional fretboard positions), renders staff and TAB
- Enharmonic correctness flows from the theory core — the renderer must not respell notes
- Integration into the guided practice runner (EPIC-008)

## Out of scope

- Notation editing, MusicXML/score import, full lead-sheet layout
- Audio playback of the notation (EPIC-004/006 own audio)

## Depends on

- EPIC-001 (theory core); consumed by EPIC-008's runner

## Tasks

- TASK-014 — Research notation + tab rendering approach
- TASK-037 — Notation component — staff + TAB via VexFlow
- TASK-038 — Show notation in the practice runner via a display hint
- TASK-039 — Trim the notation bundle — evaluate vexflow-core + single font

## Done when

A scale or arpeggio exercise in the practice runner shows correct, readable staff notation with aligned tablature, with enharmonic spelling identical to the theory core's.

## Current status

Done — all four tasks shipped. Done-when assessment: met. Every lesson-pack scale/arpeggio exercise in the practice runner shows an aligned staff + TAB pair via the `'notation'` display hint, spelled exactly as the theory core spells (enharmonic tests + flat-key read verified under TASK-037/038). VexFlow is lazy-loaded out of the initial `/app` chunk, and TASK-039 trimmed that chunk from 692 KB to 389 KB gzip (the `vexflow/bravura` entry — Bravura + Academico only, fonts embedded, offline rendering verified with external network blocked). Deferred UX polish lives in INS-030; notation e2e coverage gap in INS-031 — both are inbox items for triage, not epic blockers.

## Last reviewed

2026-07-07 — TASK-039 done (bundle trim); epic closed.
