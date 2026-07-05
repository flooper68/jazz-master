---
id: TASK-005
title: Research & document development best practices
epic: EPIC-007
status: done
depends_on: []
research: RES-010
created: 2026-07-05
---

# TASK-005 — Research & document development best practices

## Goal

Ground the project's development practices in researched, current best practice: how to structure, write, and review React 19 + TypeScript code in a Vite/Bun project built largely by AI agents.

## Context

The v1 process docs (`processes/dev-loop.md`, `processes/code-review.md`) and CLAUDE.md conventions were written from first principles. This task runs `processes/deep-research.md` first, using the next available `RES-###` ID at claim time, then upgrades those docs from the findings.

Related completed research: `research/RES-005-matt-pocock-agentic-coding-workflow.md` should be considered during distillation, but it does not replace the broader React/TypeScript development-practices research this task calls for.

Suggested research questions (refine when framing):
1. Project/folder structure and module boundaries for React + TS apps with a pure domain core — current consensus?
2. React 19 patterns to adopt or avoid (compiler-era idioms, server-components noise to ignore for SPAs, hooks discipline)?
3. TypeScript strictness: which compiler options and lint rules pay off most, especially for AI-generated code?
4. Tailwind v4 organization at scale (component variants, avoiding class soup, `@theme` usage)?
5. What review checklists / conventions measurably catch defects in AI-written code?
6. Trunk-based development for solo+agents: commit hygiene, keeping main green without CI?

## Acceptance criteria

- [x] A `research/RES-###-development-best-practices.md` file is complete per the format in `research/README.md` (cited findings, recommendations, rejected alternatives, staleness note)
- [x] `processes/development-practices.md` created: the distilled, project-specific practices (structure, React/TS/Tailwind idioms, commit hygiene)
- [x] `processes/code-review.md` checklist updated where research contradicts or extends it
- [x] CLAUDE.md Conventions section updated; conflicts between old and new conventions resolved explicitly, not left ambiguous
- [x] Every adopted practice traceable to the new development-practices research or `RES-005` when that research is the source
- [x] `bun run check` passes

## Verification

```
bun run check
```

Read-through: an agent following only the updated docs would structure a new feature correctly without asking.

## Log

### 2026-07-06 — claimed (agent)
Plan: run `processes/deep-research.md` via the deep-research skill on the six suggested
questions (refined to our stack: React 19 + TS + Vite 8 + Tailwind v4 + Bun workspaces,
solo owner + AI agents, local-first SPA, trunk-based no-CI). Result → `research/RES-010-
development-best-practices.md` (next free ID). Then distill: new `processes/development-
practices.md`; update `processes/code-review.md` checklist and CLAUDE.md Conventions where
findings extend/contradict them, resolving conflicts explicitly; fold in RES-005 where it
is the source. Measurable aim: today an agent gets structure/idiom guidance only from
first-principles CLAUDE.md bullets; after, every adopted practice is traceable to RES-010
or RES-005 and the read-through test in Verification passes. Knowledge-only task — no
app code should change; `bun run check` is the regression gate.

### 2026-07-06 — done
Completed RES-010, added `processes/development-practices.md`, updated
`processes/code-review.md` and CLAUDE.md conventions, and recorded the process change in
`architecture/LOG.md`. Independent review found one tracker-hygiene issue before ship:
acceptance criteria and completion/verification were not yet recorded in this task file.
Fixed in this log update. Verification: `bun run --cwd codebase check` passed. No app code
changed.
