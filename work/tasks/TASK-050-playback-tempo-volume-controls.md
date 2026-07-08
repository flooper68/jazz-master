---
id: TASK-050
title: Add playback volume controls and 200 BPM tempo ceiling
epic: EPIC-014
status: backlog
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

- [ ] Tempo slider maximum is 200 BPM for every exercise, while the lower floor
      remains usable for slow practice
- [ ] Stored per-exercise tempos above authored BPM are accepted and restored
- [ ] Separate guitar and metronome/click volume controls are exposed in the
      runner and have accessible names
- [ ] Volume changes affect active playback without restarting unless the audio
      engine cannot support live changes cleanly
- [ ] Tests cover clamping/persistence and engine volume scheduling behavior
- [ ] `bun run --cwd codebase check` passes
- [ ] `bun run --cwd codebase check:e2e` passes

## Verification

- `bun run --cwd codebase check`
- `bun run --cwd codebase check:e2e`
- Manual browser pass: start a 60 BPM exercise, drag tempo to 200 BPM, lower
  guitar volume, lower click volume, and confirm the audible mix changes.
