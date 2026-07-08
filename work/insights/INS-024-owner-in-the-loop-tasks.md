---
id: INS-024
title: Owner-in-the-loop tasks need a convention (first case: the real-guitar spike)
status: deferred
revisit_when: next task whose verification requires owner physical participation or live dogfooding
created: 2026-07-07
source: TASK-015
---

TASK-040 (recording/pitch-pipeline spike) is the first task in the repo whose
Verification requires the owner physically doing something — playing guitar into a mic.
Agents can't complete it alone, but it isn't `blocked` or `gated` in the current status
vocabulary either. Prioritization and the heartbeat may want a convention for tasks that
carry an owner-participation step: how they're flagged in frontmatter, how the heartbeat
surfaces them ("waiting on owner hands, not owner decisions"), and how the dev loop's
Pick step treats them. Same pattern will recur for anything dogfood-verified (TASK-043's
"owner dogfoods a scale exercise").

## Triage note

2026-07-08 heartbeat - Deferred. The first concrete case (TASK-040) was
abandoned by owner risk decision in NOTE-010, so there is no active blocker to
solve today. Keep the pattern open for the next real owner-hands verification
task.
