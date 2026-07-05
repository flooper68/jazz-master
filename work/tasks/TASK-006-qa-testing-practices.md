---
id: TASK-006
title: Research & document testing & QA best practices
epic: EPIC-007
status: backlog
depends_on: []
research: RES-002
created: 2026-07-05
---

# TASK-006 — Research & document testing & QA best practices

## Goal

A researched testing strategy (what to test at which level, with what tools) and an upgraded QA review process, so "tested" is a defined standard rather than a feeling.

## Context

We have Vitest + Testing Library and a `bun run check` gate, plus a first-principles QA process (`processes/qa-product-review.md`). Run `processes/deep-research.md` first → `research/RES-002-qa-testing-best-practices.md`, then distill.

Suggested research questions:
1. Test-level split (unit / component / e2e) for a Vite React SPA with a pure domain core — where does each defect class get caught cheapest?
2. Testing Library best practices 2026: queries, user-event, what NOT to assert?
3. Is Playwright e2e worth it pre-launch for a local-first SPA, and what's the minimal valuable setup?
4. Accessibility QA: pragmatic WCAG subset + tooling (axe?) for a solo project?
5. Visual regression: worth the cost now, later, never?
6. QA specifically for AI-generated code: known failure patterns and the checks that catch them?
7. Exploratory/manual QA session structure (charters, tours) adaptable to our REV process?

## Acceptance criteria

- [ ] `research/RES-002-qa-testing-best-practices.md` complete per `research/README.md` format
- [ ] `processes/testing-strategy.md` created: what gets unit/component/e2e coverage here, naming/location conventions, what is deliberately not tested and why
- [ ] `processes/qa-product-review.md` inspection steps upgraded from findings (a11y sweep, exploratory structure, console/network checks)
- [ ] Tooling recommendations either adopted in this task (if config-only) or filed as insights/tasks (if substantial) — no dangling "we should someday"
- [ ] `bun run check` passes

## Verification

```
bun run check
```

Read-through: given a hypothetical new feature (e.g. TASK-003 fretboard), the docs answer unambiguously which tests it must ship with.
