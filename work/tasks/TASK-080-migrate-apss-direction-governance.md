---
id: TASK-080
title: Migrate APSS direction and governance records
status: abandoned
abandoned_reason: owner decision 2026-07-10 — retire the proposed Jazz Master APSS migration before fresh MVP grooming
depends_on: [TASK-079]
source: TASK-077
created: 2026-07-09
---

# TASK-080 — Migrate APSS direction and governance records

## Goal

Colocate owner direction and governance/architecture records under their
accepted system owners without breaking current paths or transferring strategy
authority to agents.

## Context

The repository rule “agents never edit `strategy/`” still applies. The owner
must perform or explicitly authorize these exact moves after accepting the map;
an agent may not infer that authorization from task existence.

## Exact old → new paths

| Old canonical path | New canonical path |
|---|---|
| `strategy/VIS-001-jazz-master.md` | `systems/jazz-master/subsystems/direction/strategy/VIS-001-jazz-master.md` |
| `strategy/goals.md` | `systems/jazz-master/subsystems/direction/strategy/goals.md` |
| `architecture/overview.md` | `systems/jazz-master/subsystems/governance/architecture/overview.md` |
| `architecture/decisions/` | `systems/jazz-master/subsystems/governance/architecture/decisions/` |
| `architecture/LOG.md` | `systems/jazz-master/subsystems/governance/architecture/LOG.md` |

## Compatibility/link update

Create relative symlinks at both old `strategy/*` paths, at
`architecture/overview.md`, at `architecture/LOG.md`, and for the old
`architecture/decisions/` directory. Update all declarations to the new
canonical paths. Leave `AGENTS.md`'s visible layer map unchanged until TASK-083
so current agents keep working through compatibility paths.

## Acceptance criteria

- [ ] The owner performed or explicitly authorized the exact strategy moves.
- [ ] All five old path entries resolve to the accepted new canonical paths.
- [ ] Git history and current links preserve decision/strategy provenance.
- [ ] Declarations and generated MAP views validate with no stale canonical path.
- [ ] A cold-start agent can read direction and architecture through AGENTS.md.
- [ ] Independent review and `bun run --cwd codebase check` pass.

## Verification

Resolve every old and new path, search for broken `strategy/` and
`architecture/` references, run the APSS validator/generator twice, perform a
cold-start read following `AGENTS.md`, complete independent review, and run
`bun run --cwd codebase check`.

## Log

### 2026-07-10 — abandoned

Owner retired all non-terminal tasks before fresh MVP grooming. No strategy or
architecture paths moved.
