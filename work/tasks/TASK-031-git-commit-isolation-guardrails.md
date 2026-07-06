---
id: TASK-031
title: Adopt commit-isolation guardrails in the git workflow
epic: EPIC-007
status: backlog
depends_on: []
source: INS-008
created: 2026-07-06
---

# TASK-031 — Adopt commit-isolation guardrails in the git workflow

## Goal

`processes/git-workflow.md` prevents a committer from silently shipping another agent's staged in-flight work (the INS-008 incident, commit `5b63bcd`).

## Context

Scheduled by heartbeat 2026-07-06 from INS-008. With multiple agents sharing one working tree, `git add <paths> && git commit` commits the entire index, including work someone else staged. The incident shipped post-review, post-check code, so damage was nil — but the mechanism would ship unreviewed partial work just as happily.

Candidate guardrails from the insight (implementer picks and documents the combination): pre-commit `git status` check for staged entries outside the item's paths; committing with explicit pathspecs (`git commit -- <paths>`); separate worktrees for concurrent agents. Keep it proportionate — this is a doc/process edit plus at most trivial tooling, not infrastructure.

## Acceptance criteria

- [ ] `processes/git-workflow.md` updated with concrete commit-isolation steps an agent follows verbatim
- [ ] The chosen guardrail demonstrably prevents the INS-008 scenario (walk the incident through the new steps in the task Log)
- [ ] Other process docs referencing commit mechanics (dev-loop, heartbeat) stay consistent
- [ ] `bun run check` passes

## Verification

Dry-run the INS-008 scenario: stage a file outside the item's paths, follow the updated process, confirm the foreign staged file cannot end up in the commit.
