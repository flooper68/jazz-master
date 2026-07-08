---
id: TASK-043
title: Score feedback UI & persistence onto the session record
epic: EPIC-010
status: done
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

- [x] Stopping a recording produces score + per-note verdicts in the runner UI
- [x] Score + per-note metadata persisted on the session record via a typed store (no raw audio persisted)
- [x] Tolerance preset selectable and persisted as a preference
- [x] Low-confidence takes produce a "couldn't analyze" state, not a punitive score
- [x] `bun run check` passes

## Verification

Automated: component tests drive the post-take flow with a stubbed scorer for
scored, unclear, and tolerance-preference paths; storage/backup tests validate
score metadata and preferences; `bun run --cwd codebase check`; `bun run --cwd
codebase check:e2e` because the change touches practice flow and storage.

QA follow-up: during the next QA/product review, record a real guitar take in a
supported browser and judge score plausibility/per-note feedback. Real-device
mic/scoring failures become issues; they are not task completion gates per
NOTE-012.

## Open questions (deferred grill)

1. Is the 60/30/10 pitch/timing/completeness weighting (RES-014) the score the
   owner wants, or should timing weigh heavier for jazz practice?
2. When a take can't be analyzed confidently, we show "couldn't analyze" and
   store nothing — or should it store an unscored session marker so history
   stays complete?
3. Should the score replace or sit beside the existing self-grading in the
   runner (does self-grading remain for unscoreable exercises)?

## Log

### 2026-07-08 - claimed (agent)

Plan: keep the scorer app-local per TASK-042, extend the typed session record so
each exercise result can carry score/per-note metadata, and add a typed scoring
tolerance preference store. Wire the runner's in-memory recorded take through
offline decode/analyze/score after stop, show an analyzing state, display
score/components/per-note verdicts beside the exercise, and pass scored metadata
into the existing grade-driven session upsert. Low-confidence/empty analysis
will show "couldn't analyze" and persist no punitive score for that take. Tests:
component coverage for scored, low-confidence, and persisted tolerance flows;
storage/backup coverage for the new durable shape; final `bun run --cwd
codebase check` plus `check:e2e` because this touches practice flow and storage.
Security/privacy checklist in scope: score metadata only, no raw audio
persistence, no new network or dependencies.

### 2026-07-08 - reviewed (agent, degraded)

Independent review subagent was not run because the available subagent tool
policy only allows spawning when the user explicitly asks for subagents, despite
the repo's standing owner authorization. Completed the `processes/code-review.md`
checklist as a degraded self-review. Finding fixed before ship: async analysis
from an earlier take could finish after a later take/reset and attach stale score
state; added an analysis generation guard. Security/privacy checklist: no new
dependencies or network, microphone permission remains tied to the Record button,
raw audio stays transient, score-only metadata is typed and backup-validated,
malformed backup score/preference data fails closed.

### 2026-07-08 - done

Implemented runner score feedback and score-only persistence: stopped takes are
decoded to mono PCM, scored against resolved exercise notes with the selected
tolerance, rendered as score/components/per-note verdicts, and persisted on the
graded exercise result; unclear/empty analysis stores no punitive score.
Added `scoring-preferences`, backup import/export validation for score metadata,
history score display, architecture/wiki updates, and tests. Verification:
`bun run --cwd codebase check` passed (632 tests; existing jsdom canvas warnings
and Wrangler log-file EPERM warning still appear but exit 0). `bun run --cwd
codebase check:e2e` first failed in the sandbox because the dev server could not
listen on `0.0.0.0:9229`; reran with escalation and all 6 Chromium smoke tests
passed.
