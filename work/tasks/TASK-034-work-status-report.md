---
id: TASK-034
title: Add the work-status report — facts script, report process, status-vocabulary fixes
epic:
status: backlog
depends_on: []
source: NOTE-002
created: 2026-07-06
---

# TASK-034 — Add the work-status report — facts script, report process, status-vocabulary fixes

## Goal

The owner can ask "what's happening" at any time and get a current, trustworthy report — in-progress work, a fresh next-tasks ranking, recently shipped items, new insights/issues, and whether heartbeat/pruning is due — computed from frontmatter and git, never from hand-maintained summaries.

## Problem brief

Current condition: work-item status lives only in per-file frontmatter across five directories; answering "what's active?" requires grepping ~60 files, and the only digest (`work/HEARTBEAT.md`) goes stale immediately (its first entry's "Next up" was fully shipped the same day). Three real states are inexpressible in the status vocabulary and hide in prose/YAML comments: deferred insights (5 sit as `new`), gated tasks (TASK-025/028), pending-owner-confirmation tasks (TASK-030/031).
Desired condition: one command/ask produces the full picture; every state the project uses is machine-readable frontmatter.
Affected user/workflow: owner oversight; agent dev-loop Pick and heartbeat Take-stock.
Evidence: NOTE-002 (grill session, 2026-07-06).
Baseline: no aggregation exists; inbox counts off by 5 (8 `new` insights shown vs 3 truly untriaged).
Target: report matches a manual frontmatter sweep exactly; zero states expressed only in comments or prose.
How we will know it improved: Verification steps below; owner stops asking status questions that require a directory sweep to answer.

## Context

Decisions in NOTE-002 bind the design:

- **No `archived/` folders** — directories stay flat, frontmatter stays the single source of truth. The report is the query layer.
- **Split facts from judgment.** A deterministic script computes facts; the report *process* (an agent) adds the one judgment component — "next tasks" — by running `processes/prioritization.md` fresh on every report (owner chose fresh judgment over replaying the heartbeat's recorded ranking).
- **Read-only and advisory.** The report schedules nothing, triages nothing, writes no ledger. The heartbeat remains the sole recorder/scheduler; report vs ledger disagreement means the report is fresher advice, the ledger the durable record.

Three pieces:

1. **Facts script** — lives in `codebase/` (the root has no `package.json`), e.g. `bun run --cwd codebase work:status`, reading `../work/` frontmatter and `git log`. No LLM, no deps beyond what bun ships. Output sections: in-progress + blocked + pending-confirmation items; insight/issue inbox counts by status (untriaged vs deferred split correctly); dependency-ready backlog grouped by epic with done/total rollups per epic; shipped since the last heartbeat ledger entry (from `git log` `TASK-###:`/`ISSUE-###:` commits); cadence flags evaluated per the "Due when" rules in `processes/heartbeat.md` (QA review, knowledge sweep, heartbeat itself, exam grill).
2. **Status-vocabulary fixes in `work/README.md`** (the report can only show what frontmatter expresses): insight flow gains `deferred` with a `revisit_when:` field; tasks gain a structured gating field (e.g. `gated_until:` or `blocked` + `blocked_reason:`) replacing YAML comments; tasks pending owner confirmation get an explicit status (e.g. `proposed`). Retrofit the affected items: INS-001/002/004/005/007 (deferred at heartbeat 2026-07-06 with triggers recorded in the ledger), TASK-025/028 (gate text in YAML comments), TASK-030/031 (pending confirmation per the ledger). Epic template guidance: task lists carry scope (IDs + titles) only — no hand-written status annotations; rollups are derived from task frontmatter.
3. **`processes/status-report.md` + wiring** — trigger: owner asks "what's happening" / "status report". Steps: run the script, run `processes/prioritization.md` for next 1–3, narrate leading with next-up and any cadence flags, explicitly advisory. Add the CLAUDE.md process-table row. Note the report as an input in `processes/heartbeat.md` step 1 (Take stock) so both derive from the same script.

## Acceptance criteria

- [ ] `work/README.md` status table covers deferred insights, gated/blocked tasks, and pending-confirmation tasks; all existing items retrofitted so no lifecycle state exists only in YAML comments or ledger prose
- [ ] The facts script runs via a single documented bun command and prints: in-progress/blocked/proposed items, inbox counts by status, dependency-ready backlog by epic with done/total rollups, shipped-since-last-heartbeat, and cadence-due flags matching `processes/heartbeat.md` rules
- [ ] Script output matches a manual frontmatter sweep (spot-check: 3 untriaged insights, TASK-025/028 shown gated, TASK-030/031 shown pending confirmation)
- [ ] `processes/status-report.md` exists (script for facts, fresh prioritization for next-up, read-only/advisory, heartbeat stays the recorder) and CLAUDE.md has the process-table row
- [ ] `bun run check` passes

## Verification

1. `bun run --cwd codebase work:status` (or the documented command) — compare each section against `grep -m1 '^status:' work/*/**.md` and `git log` since the last `work: heartbeat` commit.
2. Confirm the deferred insights no longer count as untriaged and the gated/proposed tasks are labeled as such.
3. `rg -n '# GATED|pending owner confirmation' work/tasks/` returns nothing outside structured frontmatter.
4. `bun run --cwd codebase check` green.
