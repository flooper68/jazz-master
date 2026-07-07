---
id: TASK-014
title: Research notation + tab rendering approach
epic: EPIC-009
status: done
depends_on: []
research: RES-013
created: 2026-07-05
---

# TASK-014 — Research notation + tab rendering approach

## Goal

A decided, ADR-recorded approach for rendering standard notation + tablature in the practice view, so EPIC-009 implementation starts on solid ground instead of mid-flight library regret.

## Context

Run `processes/deep-research.md`, using the next available `RES-###` ID at claim time, for notation/tab rendering.

Candidates to evaluate at minimum: **VexFlow**, **alphaTab**, **OpenSheetMusicDisplay**, and **custom SVG over our theory core** (our needs are narrow: short exercises, not full scores).

Decision criteria, in order: (1) we control enharmonic spelling — the renderer must display the theory core's spelling verbatim; (2) staff + TAB rendered aligned/in sync; (3) bundle size and local-first fit (no server, works offline); (4) React 19 + Vite 8 integration friction; (5) maintenance health/licensing. Note what each option would mean for rhythm representation in our exercise model (TASK-011's display hints).

## Acceptance criteria

- [x] A `research/RES-###-notation-tab-rendering.md` file exists per the deep-research process: cited comparison of the candidates against the criteria, with a recommendation (RES-013)
- [x] ADR drafted in `architecture/decisions/` recording the choice and its consequences (ADR-010)
- [x] Follow-up implementation tasks for EPIC-009 filed (component task at minimum), sized from the findings (TASK-037/038/039)
- [x] EPIC-009 file updated with the task list

## Verification

The notation rendering research file and the ADR exist and are internally consistent; EPIC-009 lists concrete next tasks.

## Log

### 2026-07-06 — claimed (agent)

Plan: run `processes/deep-research.md` with 6 framed questions covering the five decision
criteria plus rhythm representation against TASK-011's exercise model (`ExerciseMaterial`
has no per-note rhythm today — display hints only). Candidates: VexFlow, alphaTab,
OpenSheetMusicDisplay, custom SVG over `@jazz-master/theory`. Next free research ID is
RES-013 → `research/RES-013-notation-tab-rendering.md`; decision recorded as ADR-010 with
deferred-grill questions (owner absent). Follow-up implementation tasks filed from
TASK-037 onward; EPIC-009 task list + status updated. Knowledge-only task — no code, no
`bun run check` required.

### 2026-07-07 — done

Research complete (run was split across two sessions by a session limit; no work lost).
RES-013 written: 6 questions, 19 primary-leaning sources, all four candidates compared
against the criteria in order. Decision → ADR-010: **VexFlow 5, low-level native API,
behind a project-owned `<Notation>` component** — the only library whose input model is
spelled pitches (criterion 1 verbatim-spelling wins outright); staff+TAB via one
Formatter pass; rhythm derived (straight-eighths default) rather than stored, since
TASK-011's model has no per-note rhythm; VexFlow lazy-loaded (~677 KB gzip). Rejected:
alphaTab (fret-first model, derived spelling, workers/worklets/asset copying, unwanted
synth), OSMD (MusicXML-only input → we'd own a serializer around VexFlow anyway),
custom SVG (kept as recorded fallback behind the component seam). ADR-010 carries 3
deferred-grill questions (swing-vs-straight default, bundle-size appetite, position
fidelity). Filed TASK-037 (component + spike), TASK-038 (runner integration, deferred
grill inside), TASK-039 (vexflow-core bundle trim — the one v4-era-docs claim flagged
needs-spike). Single-source flags in RES-013: alphaTab min+gzip size (Bundlephobia
timeout), vexflow-core v5 API shape. Deviation: none. Verification: RES-013 ↔ ADR-010
cross-checked for consistency; EPIC-009 lists TASK-037–039. Per orchestrator
instruction, LOG.md/wiki updates are proposed in the run report instead of edited here;
commit without push (worktree).
