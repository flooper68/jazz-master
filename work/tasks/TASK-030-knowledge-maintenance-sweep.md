---
id: TASK-030
title: Run knowledge maintenance sweep
status: backlog
depends_on: []
source: INS-006
created: 2026-07-06
---

# TASK-030 — Run knowledge maintenance sweep

## Goal

First full pass of `processes/knowledge-maintenance.md`: stale knowledge pruned or linked forward, research feed-forward audited, and the CLAUDE.md/AGENTS.md duplication (INS-006) resolved.

## Context

Scheduled by heartbeat 2026-07-06. Cadence rule fired: 11 tasks shipped, no sweep ever run. Known inputs the sweep should cover (not exhaustive — the process defines the full checklist):

- **INS-006 (accepted into this task):** AGENTS.md is a hand-maintained near-copy of CLAUDE.md and has already drifted (hard rule 7 missing). Decide symlink vs generation vs review-checklist guard, implement it, and backfill the rule-7 gap.
- **RES-008 `stale_when` appears tripped:** its condition ("a specific Jazz Master operating process is created from this research") was met by commit 5b0b149, which incorporated RES-008/RES-009 into processes. Mark staleness per the process, verify feed-forward is complete.
- Audit the other `RES-*` `stale_when` conditions and `research: RES-###` feed-forward links while there.

## Acceptance criteria

- [ ] `processes/knowledge-maintenance.md` checklist executed end to end, decisions recorded per that process
- [ ] CLAUDE.md/AGENTS.md drift mechanically prevented (or a written decision why not) and the rule-7 gap closed; INS-006 outcome updated if the resolution differs
- [ ] RES-008 staleness resolved per the process; all `stale_when` conditions checked with results recorded
- [ ] `architecture/LOG.md` entry for the sweep
- [ ] `bun run check` passes

## Verification

Sweep decisions are auditable in the commit; `git grep -n "hard rule 7\|committed and pushed" AGENTS.md` (or the symlink) shows the rule-7 gap closed.
