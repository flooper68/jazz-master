---
id: ADR-014
title: Migrate the operating model into chaos-house
status: accepted
date: 2026-09-01
---

# ADR-014 — Migrate the operating model into chaos-house

## Context

ADR-013 defined APSS as a portable framework and deliberately deferred migrating
Jazz Master's operating model; the follow-up migration tasks (TASK-079–084)
were abandoned. Since then the owner has been running chaos-house — a
self-hosted APS orchestrator (project `chaos-house-development`) — as the
operating platform for other projects, with typed sessions, an evented wiki,
observation streams, and a task board.

Keeping two operating models (this repo's file tracker and chaos-house) means
duplicated process maintenance and no shared session/timeline history. The
owner decided on 2026-09-01 to migrate Jazz Master fully now, mirroring how
chaos-house itself operates.

## Decision

- Jazz Master's operating model moves to the chaos-house project
  **`jazz-master`** (task key `JM`). The five APS declarations
  (`problem`, `strategy`, `verification`, `process`, `current-state`) declare
  the project; the project wiki is the canonical home of processes, decision
  records, research, synthesis docs, and the engineering log.
- Mapping (full table in the project wiki's `process` page and the migration
  session record):
  - `processes/*` → wiki `processes/*.md` (session-type pages + reference
    pages); work runs in typed sessions (`development`, `intake`,
    `pre-grooming`, `problem-grooming`, `task-grooming`, `dogfooding`,
    `product-brainstorming`, `documentation` — all manual until runners are
    configured).
  - `work/tasks|epics` → board tasks (`JM-n`) and problems. All pre-migration
    tasks/epics were terminal; none were ported.
  - `work/insights|issues`, `notes/` → `insights` / `issues` / `feedback`
    streams; the 22 open insight/issue files were captured as records.
  - `architecture/decisions/ADR-*` → wiki `docs/decisions/` (numbering
    continues there; this ADR is the last authored in the repo and is mirrored
    to the wiki). `architecture/overview.md` → `docs/architecture.md`;
    `architecture/LOG.md` → `records/engineering-log.md`.
  - `research/` → wiki `research/`; `wiki/` → wiki `docs/`;
    `work/REGRESSION.md` → wiki `processes/regression-pack.md`.
- The repo keeps: all code under `codebase/`, a thin `AGENTS.md` index
  (`CLAUDE.md` symlink unchanged), and `strategy/` (owner-only, unchanged —
  its disposition is a separate owner decision).
- The migrated source directories (`processes/`, `work/`, `notes/`,
  `research/`, `wiki/`, `architecture/`) are **frozen as of this commit**: the
  chaos-house project is canonical, the files remain only as history until the
  owner decides to delete them. Git history preserves everything regardless.

## Consequences

- Every future work item, observation, process change, and decision lives in
  chaos-house; agents reach it via the chaos-house MCP tools or `bun chaos`
  from the chaos-house repo on a dev machine.
- The hard gates survive unchanged: `bun run --cwd codebase check` before any
  push, trunk-based pushes to `main`, review + verification before done,
  no invented work.
- The heartbeat process is replaced by problem-grooming sessions; its ledger by
  session records and the `current-state` declaration.
- Automated runner execution of `JM` tasks is possible later by flipping
  session types to automated once an agent/runner is configured for this
  project.

## Related

- ADR-013 — APSS framework definition and the deferred migration.
- ADR-003/004/007/008 — the file-based knowledge system this supersedes as an
  operating model (their content migrated to the project wiki).
- Migration session record in the `jazz-master` chaos-house project timeline.
