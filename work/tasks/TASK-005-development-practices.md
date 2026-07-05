---
id: TASK-005
title: Research & document development best practices
epic: EPIC-007
status: backlog
depends_on: []
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

- [ ] A `research/RES-###-development-best-practices.md` file is complete per the format in `research/README.md` (cited findings, recommendations, rejected alternatives, staleness note)
- [ ] `processes/development-practices.md` created: the distilled, project-specific practices (structure, React/TS/Tailwind idioms, commit hygiene)
- [ ] `processes/code-review.md` checklist updated where research contradicts or extends it
- [ ] CLAUDE.md Conventions section updated; conflicts between old and new conventions resolved explicitly, not left ambiguous
- [ ] Every adopted practice traceable to the new development-practices research or `RES-005` when that research is the source
- [ ] `bun run check` passes

## Verification

```
bun run check
```

Read-through: an agent following only the updated docs would structure a new feature correctly without asking.
