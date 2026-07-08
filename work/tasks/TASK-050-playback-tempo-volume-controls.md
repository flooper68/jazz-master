---
id: TASK-050
title: Add playback volume controls and 200 BPM tempo ceiling
epic: EPIC-014
status: done
depends_on: []
source: NOTE-011
created: 2026-07-08
---

# TASK-050 - Add playback volume controls and 200 BPM tempo ceiling

## Goal

Play-along controls let the user balance guitar and metronome volume separately
and raise any exercise tempo up to 200 BPM.

## Problem brief

Current condition: guitar sample playback and metronome click have fixed
relative levels, and the tempo slider is capped at the authored exercise tempo
(often 60 BPM in the starter pack).
Desired condition: the user can make the click or guitar louder/quieter and can
practice the same exercise anywhere from the floor tempo to 200 BPM.
Affected user/workflow: play-along practice in the runner.
Evidence: NOTE-011 owner feedback; TASK-047 explicitly shipped an authored-BPM
ceiling that now conflicts with desired use.
Baseline: no volume controls; tempo ceiling equals authored BPM.
Target: separate metronome and guitar volume controls, persisted if useful, and
tempo max fixed at 200 BPM for all exercises.
How we will know it improved: the runner can play a 60 BPM exercise at 200 BPM,
and changing click/guitar volume affects active playback.

## Context

Touch the Web Audio engine and runner controls. Keep all persistence in typed
stores under `apps/web/src/storage/` if volumes are remembered. Do not conflate
this with EPIC-004's future full metronome; this is play-along control polish.

## Acceptance criteria

- [x] Tempo slider maximum is 200 BPM for every exercise, while the lower floor
      remains usable for slow practice
- [x] Stored per-exercise tempos above authored BPM are accepted and restored
- [x] Separate guitar and metronome/click volume controls are exposed in the
      runner and have accessible names
- [x] Volume changes affect active playback without restarting unless the audio
      engine cannot support live changes cleanly
- [x] Tests cover clamping/persistence and engine volume scheduling behavior
- [x] `bun run --cwd codebase check` passes
- [x] `bun run --cwd codebase check:e2e` passes

## Verification

- `bun run --cwd codebase check`
- `bun run --cwd codebase check:e2e`
- Manual browser pass: start a 60 BPM exercise, drag tempo to 200 BPM, lower
  guitar volume, lower click volume, and confirm the audible mix changes.

## Log

### 2026-07-08 — claimed (agent)

Plan: raise the shared play-along tempo ceiling to 200 BPM, keep the slow-practice
floor, add accessible guitar/click volume controls in the runner, pass live volume
updates through the Web Audio engine, and cover storage clamping plus engine/UI
behavior with focused tests. Baseline: fixed mix and authored-BPM ceiling. Target:
60 BPM exercises can play at 200 BPM, and volume changes affect active playback.

### 2026-07-08 — done (agent)

Raised the persisted play-along tempo ceiling to 200 BPM while keeping the 40 BPM
floor and invalid-tempo fallback to authored tempo. Added accessible guitar and
click volume sliders to the runner, passed initial mix levels into playback, and
added a live `setVolumes` engine API that scales future sampled-note velocity and
click gain without restarting playback. Volumes are intentionally session-local;
only per-exercise tempo remains durable. Review: degraded self-review because
subagent spawning is disallowed unless explicitly requested in this environment;
fixed one review finding around invalid tempo fallback. Security/privacy
checklist: no concerns; no new durable data shape, dependency, secret, or
permission surface. Verification: focused Vitest suite green; `bun run --cwd
codebase check` green; `bun run --cwd codebase check:e2e` green after sandbox
port binding was approved; browser pass verified max=200, visible 200 BPM,
active playback, and live guitar/click slider updates. Audible mix change is
covered by the engine scheduling test rather than direct listening in this
environment.
