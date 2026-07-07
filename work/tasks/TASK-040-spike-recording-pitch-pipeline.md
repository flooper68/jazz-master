---
id: TASK-040
title: Throwaway spike — record a take and extract pitches/onsets from real guitar
epic: EPIC-010
status: backlog
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
