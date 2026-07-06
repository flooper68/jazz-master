---
id: INS-008
title: Knowledge-only commit swept another agent's staged in-flight work onto main
status: accepted
outcome: [TASK-031]
created: 2026-07-06
---

While shipping TASK-028 (a knowledge-only work-item filing), commit `5b63bcd` unintentionally
included TASK-008's staged implementation (storage code, tests, doc edits) because that work
sat staged in the shared working tree by a concurrent agent session. `git add <my-paths> &&
git commit` commits the *entire index*, not just the newly added paths.

Actual damage was limited — the swept code had already passed its independent review and
`bun run check` stayed green on main — but two rules were still violated: git-workflow rule 1
(one work item = one commit; this commit mixed TASK-028 and TASK-008) and CLAUDE.md rule 4
(code and its tracker updates ship together — TASK-008 code landed while its task file still
said `in-progress` with unchecked criteria, until the owning agent's follow-up commit).

Why it might matter: with multiple agents sharing one working tree, any committer can silently
ship another agent's partial work — and next time it may not be post-review, post-check code.
Cheap guardrails worth adopting in `processes/git-workflow.md`: before committing, check
`git status` for already-staged entries that aren't yours; commit with explicit pathspecs
(`git commit <paths>` commits only those paths, ignoring the rest of the index); or run
concurrent agents in separate worktrees.

## Triage note

2026-07-06 (heartbeat) — Accepted (owner confirmation pending, batched in the
heartbeat report) → TASK-031. Evidence is a real incident on main (`5b63bcd`)
that violated two written rules; the fix is a small, bounded edit to
`processes/git-workflow.md` adopting the pathspec-commit + staged-entries-check
guardrails. EPIC-007 scope.
