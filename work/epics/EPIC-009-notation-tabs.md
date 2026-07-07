---
id: EPIC-009
title: Notation & tabs — render exercises as staff notation + tablature
vision: VIS-001
status: in-progress
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

In progress. Research landed (RES-013) and the rendering approach is decided: VexFlow 5 behind a project-owned `<Notation>` component, rhythm derived not stored, lazy-loaded (ADR-010 — carries deferred-grill questions). Implementation tasks TASK-037–039 are filed and sized; TASK-037 is the entry point.

## Last reviewed

2026-07-07 — TASK-014 done: RES-013 + ADR-010 written, implementation tasks TASK-037–039 filed.
