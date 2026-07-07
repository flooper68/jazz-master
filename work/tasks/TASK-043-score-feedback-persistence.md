---
id: TASK-043
title: Score feedback UI & persistence onto the session record
epic: EPIC-010
status: backlog
depends_on: [TASK-041, TASK-042]
source: TASK-015
research: RES-014
created: 2026-07-07
---

# TASK-043 — Score feedback UI & persistence onto the session record

## Goal

After recording a take the user sees a credible 0–100 score with per-note
feedback, and the score lands on the session record so history/dashboard
(EPIC-012) can surface it.

## Problem brief

Current condition: practice sessions are self-graded; no objective signal is
stored.
Desired condition: a recorded monophonic exercise take yields an explainable
score (per-note correct/early/late/wrong/missed) persisted with the session —
EPIC-010's "Done when".
Affected user/workflow: practice runner post-take; history/dashboard consumers.
Evidence: RES-014 Q5 (SmartMusic's per-note display is the proven feedback
unit; false negatives kill motivation — when uncertain, credit the player).
Baseline: zero objective scores stored — history holds self-graded sessions only.
Target: every analyzed take persists a 0–100 score with per-note verdicts on the session record.
How we will know it improved: owner dogfoods a scale exercise and the score
matches their own judgment of the take.

## Context

Wire TASK-041's capture to TASK-042's engine: analyze on stop (offline; show a
brief "analyzing…" state), render score + per-note verdicts (color-coded
on-time/early/late in the exercise display), persist score + per-note metadata
via a typed store in `apps/web/src/storage/` onto EPIC-008's session record —
**score-only persistence; audio is never stored** (RES-014 Q6, EPIC-010 out of
scope). Tolerance setting (lenient/standard/strict) is user-visible. Score
display must degrade gracefully when detection confidence is low (prefer "we
couldn't hear that clearly" over an unfair low score).

## Acceptance criteria

- [ ] Stopping a recording produces score + per-note verdicts in the runner UI
- [ ] Score + per-note metadata persisted on the session record via a typed store (no raw audio persisted)
- [ ] Tolerance preset selectable and persisted as a preference
- [ ] Low-confidence takes produce a "couldn't analyze" state, not a punitive score
- [ ] `bun run check` passes

## Verification

Manual dogfood: record a real take, confirm score plausibility and per-note
colors; reload and confirm the score is on the session history. Component tests
drive the post-take flow with a stubbed engine.

## Open questions (deferred grill)

1. Is the 60/30/10 pitch/timing/completeness weighting (RES-014) the score the
   owner wants, or should timing weigh heavier for jazz practice?
2. When a take can't be analyzed confidently, we show "couldn't analyze" and
   store nothing — or should it store an unscored session marker so history
   stays complete?
3. Should the score replace or sit beside the existing self-grading in the
   runner (does self-grading remain for unscoreable exercises)?
