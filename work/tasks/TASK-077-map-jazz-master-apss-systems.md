---
id: TASK-077
title: Map Jazz Master as Adaptive Problem-Solving Systems
status: backlog
depends_on: [TASK-076]
source: NOTE-015
created: 2026-07-09
---

# TASK-077 — Map Jazz Master as Adaptive Problem-Solving Systems

## Goal

Apply the accepted APSS definition to Jazz Master's current operating model and
produce a reviewed system hierarchy plus a bounded migration plan before moving
canonical files.

## Context

TASK-076 defines APSS without changing the current layer-based repository.
Inventory the current strategy, planning, delivery, quality, product-learning,
governance, research, and knowledge loops. Decide which qualify as independent
adaptive systems, which remain processes/capabilities, and where the current
feedback loops are incomplete. Preserve current behavior until the migration
plan is accepted.

## Acceptance criteria

- [ ] Every proposed Jazz Master system has a stable ID, one owner/parent, a
      problem, roles, strategy, artifact, consumer outcome, both validation
      dimensions, streams, durable plan/log, compilation, and adaptation.
- [ ] Cross-system relationships and shared evidence sources are explicit.
- [ ] Missing outcome validation, dev-loop learning, testing-system learning,
      or other incomplete loops are recorded as gaps rather than invented as
      active systems.
- [ ] Hierarchy, artifact-flow, and learning views are produced from the draft
      declarations where practical.
- [ ] The migration is split into safe, independently reviewable tasks that
      keep the current dev loop usable throughout.
- [ ] `bun run --cwd codebase check` passes.

## Verification

Read the map from the root system down and verify every current process has one
declared owner, every proposed system satisfies the APSS conformance questions,
and every migration task names the paths it moves plus the compatibility step
that keeps agents operational.
