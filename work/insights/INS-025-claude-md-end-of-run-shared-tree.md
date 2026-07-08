---
id: INS-025
title: CLAUDE.md hard rule 7 lacks the shared-tree nuance TASK-031 added to git-workflow
status: accepted
outcome: [AGENTS.md]
created: 2026-07-07
source: TASK-031
---

TASK-031's review noticed: AGENTS.md/CLAUDE.md hard rule 7 states "`git status --short`
... must both be empty" before reporting done, but the amended end-of-run check in
`processes/git-workflow.md` now says empty *of your entries* — a concurrent agent's
in-flight work legitimately keeps status non-empty in a shared tree and must not be
swept or treated as a failure. One-line amendment to the agent index would keep the two
consistent. (The related worry about `git add -A` stragglers in other process docs was
checked at merge — `processes/code-review.md` was fixed in the TASK-031 commit and a
repo-wide grep found no others.)

## Triage note

2026-07-08 heartbeat - Accepted and fixed directly in AGENTS.md. This is a
small consistency edit with git-workflow.md, and it matters immediately because
the current tree contains another agent's in-progress TASK-041 changes.
