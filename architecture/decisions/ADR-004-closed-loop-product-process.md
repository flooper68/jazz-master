---
id: ADR-004
title: Closed-loop product process with raw notes
status: accepted
date: 2026-07-05
---

# ADR-004 - Closed-loop product process with raw notes

## Context

The original knowledge system defined durable layers for strategy, processes, architecture, work, and research. It handled implementation well, but the loop around product learning was incomplete: raw feedback had no clear home, QA reports did not force a triage handoff, prioritization was implicit, security/privacy checks were scattered, and stale knowledge had no maintenance cadence.

Research in `research/RES-003-karpathy-llm-wiki-skill.md` recommends strengthening the existing markdown knowledge map instead of adding a parallel wiki. Research in `research/RES-006-knowledge-pruning-and-triage.md` recommends preserving raw notes separately from lifecycle-managed work items, keeping the actionable queue small, and feeding research/feedback into explicit outcomes.

## Decision

Add a closed-loop product process:

`feedback/notes -> insight/issue/task -> triage/prioritization -> dev loop -> review/check/security -> ship -> QA review -> knowledge maintenance -> feedback/notes`

Add `notes/` as raw source material with lightweight `processed: false | true` frontmatter. Keep `work/` for lifecycle-managed flow items. Add process docs for feedback intake, prioritization, security/privacy review, and knowledge maintenance, and wire them into the existing dev loop, QA review, triage, code review, and indexes.

Do not add a docs build, generated site, vector store, or separate `/wiki` directory for now. The operating model is structured markdown plus process discipline.

## Consequences

- Agents can capture rough feedback without polluting the task backlog.
- QA reviews now end in triage-ready outputs and recommended next work.
- Security/privacy concerns have a defined checklist without adding heavy ceremony to every change.
- Research and stale work get periodic feed-forward checks.
- Documentation stays simple: greppable markdown files reviewed in git.
- The process layer is larger; `AGENTS.md` and `CLAUDE.md` remain the index so agents can choose the right playbook quickly.
