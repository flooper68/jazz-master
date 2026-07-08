---
id: INS-026
title: research/README.md has no index of RES files
status: accepted
outcome: [TASK-053]
created: 2026-07-07
source: TASK-014
---

`research/` now holds 13 RES files but its README describes only the format — there is
no index line per file, so discovering "has this been researched?" means listing the
directory and reading titles. Both research tasks this session (TASK-014/015) went to
add an index line and found nowhere to put it. A knowledge-maintenance candidate:
either add a one-line-per-RES index to `research/README.md` (and keep it linted like
the processes table in the agent index), or decide the directory listing is enough and
note that in the README.

## Triage note

2026-07-08 heartbeat - Accepted into TASK-053. This is knowledge-system
maintenance, not product work.

2026-07-08 TASK-053 sweep - Resolved by adding a one-line RES index to
`research/README.md` and a research-index lint bullet to
`processes/knowledge-maintenance.md`. The index records `RES-001` as the known
never-created gap and lists every existing RES file.
