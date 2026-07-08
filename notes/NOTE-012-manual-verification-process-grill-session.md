---
id: NOTE-012
title: Manual verification moved out of task completion gates (grill session)
created: 2026-07-08
source_type: grill-session
participants: [owner, agent]
processed: true
---

# NOTE-012 — Manual verification moved out of task completion gates (grill session)

## Context

After reviewing the unfinished task list, the owner asked what blocked
TASK-041. The answer was only human/device browser verification: desktop
Firefox/Safari and iOS Safari microphone checks.

## Discussion and decision

The owner decided to ignore those verifications for TASK-041 and change the
general process: agents should not create tasks that require human-only manual
verification. If a browser/device issue exists, it should be caught by manual
QA or usability testing by humans and then filed as an issue.

Implicit grill triggered. No follow-up question was needed because the owner
specified both the immediate action ("ignore these verifications") and the
general rule.

## Write-backs and extracted work

- `processes/dev-loop.md`, `processes/testing-strategy.md`, and
  `work/README.md` — task verification must now be automated or
  agent-runnable; human-only device/browser checks move to QA/product review.
- `work/tasks/TASK-041-recording-capture-flow.md` — marked `done`; residual
  browser/device mic risk routed to QA.
- `architecture/overview.md`, `architecture/LOG.md`, `wiki/product/overview.md`,
  `wiki/project/lifecycle-of-a-change.md`, and `wiki/log.md` — updated so
  status reports and synthesis no longer present human-only verification as a
  task blocker.
