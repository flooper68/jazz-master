---
title: How the project works
updated: 2026-07-06
sources:
  - AGENTS.md
  - architecture/decisions/ADR-003-knowledge-system.md
  - architecture/decisions/ADR-004-closed-loop-product-process.md
  - architecture/decisions/ADR-007-wiki-derived-knowledge-layer.md
  - architecture/decisions/ADR-008-grill-loop-primary-owner-interface.md
  - processes/dev-loop.md
  - processes/heartbeat.md
  - processes/status-report.md
  - processes/grilling.md
  - processes/git-workflow.md
---

# How the project works

Jazz Master is built by a solo owner plus AI agents running in loops. The repo itself is the operating system (ADR-003): all strategy, process, tracking, and knowledge lives as markdown with YAML frontmatter, versioned alongside the code — no external tracker, no dashboard. An agent pointed at a checkout has full context; git history is the audit trail.

## The layers

| Layer | Role | Who writes |
|---|---|---|
| `strategy/` | Vision (VIS-001) and current goals | Owner only — agents read, never edit |
| `processes/` | Executable playbooks — the quality system itself | Agents propose, owner-shaped |
| `work/` | Lifecycle-managed flow: epics, tasks, insights, issues, reviews | Agents freely (epics only when asked) |
| `notes/` | Raw inputs — feedback, meetings, observations (ADR-004) | Anyone; processed, never implemented directly |
| `research/` | Persisted deep research (`RES-*`) — checked before re-researching | Agents via `processes/deep-research.md` |
| `architecture/` | Living overview, ADRs, engineering log | Agents, when system shape changes |
| `wiki/` | Derived "how it works" synthesis — this layer (ADR-007) | Agents, per `processes/wiki-maintenance.md` |
| `artifacts/` | Human-facing rendered outputs; markdown stays canonical | Agents via `processes/artifact-creation.md` |
| `codebase/` | All executable code — Bun-workspaces monorepo | Agents via the dev loop |

## The rhythm

The intended cadence (processes/heartbeat.md): **"do next task" a few times, then "do the heartbeat", repeat.** The dev loop (processes/dev-loop.md) ships one reviewed, tested, pushed increment per task. The heartbeat is the owner-triggered conductor: it sweeps intake, schedules due hygiene (QA review ≈ every 5 shipped tasks, knowledge-maintenance sweep ≈ every 10, security reviews, research refreshes) as ordinary tasks, and recommends the next 1–3 items — it schedules, it never executes heavy work.

The status report (processes/status-report.md) is the read-only visibility tool between beats. It runs `bun run --cwd codebase work:status` for deterministic facts (active/proposed/blocked work, inbox counts, ready backlog, shipped-since-heartbeat, cadence flags, repo hygiene), then applies fresh prioritization judgment for "next up." If it disagrees with the heartbeat, the report is fresher advice; the heartbeat remains the durable ledger.

The owner's side of the rhythm is the **grill loop** (processes/grilling.md, ADR-008): when the owner is present, the default interface is the agent questioning the owner — one question at a time, anchored to the live artifact — with decisions written back in-session and transcripts preserved as `notes/`. Creating judgment-carrying artifacts (epics, product-facing tasks, ADRs, strategy proposals, triage promotions) always routes through a grill, inline or deferred into the owner-confirmation batch. A ~monthly exam grill (owner describes the whole system, agent probes for gaps) is both the success metric and the kill criterion for the loop.

## The rules that bind every change

- `bun run --cwd codebase check` (typecheck + lint + test + build) is THE gate — a red check never reaches `main`.
- Trunk-based: one work item = one commit, pushed to `main`; code and its tracker updates (status, Log, criteria) ship in the same commit, so repo and tracker never disagree (processes/git-workflow.md).
- Every item is independently reviewed and its Verification steps executed before push; the Log is honest about failures and deviations.
- Nothing ends unpushed: the end-of-run check (clean `git status`, empty `git log origin/main..HEAD`) applies to knowledge work exactly as to code.
- Agents never invent work (discoveries become insights/issues/notes, not scope creep) and never edit `strategy/`.

## Roles

The **owner** owns `strategy/`, confirms triage decisions, reviews shipped work, and sets priorities. **Agents** execute the processes: implement, review, test, ship, file what they discover. Where an agent proposal needs authority (accepting insights, creating epics, editing strategy, high-impact pruning), it is batched as an owner question rather than acted on.
