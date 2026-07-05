---
id: TASK-014
title: Research notation + tab rendering approach
epic: EPIC-009
status: backlog
depends_on: []
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

- [ ] A `research/RES-###-notation-tab-rendering.md` file exists per the deep-research process: cited comparison of the candidates against the criteria, with a recommendation
- [ ] ADR drafted in `architecture/decisions/` recording the choice and its consequences
- [ ] Follow-up implementation tasks for EPIC-009 filed (component task at minimum), sized from the findings
- [ ] EPIC-009 file updated with the task list

## Verification

The notation rendering research file and the ADR exist and are internally consistent; EPIC-009 lists concrete next tasks.
