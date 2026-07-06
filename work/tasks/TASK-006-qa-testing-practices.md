---
id: TASK-006
title: Research & document testing & QA best practices
epic: EPIC-007
status: done
depends_on: []
research: RES-012
created: 2026-07-05
---

# TASK-006 — Research & document testing & QA best practices

## Goal

A researched testing strategy (what to test at which level, with what tools) and an upgraded QA review process, so "tested" is a defined standard rather than a feeling.

## Context

We have Vitest + Testing Library and a `bun run check` gate, plus a first-principles QA process (`processes/qa-product-review.md`). Run `processes/deep-research.md` first, using the next available `RES-###` ID at claim time, then distill.

Suggested research questions:
1. Test-level split (unit / component / e2e) for a Vite React SPA with a pure domain core — where does each defect class get caught cheapest?
2. Testing Library best practices 2026: queries, user-event, what NOT to assert?
3. Is Playwright e2e worth it pre-launch for a local-first SPA, and what's the minimal valuable setup?
4. Accessibility QA: pragmatic WCAG subset + tooling (axe?) for a solo project?
5. Visual regression: worth the cost now, later, never?
6. QA specifically for AI-generated code: known failure patterns and the checks that catch them?
7. Exploratory/manual QA session structure (charters, tours) adaptable to our REV process?

## Acceptance criteria

- [x] A `research/RES-###-qa-testing-best-practices.md` file is complete per `research/README.md` format
- [x] `processes/testing-strategy.md` created: what gets unit/component/e2e coverage here, naming/location conventions, what is deliberately not tested and why
- [x] `processes/qa-product-review.md` inspection steps upgraded from findings (a11y sweep, exploratory structure, console/network checks)
- [x] Tooling recommendations either adopted in this task (if config-only) or filed as insights/tasks (if substantial) — no dangling "we should someday"
- [x] `bun run check` passes

## Verification

```
bun run check
```

Read-through: given a hypothetical new feature (e.g. TASK-003 fretboard), the docs answer unambiguously which tests it must ship with.

## Log

### 2026-07-06 - claimed (agent)
Plan: create `RES-012` for current QA/testing research, then distill it into `processes/testing-strategy.md` and targeted updates to `processes/qa-product-review.md`. Tooling recommendations will either be documented as deliberate skips/adoptions or filed as follow-up work if they exceed config-only scope; verification is `bun run check` plus a read-through against a representative feature.

### 2026-07-06 - done
Completed `RES-012`, created `processes/testing-strategy.md`, upgraded QA/product review charters and inspection checks, and filed substantial tooling follow-ups as INS-009 (minimal Playwright e2e trigger) and INS-010 (automated axe trigger). Independent review found the testing strategy was not discoverable from the executable process map and QA still used the root-invalid `bun run dev`; fixed by wiring `processes/testing-strategy.md` into AGENTS/dev-loop/code-review and changing QA to `bun run --cwd codebase dev`. Also standardized live process references to the root-safe `bun run --cwd codebase check` gate. Read-through against a representative fretboard-style feature now answers unit/component/page/e2e/manual QA expectations. `bun run --cwd codebase check` passed: 10 test files, 393 tests, production build green.
