---
id: TASK-015
title: Research browser audio recording & pitch-detection feasibility
epic: EPIC-010
status: backlog
depends_on: []
research: RES-009
created: 2026-07-05
---

# TASK-015 — Research recording & scoring feasibility

## Goal

Know, before building any UI, whether credible in-browser scoring of guitar takes is achievable — and if so, with what stack and what realistic quality ceiling.

## Context

Recording + scoring is VIS-001's declared riskiest bet. Run `processes/deep-research.md` -> `research/RES-009-audio-recording-scoring.md`. (RES-009 follows the planned notation research RES-008.)

Questions to answer:
1. Monophonic guitar pitch detection in the browser — which algorithms/libraries (autocorrelation/YIN/CREPE-style, Web Audio + WASM/ML options) actually work on electric and acoustic guitar signals, and how accurately?
2. Onset detection good enough for timing scores at practice tempos?
3. Polyphony (chords): realistically out of reach client-side, or partially scorable? (Sets expectations for chord lessons.)
4. Latency/UX constraints: mic permissions, iOS Safari quirks, processing in an AudioWorklet vs offline after the take
5. Scoring design: given detected notes/onsets vs expected (exercise model), what does a fair, motivating 0–100 score look like? Prior art in Yousician/Rocksmith-type products.
6. Privacy/storage: cost of keeping takes locally vs score-only

## Acceptance criteria

- [ ] `research/RES-009-audio-recording-scoring.md` exists with cited findings on all six questions and a clear go / staged-go / no-go recommendation
- [ ] Recommended v1 scope stated (e.g. "monophonic lines only, offline analysis after the take")
- [ ] Follow-up EPIC-010 tasks filed per the recommendation (a throwaway spike task is an acceptable first follow-up); EPIC-010 file updated
- [ ] If the answer is "not credibly feasible," VIS-001 impact is written up as a proposal to the owner — strategy is not edited by the agent

## Verification

RES-009 exists, answers the six questions with sources, and EPIC-010 reflects the outcome.
