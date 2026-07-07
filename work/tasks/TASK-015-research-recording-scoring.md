---
id: TASK-015
title: Research browser audio recording & pitch-detection feasibility
epic: EPIC-010
status: done
depends_on: []
research: RES-014
created: 2026-07-05
---

# TASK-015 — Research recording & scoring feasibility

## Goal

Know, before building any UI, whether credible in-browser scoring of guitar takes is achievable — and if so, with what stack and what realistic quality ceiling.

## Context

Recording + scoring is VIS-001's declared riskiest bet. Run `processes/deep-research.md`, using the next available `RES-###` ID at claim time, for audio recording and scoring feasibility.

Questions to answer:
1. Monophonic guitar pitch detection in the browser — which algorithms/libraries (autocorrelation/YIN/CREPE-style, Web Audio + WASM/ML options) actually work on electric and acoustic guitar signals, and how accurately?
2. Onset detection good enough for timing scores at practice tempos?
3. Polyphony (chords): realistically out of reach client-side, or partially scorable? (Sets expectations for chord lessons.)
4. Latency/UX constraints: mic permissions, iOS Safari quirks, processing in an AudioWorklet vs offline after the take
5. Scoring design: given detected notes/onsets vs expected (exercise model), what does a fair, motivating 0–100 score look like? Prior art in Yousician/Rocksmith-type products.
6. Privacy/storage: cost of keeping takes locally vs score-only

## Acceptance criteria

- [x] A `research/RES-###-audio-recording-scoring.md` file exists with cited findings on all six questions and a clear go / staged-go / no-go recommendation (`research/RES-014-audio-recording-scoring.md`, verdict: staged-go)
- [x] Recommended v1 scope stated (e.g. "monophonic lines only, offline analysis after the take") (exactly that scope, plus count-in-not-backing-track and score-only persistence)
- [x] Follow-up EPIC-010 tasks filed per the recommendation (a throwaway spike task is an acceptable first follow-up); EPIC-010 file updated (spike TASK-040, then TASK-041/052/053; TASK-044 gated)
- [x] If the answer is "not credibly feasible," VIS-001 impact is written up as a proposal to the owner — strategy is not edited by the agent (n/a — verdict is staged-go, so no VIS-001 impact proposal is required; strategy untouched)

## Verification

The recording/scoring research file exists, answers the six questions with sources, and EPIC-010 reflects the outcome.

## Log

### 2026-07-06 — claimed (agent)

Plan: run `processes/deep-research.md` on the six Context questions. Frame them as
concrete research questions in the RES file first, then fan out web searches per
question (algorithms/libraries incl. YIN/MPM/pYIN/CREPE + WASM/ML ports, onset
detection, polyphonic limits, AudioWorklet/iOS Safari constraints, Yousician/
Rocksmith scoring prior art, local storage cost), read primary sources, cross-check
decision-driving claims. Research file: `research/RES-014-audio-recording-scoring.md`
(RES-013 is being claimed in parallel by TASK-014's notation research). Deliverables:
cited findings on all six questions, a go / staged-go / no-go verdict, recommended v1
scope, rejected alternatives, shelf life; then follow-up EPIC-010 tasks filed per the
verdict and the epic file updated. No code changes expected. Measurable aim: EPIC-010
can proceed (or be re-staged) on evidence rather than guesswork; verification signal =
RES file answers all six questions with sources and EPIC-010 reflects the outcome.

### 2026-07-07 — done

`research/RES-014-audio-recording-scoring.md` shipped: all six questions answered with
35 cited sources (papers, MDN/WebKit docs, npm-registry checks dated 2026-07-07,
vendor/anecdotal items flagged as such). Verdict: **staged-go**. V1 scope: monophonic
single-note lines only, offline analysis after the take (MPM via `pitchy` or YIN via
`pitchfinder` + spectral-flux onsets), metronome count-in instead of a backing track
(sidesteps ~20–40 ms round-trip latency calibration), semitone/octave-agnostic pitch
matching with ±100 ms full-credit / ±250 ms partial timing windows, 60/30/10
pitch/timing/completeness score, score-only persistence (takes replayable in-session,
never stored). Rejected for v1: real-time AudioWorklet feedback, CREPE/ML monophonic
detection, Basic Pitch polyphonic transcription, essentia.js as core dep, scoring
against audible backing tracks. Follow-ups filed: TASK-040 (throwaway spike on real
guitar — the one thing sources can't verify; needs the owner playing), TASK-041
(capture flow), TASK-042 (scoring engine), TASK-043 (score UI + persistence), TASK-044
(gated chroma chord check); product-facing ones carry deferred-grill questions.
EPIC-010 task list + status updated. Deviations: none of substance — session was
interrupted and resumed mid-research (research sub-agent results lost, searches redone
directly); `research/README.md` has no RES index, so no index line was added. No code
changes, so no `bun run check` run in this worktree. Commit only, no push (worktree
merges via orchestrator).

### 2026-07-07 — merge note (orchestrator)

Independent review verdict: clean — all load-bearing claims (library versions/maintenance, Safari 18.4 MediaRecorder, ITP eviction, MIR tolerances) independently re-verified by the reviewer. Fixed at merge in this commit: the 24 ms ≈ 2048-samples arithmetic chain in RES-014 Q1 (now "rounded up to 2048"), the [16] package-vs-repo naming, and missing Baseline/Target lines in TASK-041/043's Problem briefs. Follow-up tasks renumbered from temp IDs TASK-050–054 to TASK-040–044 (next free sequence after TASK-014's TASK-037–039); all cross-references updated.
