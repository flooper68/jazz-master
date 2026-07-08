---
id: TASK-046
title: Build the play-along audio engine
epic: EPIC-014
status: done
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

- [x] Audio engine module exposes a small project-owned API for play/stop/loop
      of a resolved exercise timeline at a BPM; React components do not import
      `smplr` directly
- [x] Metronome click and count-in use the same scheduler/timeline
      infrastructure and can run without loading guitar samples
- [x] Samples and audio code are lazy-loaded; non-playing app routes do not load
      `smplr` or sample assets
- [x] Sample fetches are cached with CacheStorage when available, with graceful
      fallback in local HTTP dev
- [x] Pure scheduler/timeline tests cover straight-eighth note spacing,
      count-in, loop wrap, stop, and tempo-change behavior
- [x] Attribution for the chosen sample source is recorded if assets are
      mirrored locally
- [x] `bun run --cwd codebase check` passes

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

### 2026-07-08 — claimed (agent)
Plan: build `apps/web/src/audio/` as the project-owned seam: pure timeline and
lookahead scheduler utilities tested in Vitest, plus a lazy Web Audio engine
that hides `smplr` and sample/click details from React. Start with a small
FluidR3 electric-jazz-guitar manifest and app-owned cached fetch wrapper so the
sampler can load only the notes it needs; synthesize the metronome click so it
can run without guitar samples. Measurable aim: the baseline is zero playback
infrastructure; target is a tested engine API that can play/stop/loop an
existing resolved exercise at a BPM, with count-in/click and tempo changes
covered by unit tests plus a browser smoke.

### 2026-07-08 — done
Implemented `apps/web/src/audio/`: guitar-position MIDI mapping, FluidR3_GM
exact-range sampler preset, pure straight-eighth timeline, pure lookahead
scheduler, and a browser-only `createPlayAlongEngine` with
`playResolvedExercise`, `playMetronome`, tempo changes, stop, and dispose.
`smplr` is dynamically imported only for sampled guitar playback; metronome
playback does not load guitar samples. Sample fetches use `CacheStorage` in
secure contexts and fall back to `HttpStorage`; source attribution is recorded
under `apps/web/public/audio/play-along/ATTRIBUTION.md`.

Review: independent subagent review was unavailable under this session's tool
policy despite the repo's standing authorization, so degraded-mode self-review
was completed per `processes/code-review.md`. Security/privacy checklist: no
stored user data, no secrets, intentional HTTPS sample network access, new
dependency limited to the browser audio seam and locked in `bun.lock`.

Verification: `bun run --cwd codebase test -- apps/web/src/audio` passed.
`bun run --cwd codebase check` passed (Wrangler printed its existing sandbox
log-file warning during build but exited 0). Browser smoke against
`http://127.0.0.1:4321/app/practice` injected a temporary button, dynamic
imported the engine, loaded FluidR3 guitar samples for "C major — open
position", started looped playback with count-in, changed tempo, stopped, and
reported zero console errors or failed requests. Limitation: headless Chromium
runs muted, so this verifies browser fetch/decode/scheduling behavior, not
human-audible output.
