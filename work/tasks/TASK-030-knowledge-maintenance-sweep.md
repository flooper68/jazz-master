---
id: TASK-030
title: Run knowledge maintenance sweep
status: done
proposed_by: HEARTBEAT 2026-07-06
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

- [x] `processes/knowledge-maintenance.md` checklist executed end to end, decisions recorded per that process
- [x] CLAUDE.md/AGENTS.md drift mechanically prevented (or a written decision why not) and the rule-7 gap closed; INS-006 outcome updated if the resolution differs — resolved ahead of this task by the NOTE-003 grill session (symlink, commit 690ccae); verified intact this sweep
- [x] RES-008 staleness resolved per the process; all `stale_when` conditions checked with results recorded
- [x] `architecture/LOG.md` entry for the sweep
- [x] `bun run check` passes

## Verification

Sweep decisions are auditable in the commit; `git grep -n "hard rule 7\|committed and pushed" AGENTS.md` (or the symlink) shows the rule-7 gap closed.

## Log

### 2026-07-06 — sweep executed (agent)

Standalone hygiene task (no epic — scheduled by heartbeat, by design). Full pass of the process:

- **Inventory/structure:** all filenames, IDs, and frontmatter statuses conform; no new ID gaps (`ADR-006` left the known-gaps list — TASK-020 filled it; lint line in `processes/knowledge-maintenance.md` updated). `CLAUDE.md → AGENTS.md` symlink intact; process table complete both directions; cited paths in the four index docs all resolve (the `packages/ui|storage|config` mentions are ADR-005's deliberately deferred packages, not broken links). All 4 notes `processed: true` with actions linked.
- **Triage (8 new insights, 1 open issue):** INS-009 accepted → TASK-035 (Playwright e2e smoke, proposed); INS-012 accepted → dev-loop step 2 now flips a `backlog` epic to `in-progress` on first claim (edit in this commit); INS-010/011/013/014 deferred with concrete `revisit_when` triggers; INS-015 and INS-016 deferred pending owner decisions with the exact grill questions recorded in the files. ISSUE-002 reproduced in a real browser (focus drops to `body` on runner *and* onboarding view swaps) → `confirmed`, minor, direct-pick sized. ISSUE-001 unchanged (confirmed, direct-pick). Insight acceptances are proposals pending owner confirmation, per triage authority.
- **Research feed-forward:** RES-008's tripped `stale_when` resolved — staleness section added to the file; feed-forward audited complete (product-practices "applied as follows" section, triage step 3, work/README templates). All other `stale_when` conditions checked, none tripped: RES-002 (still Cloudflare/Railway per ADR-006), RES-003 (already resolved), RES-004/005/006/007/009 (external triggers quiet), RES-010/012 (ADR-006 is proposed only; no code-shape change yet — they trip when TASK-021+ land), RES-011 (no external users yet).
- **Wiki lint:** clean — log current through TASK-019, all 6 pages indexed, no orphans; `product/overview` built-today matches shipped reality.
- **Epics:** EPIC-013 goal de-staled ("ADR-006 when written" → written/proposed); all task lists and statuses verified current; TASK-029/030 standalone by design (hygiene). Process-vocabulary drift fixed en route: `processes/triage.md` said deferred insights "stay `new`", contradicting `work/README.md`'s `deferred` status and all existing practice — aligned to the README.
- Owner decisions queued for the next grill: confirm INS-009→TASK-035 and INS-012 acceptances; answer INS-015 (review-fallback policy) and INS-016 (trends before machine scores?); ADR-006 acceptance remains the big pending one (TASK-020, blocks TASK-021+).
- `bun run --cwd codebase check` green (knowledge-only diff + one process edit).
