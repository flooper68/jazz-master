---
id: TASK-053
title: Run knowledge maintenance sweep round 2
status: backlog
proposed_by: HEARTBEAT 2026-07-08
depends_on: []
created: 2026-07-08
---

# TASK-053 - Run knowledge maintenance sweep round 2

## Goal

Prune and feed forward the accumulated post-platform, notation, play-along,
and recording knowledge so the tracker stays usable.

## Context

Scheduled by heartbeat 2026-07-08. Cadence rule fired: the status report shows
19 task commits since the last sweep baseline, multiple new/deferred insights,
and stale research/feed-forward questions. Run
`processes/knowledge-maintenance.md` end to end.

Known inputs:

- INS-017: RES-002 staleness after Astro 7
- INS-023: Safari ITP local-storage eviction risk for ADR-002/local-first data
- INS-026: missing `research/README.md` RES index
- Duplicate insight ID `INS-031` exists in two files and should be resolved or
  recorded as a known historical exception
- AGENTS.md hard-rule 7 was aligned with the git-workflow shared-tree caveat in
  the heartbeat commit; verify indexes still lint clean

## Acceptance criteria

- [ ] `processes/knowledge-maintenance.md` checklist executed end to end
- [ ] Stale research and feed-forward decisions recorded or routed to tasks
- [ ] New/deferred insight aging pass completed with decisions recorded
- [ ] Wiki/index lint completed
- [ ] `architecture/LOG.md` entry for the sweep
- [ ] `bun run --cwd codebase check` passes

## Verification

- Sweep decisions are auditable in changed docs and task/insight logs.
- `bun run --cwd codebase check`
