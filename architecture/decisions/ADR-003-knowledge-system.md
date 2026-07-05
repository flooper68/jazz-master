---
id: ADR-003
title: File-based knowledge system in the repo
status: accepted
date: 2026-07-05
---

# ADR-003 — File-based knowledge system in the repo

## Context

Development is executed largely by AI agents in loops. Agents need durable, greppable, versioned context: what to build (strategy), how to work (processes), how it's built (architecture), what's next (work items), and what was learned (research). External trackers (Jira, Notion, GitHub Issues) fragment that context and add auth/tooling friction for agents.

## Decision

The repo stores project knowledge as markdown in layered directories. The original lifecycle-managed layers are `strategy/`, `processes/`, `architecture/`, `work/` (epics, tasks, insights, issues, reviews), and `research/`. Flow items carry YAML frontmatter with globally unique IDs (`VIS- EPIC- TASK- INS- ISSUE- REV- ADR- RES-`) and statuses; `CLAUDE.md` and `AGENTS.md` are the indexes. Code and tracker updates ship in the same commit, so the repo is always self-consistent.

## Consequences

- Agents get full context from a checkout; git history is the audit trail; diffs double as status reports.
- No dashboards/queries — acceptable at this scale; revisit if item count makes grep painful.
- Discipline required: statuses and Logs must be updated in the same commit as code (enforced by process, `processes/git-workflow.md` rule 4).
- GitHub Issues stays unused for now to keep one source of truth; external bug reports, if they ever arrive, get transcribed into `work/issues/`.

## Related decisions

- ADR-004 extends this system with `notes/` as raw source material and adds the closed-loop feedback, prioritization, security, and knowledge-maintenance processes.
