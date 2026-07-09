---
id: TASK-081
title: Migrate APSS work and evidence streams
status: gated
depends_on: [TASK-080]
gated_until: Owner explicitly accepts systems/jazz-master/MAP.md and its allocation of flow-item, note, review, and research ownership.
source: TASK-077
created: 2026-07-09
---

# TASK-081 — Migrate APSS work and evidence streams

## Goal

Move the heterogeneous historical/shared work registry and notes under the root
capsule, and move the homogeneous research corpus under research, while all
legacy paths remain operational. Do not pretend every item in a mixed registry
belongs to one child system.

## Exact old → new paths

| Old canonical path | New canonical path |
|---|---|
| `work/` | `systems/jazz-master/work/registry/` |
| `notes/` | `systems/jazz-master/streams/notes/` |
| `research/` | `systems/jazz-master/subsystems/research/artifacts/reports/` |

Historical items retain their IDs and content; no item is reclassified merely
because its shared registry moves. New system-local execution uses the
PLAN/LOG contracts created by TASK-079. The root registry remains the exact
compatibility home for legacy flow-item IDs and cross-system items until the
owner accepts an item-by-item split under GAP-21.

## Compatibility/link update

Replace each old directory with a relative symlink to its exact new path.
Update live process and declaration references in the same commit. Keep old links in
historical files intact because compatibility paths remain valid; do not bulk
rewrite historical evidence.

## Acceptance criteria

- [ ] All three exact directories move with history and resolve from old and new entry points.
- [ ] Flow-item frontmatter, IDs, dependencies, task logs, note provenance, research citations, and review immutability are unchanged.
- [ ] Mixed epics/issues/notes are not silently assigned to a child system;
      root-shared ownership and GAP-21 remain explicit.
- [ ] Task selection, heartbeat, triage, research, QA, and regression operate through compatibility paths and new system-local PLAN/LOG records.
- [ ] The APSS validator and generated views pass after reference updates.
- [ ] Independent review and `bun run --cwd codebase check` pass.

## Verification

Count files before/after each directory move; compare IDs and frontmatter;
resolve every compatibility link; run heartbeat/knowledge-maintenance index
checks without writing new work; run the APSS validator/generator twice,
independent review, and `bun run --cwd codebase check`.
