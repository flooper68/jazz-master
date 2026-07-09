---
id: TASK-077
title: Map Jazz Master as Adaptive Problem-Solving Systems
status: backlog
depends_on: [TASK-076, TASK-078]
source: NOTE-015
created: 2026-07-09
---

# TASK-077 — Map Jazz Master as Adaptive Problem-Solving Systems

## Goal

Apply the accepted APSS definition to Jazz Master's current operating model and
produce a reviewed system hierarchy plus a bounded migration plan before moving
canonical files.

## Context

TASK-076 defined APSS without changing the current layer-based repository;
TASK-078 moved that specification to the public
[APSS repository](https://github.com/flooper68/adaptive-problem-solving-systems).
Inventory the current strategy, planning, delivery, quality, product-learning,
governance, research, and knowledge loops. Decide which qualify as independent
adaptive systems, which remain processes/capabilities, and where the current
feedback loops are incomplete. Preserve current behavior until the migration
plan is accepted.

## Handoff contract

This task is a **mapping and migration-design task**, not the migration itself.

- Use the sibling checkout at `../adaptive-problem-solving-systems` as the
  working specification source (public-repository links are the fallback).
- Put the proposed root declaration at `systems/jazz-master/SYSTEM.md`. Nest
  each proposed child under its owner's
  `subsystems/<system-slug>/SYSTEM.md`, following the APSS capsule layout.
- Give every new declaration `status: proposed`. Current paths in `strategy/`,
  `processes/`, `architecture/`, `work/`, `notes/`, `research/`, and `wiki/`
  remain canonical throughout this task; declarations reference them in place.
  Do not move, duplicate, or replace current operating material yet.
- Put the human-readable hierarchy, artifact-flow view, learning-flow view,
  boundary rationale, and gap register in `systems/jazz-master/MAP.md`. The map
  is derived from the declarations; note whether each view was generated or
  manually rendered.
- Map every current process to exactly one owning proposed system. A process or
  capability does not become a subsystem unless it has a distinct problem,
  artifact, outcome, owner, and implementable full feedback loop.
- Do not silently settle load-bearing ownership, boundary, artifact, or outcome
  choices. When the owner is present, use `processes/grilling.md` and ask one
  contextual question at a time. If the owner is absent, record the question
  under `## Open questions (deferred grill)` in the affected declaration and
  keep the choice explicitly provisional.
- Create follow-up `work/tasks/TASK-*.md` files for the migration sequence. Each
  task must name the exact old and new paths, compatibility/link update, and
  verification that keeps agents operational between steps. Create every
  migration task with `status: gated`, a `gated_until:` condition requiring the
  owner to accept `systems/jazz-master/MAP.md`, and explicit dependency
  sequencing. Do not activate a proposed system or change `AGENTS.md`'s current
  path map in this task.

The task may be completed with explicitly provisional boundaries only when the
deferred questions are visible in both the affected declaration and the gap
register. Human acceptance of the proposed map is the gate for later migration,
not permission to restructure the repository during this task.

## Acceptance criteria

- [ ] Every proposed Jazz Master system has a stable ID, one owner/parent, a
      problem, roles, strategy, artifact, consumer outcome, both validation
      dimensions, streams, durable plan/log, compilation, and adaptation.
- [ ] Cross-system relationships and shared evidence sources are explicit.
- [ ] Missing outcome validation, dev-loop learning, testing-system learning,
      or other incomplete loops are recorded as gaps rather than invented as
      active systems.
- [ ] Hierarchy, artifact-flow, and learning views are produced from the draft
      declarations in `systems/jazz-master/MAP.md`.
- [ ] Every current `processes/*.md` file is assigned to exactly one proposed
      system owner without moving the process file.
- [ ] Load-bearing assumptions are owner-grilled one question at a time or
      recorded as deferred questions and provisional map gaps.
- [ ] The migration is split into safe, independently reviewable tasks that
      keep the current dev loop usable throughout; all are gated on owner map
      acceptance and carry explicit dependency sequencing.
- [ ] `bun run --cwd codebase check` passes.

## Verification

1. Validate each proposed `SYSTEM.md` against
   `../adaptive-problem-solving-systems/system.schema.json` and run the APSS
   semantic checks in `SCHEMA.md`: unique IDs, one acyclic parent tree, resolved
   relations and references, and exactly one root.
2. Read `systems/jazz-master/MAP.md` from the root system down. Confirm every
   current `processes/*.md` file appears exactly once as owned, the three views
   agree with the declarations, and every known incomplete loop is visible.
3. Check every proposed system against the APSS conformance questions in the
   framework README. Any missing answer must be an explicit gap or deferred
   grill question, never an invented active capability.
4. Verify every migration task names exact paths and the compatibility step
   that keeps agents operational. Confirm each has `status: gated`, an
   owner-acceptance `gated_until:` condition, and an explicit dependency chain.
   Confirm this task moved no current canonical operating material and left
   every declaration `status: proposed`.
5. Run the independent review process and `bun run --cwd codebase check`.
