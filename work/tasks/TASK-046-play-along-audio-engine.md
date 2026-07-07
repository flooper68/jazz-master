---
id: TASK-046
title: Build the play-along audio engine
epic: EPIC-014
status: backlog
depends_on: [TASK-045]
source: TASK-045
research: RES-015
created: 2026-07-07
---

# TASK-046 — Build the play-along audio engine

## Goal

A lazy-loaded Web Audio playback module can schedule an exercise's resolved
notes, metronome click, count-in, loop, stop, and tempo changes using sampled
guitar timbre.

## Problem brief

Current condition: exercises are silent and there is no playback/scheduler
infrastructure.
Desired condition: code can play a resolved exercise timeline at a selected BPM
with sampled guitar and a click, without loading audio code/assets until needed.
Affected user/workflow: practice runner users who need a model to imitate and a
clock to play against.
Evidence: NOTE-009 and RES-015; owner prioritized play-along ahead of the
recording track.
Baseline: no sampled playback and no metronome/count-in module.
Target: a tested audio-engine seam that the runner can call in TASK-047.
How we will know it improved: unit tests prove timeline scheduling behavior, and
a manual browser smoke proves notes/click can be heard without console errors.

## Context

Follow ADR-011 and RES-015. Keep `@jazz-master/theory` pure; audio code belongs
in `apps/web/src/audio/` (or a similarly app-local module) and is imported
lazily by UI code. Start with FluidR3_GM `electric_guitar_jazz`; during
implementation, prove whether `smplr.Soundfont` can avoid excessive loading or
whether `smplr.Sampler` plus an app-owned note manifest is needed. Include
sample attribution if any sample files are mirrored into the repo.

## Acceptance criteria

- [ ] Audio engine module exposes a small project-owned API for play/stop/loop
      of a resolved exercise timeline at a BPM; React components do not import
      `smplr` directly
- [ ] Metronome click and count-in use the same scheduler/timeline
      infrastructure and can run without loading guitar samples
- [ ] Samples and audio code are lazy-loaded; non-playing app routes do not load
      `smplr` or sample assets
- [ ] Sample fetches are cached with CacheStorage when available, with graceful
      fallback in local HTTP dev
- [ ] Pure scheduler/timeline tests cover straight-eighth note spacing,
      count-in, loop wrap, stop, and tempo-change behavior
- [ ] Attribution for the chosen sample source is recorded if assets are
      mirrored locally
- [ ] `bun run --cwd codebase check` passes

## Verification

- `bun run --cwd codebase check`
- Start the dev server and manually verify in a browser-targeted harness/page or
  temporary route that an existing resolved exercise can play sampled notes plus
  click, loop, stop, and change tempo with no console errors. Remove any
  temporary harness before commit unless it is the intended dev-only surface.

## Open questions (deferred grill)

1. Should v1 mirror only the exact two-octave starter range, or mirror a wider
   guitar range up front to avoid another asset pass when new lessons land?
2. Is a synthesized metronome click acceptable, or should the click also be a
   sampled asset for timbre consistency?
3. Does count-in belong in the engine default, or should TASK-047 decide whether
   the runner exposes it as a control?

## Log

(empty — not yet claimed)
