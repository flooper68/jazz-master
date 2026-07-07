---
id: TASK-039
title: Trim the notation bundle — evaluate vexflow-core + single font
epic: EPIC-009
status: backlog
depends_on: [TASK-037]
source: TASK-014
research: RES-013
created: 2026-07-07
---

# TASK-039 — Trim the notation bundle: evaluate `vexflow-core` + single font

## Goal

The lazy notation chunk shrinks from the full-fat VexFlow build (~677 KB gzip,
three embedded fonts) to a core-plus-one-font build — or we record with numbers
why the trim isn't worth it.

## Context

RES-013 finding 3 / ADR-010 decision 5: VexFlow publishes a zero-font
`vexflow-core` entry with lazy font loading and per-font npm packages
(https://github.com/vexflow/vexflow-fonts), but the documentation describing the
mechanism is VexFlow-4-era — flagged **needs-spike**. This task is that spike plus
adoption if it pays:

- Measure the current notation chunk size (baseline from TASK-037's build).
- Swap to `vexflow-core` + one music font (Bravura or Petaluma), keeping offline
  operation — the font must be bundled/self-hosted, never fetched from a CDN at
  runtime (ADR-002/ADR-006 local-first + Workers hosting).
- Confirm staff+TAB rendering and the enharmonic tests still pass unchanged.
- If the v5 core-entry API is broken/undocumented, stop and record the finding in
  this task's Log and a staleness note on RES-013 — do not fight it.

## Acceptance criteria

- [ ] Before/after chunk sizes measured and recorded in the Log
- [ ] Either: notation chunk reduced with all TASK-037 tests green and offline
      rendering intact — or a recorded no-go with the v5-specific reason and a
      staleness note added to RES-013
- [ ] No runtime CDN fetches introduced
- [ ] `bun run check` passes

## Verification

`bun run --cwd codebase check`; compare `astro build` chunk sizes before/after;
load a notation exercise with the network offline (devtools) and confirm it
renders.
