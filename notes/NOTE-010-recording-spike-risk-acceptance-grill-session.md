---
id: NOTE-010
title: Recording spike skipped by accepted risk (grill session)
created: 2026-07-08
source_type: grill-session
participants: [owner, agent]
processed: true
---

# NOTE-010 — Recording spike skipped by accepted risk (grill session)

## Context

After the status report identified TASK-040 as the blocker for EPIC-010, the
owner asked why real recordings were needed. The agent explained that synthetic
audio proved only the harness, while real-guitar takes would test guitar attack,
room/interface noise, browser encoding, onset drift, octave mistakes, and missed
notes.

## Discussion and decision

The owner made a decision-shaped call: "let's risk the feasibility check and
assume it works and skip this task." The accepted trade-off is explicit:
downstream recording/scoring work proceeds from RES-014 and synthesized-test
evidence without real-take validation. The cost is that capture or scoring
quality may need rework during TASK-041/TASK-042 dogfooding.

Implicit grill triggered. No follow-up question was needed because the owner
specified both the risk posture ("risk the feasibility check") and the action
("skip this task").

## Write-backs and extracted work

- `work/tasks/TASK-040` — marked `abandoned` with an owner-decision reason.
- `work/tasks/TASK-041` and `work/tasks/TASK-042` — TASK-040 dependency removed;
  accepted-risk context added.
- `work/epics/EPIC-010`, `research/RES-014`, `architecture/LOG.md`,
  `architecture/overview.md`, and `wiki/product/overview.md` — updated so
  future status reports and derived docs no longer present the real-guitar
  spike as a live gate.
