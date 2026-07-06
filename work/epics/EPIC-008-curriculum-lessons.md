---
id: EPIC-008
title: Curriculum & lessons — leveled content and a guided practice runner
vision: VIS-001
status: in-progress
created: 2026-07-05
---

# EPIC-008 — Curriculum & lessons

## Goal

The app owns a curriculum: lessons organized by area (scales, arpeggios, chords, standards) and level, each a sequence of concrete exercises a guitarist plays through in a guided practice mode.

## Why

This is the content backbone of the "open app, pick up guitar, play" flow. The planner (EPIC-011) can only schedule what exists; the practice runner is where the user actually spends their time.

## Scope

- **Exercise model**: a playable unit — what to play (notes/positions from the theory core, rendered on fretboard/diagrams; notation+tabs once EPIC-009 lands), in which key/position, at what tempo, for how long
- **Lesson model**: ordered exercises + metadata (area, level, prerequisites, estimated minutes)
- **Curriculum data**: hand-authored lesson packs as typed TS data, starting with scales and arpeggios (major scale positions, maj7/m7/7 arpeggios), extensible to chords and standards
- **Guided practice runner**: step through a lesson exercise by exercise — display, timer, self-grade (got it / shaky / missed), next — writing a session record at the end
- Level tagging that the planner and profile (EPIC-011) can consume

## Out of scope

- Plan generation (EPIC-011), notation rendering (EPIC-009), machine scoring (EPIC-010), metronome (EPIC-004)
- Bundled copyrighted material — standards lessons reference user-entered changes (EPIC-005)

## Depends on

- EPIC-001 (theory core incl. scales/arpeggios, fretboard/diagram components, persistence)

## Tasks

- TASK-011 — Exercise & lesson content model
- TASK-012 — First lesson pack: scales & arpeggios
- TASK-013 — Guided practice session runner
- (more as discovered)

## Done when

A user can open a scales lesson appropriate to their level, be guided through its exercises with fretboard display and timers, self-grade each, and the completed session is persisted.
