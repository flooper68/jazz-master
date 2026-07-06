---
id: EPIC-007
title: Ways of working — researched practices for development, product, and QA
vision: VIS-001
status: in-progress
created: 2026-07-05
---

# EPIC-007 — Ways of working

## Goal

The project's development, product, and QA practices are not folklore: each is grounded in deep online research (persisted in `research/`) and distilled into the process docs that agents execute every loop.

## Why

This project is built primarily by AI agents in loops. The process docs in `processes/` ARE the quality system — every improvement to them compounds across all future work. The v1 process docs were written from first principles; this epic upgrades them with researched best practices before the volume of feature work grows.

## Scope

- Deep research + documentation for: development practices, testing/QA practices, product management practices (for a solo-owner + AI-agent context)
- Resulting updates to `processes/*`, `CLAUDE.md` conventions, and templates in `work/README.md`
- Each area: research first (`processes/deep-research.md` → `research/RES-###`), then distill into the docs

## Out of scope

- Tooling/infrastructure changes (CI, deployment) — filed separately as insights
- Feature work

## Tasks

- TASK-005 — Research & document development best practices (done)
- TASK-006 — Research & document testing & QA best practices (done)
- TASK-007 — Research & document product practices (fed by RES-008; done)
- TASK-031 — Adopt commit-isolation guardrails in the git workflow (backlog; pending owner confirmation from HEARTBEAT)

## Done when

All three RES files exist with cited findings; `processes/` docs are updated from their recommendations; an agent running the dev loop, a QA review, or triage is guided by researched practice, not guesswork.

## Current status

In progress. The three researched-practices tasks are complete: development (`RES-010`), product (`RES-011`), and QA/testing (`RES-012`) are all distilled into process docs. Remaining work is the narrower TASK-031 commit-isolation guardrail, created from INS-008 and still pending owner confirmation from the heartbeat.

## Last reviewed

2026-07-06 — TASK-006 completed the QA/testing research track; EPIC-007 remains open only for TASK-031 commit-isolation guardrails.
