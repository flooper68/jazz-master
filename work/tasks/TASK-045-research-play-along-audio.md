---
id: TASK-045
title: Research sampled-instrument playback for play-along
epic: EPIC-014
status: backlog
depends_on: []
source: NOTE-009
created: 2026-07-07
---

# TASK-045 — Research sampled-instrument playback for play-along

## Goal

A decided, evidence-backed approach for playing an exercise's notes in the
browser with real sampled timbre, looped, with a sample-accurate metronome
click and adjustable tempo — so EPIC-014's implementation tasks start on a
chosen stack instead of mid-flight library regret.

## Context

Run `processes/deep-research.md`, using the next available `RES-###` ID at
claim time. Owner constraints from NOTE-009: real timbre is non-negotiable
(synth-only rejected); **guitar timbre preferred**, piano acceptable as
fallback if sampled guitar loses badly on quality-per-megabyte; tempo must be
adjustable (schedule notes at any BPM — no time-stretching of fixed audio).

Questions to answer at minimum:

1. **Sample sources**: freely licensable sampled guitar (and fallback piano)
   sets — soundfonts (FluidR3, etc.), sample packs, per-note sets. Licensing,
   quality, size per octave-range actually needed (the packs live in a
   guitar-friendly ~2-octave band).
2. **Playback library vs hand-rolled**: candidates to evaluate at minimum —
   **smplr**, **soundfont-player / soundfont2 loaders**, **Tone.js
   (Sampler)**, and **hand-rolled WebAudio** (decode per-note samples,
   schedule `AudioBufferSourceNode`s — our needs are narrow: short monophonic
   lines + a click).
3. **Scheduling**: look-ahead scheduling for drift-free loop + click at
   arbitrary BPM (the Chris Wilson "tale of two clocks" pattern vs. what the
   libraries provide); count-in support.
4. **Asset strategy**: lazy-load + cache samples so non-playing views pay
   nothing and playback works offline after first load (local-first,
   ADR-002/ADR-006 posture; same bundle discipline as the VexFlow chunk,
   TASK-039).
5. **Shared infrastructure**: what of the metronome/scheduler is reusable as
   EPIC-010's count-in (RES-014 assumed a metronome count-in for recording).

Decision criteria, in order: (1) timbre quality of guitar at realistic asset
weight; (2) scheduling accuracy for loop + click across tempo changes; (3)
bundle/asset size and offline fit; (4) React 19 + Vite integration friction
and maintenance health; (5) licensing.

## Acceptance criteria

- [ ] A `research/RES-###-play-along-audio.md` file exists per the
      deep-research process: cited comparison of sample sources and playback
      approaches against the criteria, with a recommendation
- [ ] ADR drafted in `architecture/decisions/` recording the chosen playback
      stack and its consequences
- [ ] EPIC-014 implementation tasks filed and sized from the findings
      (playback engine; runner controls + per-exercise tempo persistence at
      minimum), and the epic's task list updated

## Verification

The research file and ADR exist and are internally consistent; EPIC-014
lists concrete next tasks with the research linked.

## Log

(empty — not yet claimed)
