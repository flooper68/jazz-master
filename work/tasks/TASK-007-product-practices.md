---
id: TASK-007
title: Research & document product practices
epic: EPIC-007
status: backlog
depends_on: []
research: RES-003
created: 2026-07-05
---

# TASK-007 — Research & document product practices

## Goal

Researched product practice for this project's shape — a solo owner directing AI agents — covering discovery, prioritization, writing good work items, and product review, distilled into the process docs.

## Context

Triage (`processes/triage.md`) and the product half of QA review (`processes/qa-product-review.md`) currently run on intuition. Run `processes/deep-research.md` first → `research/RES-003-product-best-practices.md`, then distill.

Suggested research questions:
1. Lightweight prioritization frameworks (RICE/ICE/opportunity scoring/cost-of-delay) — which survive at solo scale, and what do they degenerate into when one person fills in all the numbers?
2. What makes acceptance criteria and user stories effective — evidence, not folklore? (Feeds our task template.)
3. Product review / self-critique cadences for solo builders: how to avoid building reference material nobody uses (our stated vision risk)?
4. Validating a practice-tool product with a handful of users before building more — cheapest signal?
5. Managing an idea inbox: triage cadences, aging policies, kill criteria for stale insights?
6. Known failure modes of human+AI-agent product development (over-production of plausible features, scope drift) and countermeasures?

## Acceptance criteria

- [ ] `research/RES-003-product-best-practices.md` complete per `research/README.md` format
- [ ] `processes/product-practices.md` created: prioritization approach, work-item quality bar, validation guidance for this project
- [ ] `processes/triage.md` updated with the adopted prioritization/aging rules
- [ ] Product-judgment section of `processes/qa-product-review.md` upgraded from findings
- [ ] Task/insight templates in `work/README.md` adjusted if research recommends it
- [ ] `bun run check` passes

## Verification

```
bun run check
```

Read-through: run a mock triage of three invented insights using only the updated docs; decisions should be derivable, not vibes.
