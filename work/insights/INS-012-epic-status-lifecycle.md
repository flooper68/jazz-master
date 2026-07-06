---
id: INS-012
title: Epics never move to in-progress — dev loop only updates them at completion
status: accepted
outcome: [processes/dev-loop.md]
created: 2026-07-06
source: TASK-012
---

While shipping TASK-012, EPIC-008 still carried `status: backlog` even though its
first task (TASK-011) had shipped the day before. Fixed in place (set `in-progress`
in the TASK-012 commit), but the gap is systematic: `processes/dev-loop.md` step 7
only says to update an epic "if this completes an epic's last task" — nothing in the
loop sets an epic to `in-progress` when its first task is claimed or shipped, so
every epic's status is stale from first claim until final completion. Anyone
scanning `work/epics/` frontmatter for "what's active" gets a wrong answer.

Proposed fix (one line in dev-loop step 2 or 7): when claiming a task whose epic is
`backlog`, set the epic `in-progress` in the same change.

## Triage note

2026-07-06 (TASK-030 sweep) — Accepted and implemented in the sweep commit
(owner confirmation of the acceptance batched in the sweep report): dev-loop
step 2 (Claim) now instructs setting a `backlog` epic to `in-progress` in the
same change as the task claim. No standalone task — the fix is the one line
the insight proposed, and a process edit is squarely within the sweep's remit.
Evidence was already live twice (EPIC-008 via TASK-011/012, and the same
pattern would have hit EPIC-011/012/013). The `outcome:` frontmatter points at
the edited process file since no task exists (the README documents task-id
outcomes; a process edit is this sweep's routing-table output for a
process-shaped fix). Deferred-grill questions for confirmation: (1) is
claim-time the right moment to flip an epic to `in-progress`, or should it be
first *ship*? (2) should insight acceptances that resolve via a direct process
edit — no task — be sanctioned in `processes/triage.md`, or must every accept
create a task?
