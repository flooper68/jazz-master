---
id: NOTE-017
title: Retire current roadmap before fresh MVP grooming
created: 2026-07-10
source_type: grill-session
participants: [owner, agent]
processed: true
---

# NOTE-017 — Retire current roadmap before fresh MVP grooming

## Context

After EPIC-013 completed, the owner reviewed the remaining open epics and
tasks and directed the project to retire them all, gather current feedback,
then groom a fresh backlog focused on finishing the MVP.

The grill initially asked what currently prevents the shipped guided-practice
loop from qualifying as MVP. The owner did not want to define that yet: the
decision should follow more product use and feedback. The owner will provide
that feedback asynchronously and is the sufficient feedback source for now.
The owner then explicitly stood down further grilling for this cleanup.

## Decisions

- Retire every non-terminal epic and task as of 2026-07-10. Preserve completed
  and already-abandoned work as history.
- Do not reinterpret retired roadmap ideas as current MVP commitments.
- Keep notes, insights, issues, research, and reviews as evidence for later
  grooming; this cleanup does not accept or prioritize them.
- Do not define the MVP or create replacement epics/tasks yet. Resume product
  grooming after the owner supplies asynchronous feedback from using the app.
- The proposed Jazz Master APSS map remains design history, but its migration
  task chain is retired and no system capsule is activated.

## Write-backs

- EPIC-002 through EPIC-006 and EPIC-010 are `abandoned`.
- TASK-044 and TASK-079 through TASK-084 are `abandoned`.
- `work/README.md` recognizes `abandoned` as a terminal epic lifecycle state.
- Current architecture/wiki/APSS status text records that the migration chain
  is retired and the present operating paths remain canonical.

## Deferred until feedback arrives

- What concrete user outcome is required to call the product an MVP?
- Which observed frictions or missing capabilities should become the smallest
  fresh vertical slices?
- Which old ideas, if any, deserve new work items based on new evidence?
