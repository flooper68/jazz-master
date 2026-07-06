---
id: TASK-034
title: Add the work-status report — facts script, report process, status-vocabulary fixes
epic:
status: done
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

1. **Facts script** — lives in `codebase/` (the root has no `package.json`), e.g. `bun run --cwd codebase work:status`, reading `../work/` frontmatter and `git log`. No LLM, no deps beyond what bun ships. Output sections: in-progress + blocked + pending-confirmation items; insight/issue inbox counts by status (untriaged vs deferred split correctly); **open issues listed individually, ordered by severity** (NOTE-004); dependency-ready backlog grouped by epic with done/total rollups per epic; shipped since the last heartbeat ledger entry (from `git log` `TASK-###:`/`ISSUE-###:` commits); cadence flags evaluated per the "Due when" rules in `processes/heartbeat.md` (QA review, knowledge sweep, heartbeat itself, exam grill); **repo hygiene** (NOTE-004): dirty working tree, unpushed local commits, and untracked files outside expected knowledge/code directories — surfaces hard-rule-7 violations (finished work left uncommitted) automatically.
2. **Status-vocabulary fixes in `work/README.md`** (the report can only show what frontmatter expresses): insight flow gains `deferred` with a `revisit_when:` field; tasks gain a structured gating field (e.g. `gated_until:` or `blocked` + `blocked_reason:`) replacing YAML comments; owner-confirmation tasks get an explicit status (e.g. `proposed`). Retrofit the affected items: INS-001/002/004/005/007 (deferred at heartbeat 2026-07-06 with triggers recorded in the ledger), TASK-025/028 (gate text in YAML comments), TASK-030/031 (confirmation state per the ledger). Epic template guidance: task lists carry scope (IDs + titles) only — no hand-written status annotations; rollups are derived from task frontmatter.
3. **`processes/status-report.md` + wiring** — trigger: owner asks "what's happening" / "status report". Steps: run the script, run `processes/prioritization.md` for next 1–3, narrate leading with next-up and any cadence flags, explicitly advisory. Two narration rules from NOTE-004: (a) **titles first, IDs last** — every item is named by its human-readable title, with the ID only as a trailing note/parenthetical, never leading a sentence or list entry; (b) **goal alignment** — the epic/initiative section maps in-progress and next epics against the "Now" items in `strategy/goals.md` so the report answers "why this next", not just "what's next". Add the AGENTS.md process-table row. Note the report as an input in `processes/heartbeat.md` step 1 (Take stock) so both derive from the same script.

## Acceptance criteria

- [x] `work/README.md` status table covers deferred insights, gated/blocked tasks, and pending-confirmation tasks; all existing items retrofitted so no lifecycle state exists only in YAML comments or ledger prose
- [x] The facts script runs via a single documented bun command and prints: in-progress/blocked/proposed items, inbox counts by status, open issues ordered by severity, dependency-ready backlog by epic with done/total rollups, shipped-since-last-heartbeat, cadence-due flags matching `processes/heartbeat.md` rules, and a repo-hygiene section (dirty tree / unpushed commits / stray untracked files)
- [x] Script output matches a manual frontmatter sweep (spot-check: deferred insights no longer count as untriaged; current untriaged count matches live `status: new` frontmatter; TASK-025/028 shown gated; TASK-030/031 shown pending confirmation)
- [x] `processes/status-report.md` exists (script for facts, fresh prioritization for next-up, read-only/advisory, heartbeat stays the recorder) and AGENTS.md has the process-table row
- [x] The process's narration rules require titles-first/IDs-as-trailing-note output and an epic section mapped to `strategy/goals.md` "Now" items; a sample report in the task Log demonstrates both
- [x] `bun run check` passes

## Verification

1. `bun run --cwd codebase work:status` (or the documented command) — compare each section against `grep -m1 '^status:' work/*/**.md` and `git log` since the last `work: heartbeat` commit.
2. Confirm the deferred insights no longer count as untriaged, the current untriaged insight count matches `status: new` frontmatter, and the gated/proposed tasks are labeled as such.
3. `rg -n '^status: backlog\\s+#' work/tasks/` returns nothing.
4. With a deliberately dirty tree (e.g. touch a scratch file), the hygiene section reports it; with a clean, pushed tree it reports clean.
5. Generate one report via the process and check the narration: no ID leads a list entry or sentence; the epic section references `strategy/goals.md` "Now" items.
6. `bun run --cwd codebase check` green.

## Log

### 2026-07-06 — done

Added `bun run --cwd codebase work:status`, implemented by `codebase/scripts/work-status.js`, to compute active/proposed/blocked work, inbox counts, open issues by severity, dependency-ready backlog by epic rollup, shipped-since-heartbeat, cadence flags, and repo hygiene from frontmatter and git. Added `processes/status-report.md`, wired it into AGENTS.md and heartbeat take-stock, updated wiki project pages, and logged the process change in `architecture/LOG.md`.

Retrofitted lifecycle vocabulary: INS-001/002/004/005/007 are now `deferred` with `revisit_when`; TASK-025/028 are `gated` with `gated_until`; TASK-030/031 are `proposed` with `proposed_by`. Verification spot-check: `bun run --cwd codebase work:status` reports 5 deferred insights, 7 new insights (matching `rg -l '^status: new$' work/insights/*.md | wc -l`), TASK-025/028 excluded from ready backlog as gated, and TASK-030/031 shown as proposed. `rg -n '^status: backlog\\s+#' work/tasks/` returned no matches.

Sample report shape using the required narration rules:
- Next up: Practice history page (TASK-018) — advances the current "guided practice loop, end to end" goal by making persisted sessions findable after the runner.
- Initiative map: Guided practice loop, end to end — Curriculum & lessons is done (EPIC-008), Adaptive practice planner is done (EPIC-011), and Dashboard & history is next with Practice history page (TASK-018) before Dashboard v1 (TASK-019).
- Cadence flags: Heartbeat is due for consolidation; knowledge maintenance is already proposed as Run knowledge maintenance sweep (TASK-030).

Review: local checklist pass completed against `processes/code-review.md`; independent subagent review was not run because the available subagent tool is restricted to explicit user-requested delegation in this session. The gap is already tracked by INS-015. `bun run --cwd codebase check` passed: 23 test files, 466 tests, production build green.

### 2026-07-06 — claimed (agent)

Plan: add a Bun `work:status` script under `codebase/` that derives work facts from frontmatter and git, retrofit the status vocabulary so deferred/gated/proposed states are machine-readable, add `processes/status-report.md` plus AGENTS/heartbeat wiring, then verify the script against a manual spot-check and run the full `bun run --cwd codebase check` gate. The report process remains read-only: it uses deterministic facts from the script and fresh prioritization judgment from `processes/prioritization.md`.

Deviation: the filed spot-check expected 3 untriaged insights after deferring INS-001/002/004/005/007, but seven newer insights now legitimately have `status: new`. Verification will compare against the live frontmatter count rather than the stale historical number.

### 2026-07-06 — spec extended from owner feedback (NOTE-004)

The owner asked for an ad-hoc report (second manual sweep since NOTE-002) and directed improvements, folded into this spec while still backlog: open-issues-by-severity and repo-hygiene sections in the facts script; goal-alignment (`strategy/goals.md`) and titles-first/IDs-last narration rules in the process. Provenance: `notes/NOTE-004-status-report-feedback-session.md`.
