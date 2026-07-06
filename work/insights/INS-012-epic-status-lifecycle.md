---
id: INS-012
title: Epics never move to in-progress — dev loop only updates them at completion
status: new
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
