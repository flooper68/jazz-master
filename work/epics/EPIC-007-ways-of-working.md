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

- TASK-005 — Research & document development best practices
- TASK-006 — Research & document testing & QA best practices
- TASK-007 — Research & document product practices

## Done when

All three RES files exist with cited findings; `processes/` docs are updated from their recommendations; an agent running the dev loop, a QA review, or triage is guided by researched practice, not guesswork.
