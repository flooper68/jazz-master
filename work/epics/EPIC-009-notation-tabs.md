---
id: EPIC-009
title: Notation & tabs — render exercises as staff notation + tablature
vision: VIS-001
status: backlog
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

- TASK-014 — Research notation + tab rendering approach (→ ADR; assigns the next available RES ID when claimed)
- (implementation tasks created after the research lands)

## Done when

A scale or arpeggio exercise in the practice runner shows correct, readable staff notation with aligned tablature, with enharmonic spelling identical to the theory core's.

## Current status

Backlog. The planned notation research has not started; no `RES-*` ID is reserved before the task is claimed.

## Last reviewed

2026-07-05 — Knowledge maintenance pass removed the stale `RES-008` placeholder because that ID now belongs to product/problem-framing research.
