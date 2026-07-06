---
id: TASK-033
title: Add wiki synthesis pages — theory engine, quality loops, how the wiki works
epic: none            # standalone: owner-directed follow-up to TASK-032's wiki layer
status: done
depends_on: [TASK-032]
source: owner instruction (2026-07-06 session, gap analysis after TASK-032)
created: 2026-07-06
---

# TASK-033 — Add wiki synthesis pages: theory engine, quality loops, how the wiki works

## Goal

The three highest-value "how it works" gaps identified after the wiki landed are filled: a prose-level reference for the theory domain core, a why-the-loops-are-closed synthesis of the quality system, and the wiki's own mechanics-and-failure-modes page.

## Context

Owner-directed ("do this right away") from the same session as TASK-032. Gap analysis found knowledge whose *rules* are distilled into process docs but whose *how-and-why* exists only scattered: the theory engine's design (only in `codebase/packages/theory/` source and tests), the closed-loop rationale (spread over ADR-004, RES-006, RES-011, and five process docs), and the wiki pattern's failure modes (RES-003 + ADR-007). Deliberately deferred as premature or thin: platform/notation/scoring pages (nothing built yet — the wiki states how things are), outcome-vs-output framing page, artifact-creation synthesis. Cap of three pages respects the wiki's keep-it-small guardrail.

## Acceptance criteria

- [x] `wiki/product/theory-engine.md` explains the domain core from the actual source: note representation, transpose-moves-the-letter spelling correctness, formulas as data, error edges, and the fretboard/spelling bridge — with `sources:` citing the code files
- [x] `wiki/project/quality-loops.md` explains why the closed loop is shaped as it is, compiled from ADR-004, RES-006, RES-011, and the intake/triage/QA/heartbeat/maintenance processes
- [x] `wiki/project/how-the-wiki-works.md` explains the wiki pattern's mechanics and the failure modes its guardrails defend against, from RES-003 and ADR-007
- [x] `wiki/index.md` lists all three with summaries; `wiki/log.md` has an entry
- [x] Independent review pass verifies page claims against cited sources
- [x] `bun run check` passes

## Verification

- Every `sources:` path in the three new pages resolves to an existing file
- Spot-check per page: theory-engine claims against `codebase/packages/theory/src/*.ts`; quality-loops claims against ADR-004 and `processes/triage.md`; how-the-wiki-works claims against RES-003 findings
- `bun run --cwd codebase check` green

## Log

### 2026-07-06 — claimed (agent)

Plan: read the canonical sources first (theory package source, ADR-004, triage/intake/QA processes, RES-006/RES-011 findings), then write the three pages, update index + log, independent review, check, ship per git-workflow.

### 2026-07-06 — done

Shipped as planned. Independent review verified every hard claim against sources — including recomputing the Eb+m7=Db transpose example and the Bbb-dim7 triple-flat edge from the actual code, and checking the ~5/~10/2-pass/60-day cadence numbers — no must-fix findings. Three cosmetic nits (stray space, a "findings 5–6" → "finding 5 + rec 5" citation fix, a Shape-Up attribution) fixed before commit. `bun run check` green. Deferred gaps recorded in Context (platform/notation/scoring pages premature; outcome-vs-output framing page and artifact synthesis judged below the keep-it-small bar for now).
