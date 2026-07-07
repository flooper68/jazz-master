---
id: TASK-042
title: Take analysis & scoring engine — detected vs expected notes to a 0–100 score
epic: EPIC-010
status: backlog
depends_on: [TASK-040]
source: TASK-015
research: RES-014
created: 2026-07-07
---

# TASK-042 — Take analysis & scoring engine

## Goal

A pure, exhaustively-tested analysis/scoring module: recorded PCM in → detected
note events → matched against the exercise's expected notes/onsets → 0–100
score with per-note verdicts.

## Context

Per RES-014 Recommendations (Stage 1) and TASK-040's measured parameters:

- **Detection (offline, after the take):** MPM (`pitchy`) or YIN (`pitchfinder`)
  over ~2048-sample hops; onsets from spectral flux fused with pitch-segment
  boundaries; ignore the first frames of each attack transient.
- **Matching:** greedy nearest-onset matching within ±250 ms; pitch match =
  nearest semitone (±50 cents), octave-agnostic (octave errors are the
  detector's dominant failure mode).
- **Verdicts:** correct (±100 ms) / early / late (±250 ms partial credit) /
  wrong pitch / missed; inserted extras feed a completeness component.
- **Score:** 60% pitch, 30% timing, 10% completeness; lenient/standard/strict
  tolerance presets; components exposed so UI can explain the number per note.
- Expected notes/onsets come from the exercise model
  (`apps/web/src/content/`, `resolveExercise`) + tempo grid.

Home: a pure module with zero DOM deps — `packages/` (new `@jazz-master/scoring`
or inside the app as `apps/web/src/scoring/`) — implementer's call, document it;
theory-core rules apply if it lands in `packages/` (test-first, no runtime deps).
Test with synthesized fixtures (sine/karplus-strong renders of known note
sequences, plus deliberately wrong/late fixtures) — no mic needed in tests.

## Acceptance criteria

- [ ] Pure API: `analyzeTake(pcm, sampleRate) → NoteEvent[]` and `scoreTake(events, expected, tolerance) → { score, perNote[], components }`
- [ ] Semitone-accurate, octave-agnostic pitch matching; tiered timing verdicts per RES-014; lenient/standard/strict presets
- [ ] Synthesized-fixture tests cover: perfect take, late take, wrong-note take, missed notes, extra notes, octave-error robustness — across multiple keys (enharmonics matter)
- [ ] A perfect synthesized take scores ≥ 95; an empty take scores 0 without errors
- [ ] `bun run check` passes

## Verification

`bun run --cwd codebase test` — fixture suite green, including deliberately
flawed takes producing the expected verdicts and score ranges.
