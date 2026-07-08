---
id: TASK-040
title: Throwaway spike — record a take and extract pitches/onsets from real guitar
epic: EPIC-010
status: blocked
blocked_reason: owner must record at least 3 real-guitar takes with the spike harness before detection quality and the TASK-042 go/no-go conclusion can be measured honestly
depends_on: []
source: TASK-015
research: RES-014
created: 2026-07-07
---

# TASK-040 — Throwaway spike: record + offline pitch/onset extraction on real guitar

## Goal

Prove (or disprove) on real guitar signals that the RES-014 v1 pipeline —
getUserMedia capture, offline MPM/YIN pitch tracking, onset extraction — yields
note/onset data accurate enough to score against an exercise, before any product
UI is built.

## Context

RES-014's staged-go verdict rests on published algorithm accuracy; the one thing
sources cannot verify is our own end-to-end pipeline on real input (acoustic
guitar via laptop mic, electric via interface if available). This is explicitly
**throwaway code**: a scratch page or standalone script under a spike route/dir,
not reviewed to product standard, deleted or quarantined after findings are
recorded. Findings go into the task Log (and an INS/NOTE if they change the
plan). Owner participation is required — an agent cannot play a guitar.

Pipeline to spike (per RES-014 Recommendations): `getUserMedia` with
echoCancellation/noiseSuppression/autoGainControl set to `false`; record via
MediaRecorder (`audio/webm;codecs=opus`, `audio/mp4` fallback) or a raw-PCM
worklet; decode with `decodeAudioData`; run `pitchy` (MPM) or `pitchfinder`
(YIN) over ~2048-sample hops plus a spectral-flux/pitch-segment onset pass;
dump the detected note/onset list next to the expected notes of a simple
exercise (e.g. one octave of a C major scale at 80 BPM with count-in).

## Acceptance criteria

- [ ] A recorded real-guitar take of a known single-note exercise is captured in-browser and analyzed offline into a detected note list (pitch class + onset time)
- [ ] Detection quality is measured and recorded in the Log: per-note pitch accuracy (octave errors counted separately) and onset deviation stats vs the count-in grid, on at least 3 takes
- [ ] A clear "pipeline is / is not good enough for TASK-042 scoring" conclusion with evidence, plus any parameter picks (window size, thresholds, capture path) fed forward
- [ ] Spike code is not shipped into product paths (deleted, or isolated and excluded from the app)

## Verification

Log contains the measured accuracy table and conclusion; `git grep` shows no
spike imports from `apps/web/src/app/` product code; `bun run check` still green.

## Log

### 2026-07-08 - claimed (agent)

Plan: build a quarantined browser spike under `codebase/spikes/recording-pitch-pipeline/`
with explicit mic permission, MediaRecorder capture, offline PCM decode, YIN-style
pitch detection, simple onset extraction, and markdown/JSON export for three
real-guitar takes. Product code remains untouched; the task cannot be marked done
until the owner records at least 3 known C major scale takes and the measured
accuracy table is added here. Security/privacy checklist: mic access is user-gesture
only, no network or durable storage is introduced, and take data stays in memory
unless the owner manually downloads JSON.

### 2026-07-08 - blocked on real-guitar takes (agent)

Built the quarantined spike harness and README. Product code is untouched:
`git grep -n "recording-pitch-pipeline" -- codebase/apps/web/src/app` returned
no matches. Synthetic verification on generated C-major audio passes with 8/8
pitch-class accuracy, zero octave errors, and max onset deviation under 20 ms.
`bun run --cwd codebase check` passed (Wrangler printed sandbox-related log-file
EPERM warnings but exited 0). Independent review subagent unavailable in this
environment because the exposed multi-agent tool requires an explicit user
delegation request, so degraded self-review was used per `processes/code-review.md`.
Not done: real-guitar capture and the 3-take accuracy table/conclusion still
require the owner playing guitar through the harness.
