---
id: EPIC-014
title: Play-along — hear the exercise, loop it, keep time
vision: VIS-001
status: done
created: 2026-07-07
---

# EPIC-014 — Play-along

## Goal

During any exercise the player can hear its notes played in time with real
instrument timbre, loop it continuously, and practice against a metronome
click — with the tempo adjustable below the authored target and remembered
per exercise.

## Why

Every exercise today is silent: no model to imitate, nothing keeping the
player in time. The owner's testing feedback (NOTE-009) named this the
biggest gap, and the grill made it the next pillar — prioritized ahead of the
recording/scoring track (EPIC-010's remaining tasks queue behind it). It is
also the prerequisite for the "moving exercises" content arc (INS-032): the
loop first, then content that moves inside it.

Owner decisions this epic rests on (NOTE-009):

- v1 is both halves together — notes played in time, looped, with a click;
  neither half ships alone.
- **Real sampled timbre from day one** — a synthetic beep fails the
  three-months test; synth-only v1 is rejected.
- **Guitar timbre preferred** — it should sound like the instrument in the
  player's hands; piano is the fallback if sampled guitar loses badly on
  quality-per-megabyte.
- **Tempo is adjustable and remembered per exercise** — slow practice is the
  method; the app persists where the player left off (typed store, ADR-002).

## Scope

- **Feasibility research first** (blocking, TASK-045): sampled-instrument
  playback in the browser — sample sources/licensing (guitar first), sampler
  libraries, asset weight and loading strategy, WebAudio scheduling accuracy
  for loop + click. Result shapes the implementation tasks.
- Exercise playback: the exercise's resolved notes scheduled in time (rhythm
  derived straight-eighths, per ADR-010's model) with sampled timbre;
  audio assets lazy-loaded so non-playing views pay nothing (same bundle
  discipline as the notation chunk, TASK-039).
- Loop: continuous repetition of the exercise with the click underneath;
  count-in behavior decided at implementation.
- Metronome: click at the session tempo, usable during play-along and while
  the player plays alone.
- Tempo control in the runner: adjust from the slow-practice floor up to 200 BPM,
  persisted per exercise via a typed store.
- Session-local guitar and click volume controls in the runner.
- Local-first: play-along sample playback works after the app and assets have
  already loaded once, using cached samples where the browser supports it; no
  backend.

## Out of scope

- Backing harmony / chord comping under the line — that arrives with the
  moving-exercise content model (INS-032), which waits on this epic.
- The moving-exercise / JSON-pack model redesign itself (INS-032/INS-033).
- Swing feel or humanized playback in v1.
- Full PWA/offline app shell guarantees. EPIC-014 caches playback assets; it
  does not make first navigation to the app work with no network.

## Depends on

- EPIC-008 (runner + exercise model provide the notes and tempo)

## Relations

- Takes priority over EPIC-010's implementation tasks (TASK-040–044) per the
  owner's NOTE-009 call; the metronome/count-in built here is shared
  infrastructure EPIC-010's capture flow expects (RES-014 recommended a
  count-in click).

## Tasks

- TASK-045 — Research sampled-instrument playback for play-along (RES-015; ADR-011)
- TASK-046 — Build the play-along audio engine
- TASK-047 — Add runner play-along controls and per-exercise tempo persistence
- TASK-050 — Add playback volume controls and 200 BPM tempo ceiling (post-epic control polish)

## Done when

On any existing exercise the player can press play and hear its notes in
sampled guitar (or fallback piano) timbre, loop them with a metronome click,
drag the tempo from the slow-practice floor up to 200 BPM, balance guitar/click
volume, and find that tempo remembered next session — with sample playback
working from cache after the app/assets have loaded once.

## Current status

Done. TASK-045 chose the playback stack in RES-015/ADR-011, TASK-046 added the
sampled playback engine, TASK-047 wired the runner controls plus per-exercise
tempo persistence, and TASK-050 added guitar/click volume controls plus a
200 BPM ceiling.

## Last reviewed

2026-07-08 — completed by TASK-050; runner play-along, loop/click controls,
per-exercise remembered tempo, 200 BPM ceiling, and session-local guitar/click
volume controls are shipped.
