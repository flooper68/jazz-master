---
id: TASK-007
title: Research & document product practices
epic: EPIC-007
status: backlog
depends_on: []
research: RES-008
created: 2026-07-05
---

# TASK-007 — Research & document product practices

## Goal

Researched product practice for this project's shape — a solo owner directing AI agents — covering discovery, prioritization, writing good work items, and product review, distilled into the process docs.

## Context

Triage (`processes/triage.md`) and the product half of QA review (`processes/qa-product-review.md`) currently run on intuition. `research/RES-008-organizational-problem-identification-measurement-solving-frameworks.md` already covers problem framing, measurement, and improvement loops for this task. When claimed, decide whether RES-008 is sufficient or whether a narrower product-practices research pass is still needed; any new research uses the next available `RES-###` ID.

Suggested research questions:
1. Lightweight prioritization frameworks (RICE/ICE/opportunity scoring/cost-of-delay) — which survive at solo scale, and what do they degenerate into when one person fills in all the numbers?
2. What makes acceptance criteria and user stories effective — evidence, not folklore? (Feeds our task template.)
3. Product review / self-critique cadences for solo builders: how to avoid building reference material nobody uses (our stated vision risk)?
4. Validating a practice-tool product with a handful of users before building more — cheapest signal?
5. Managing an idea inbox: triage cadences, aging policies, kill criteria for stale insights?
6. Known failure modes of human+AI-agent product development (over-production of plausible features, scope drift) and countermeasures?

## Acceptance criteria

- [ ] `RES-008` recommendations are either adopted, adapted, rejected, or explicitly deferred in the updated process docs
- [ ] If additional product-practices research is needed, a `research/RES-###-product-best-practices.md` file is complete per `research/README.md` format
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

## Log

### 2026-07-05 — RES-008 process changes pre-applied (owner-directed)

The owner asked to incorporate the latest research into the processes, so RES-008's five "suggested process changes" were applied ahead of this task: `## Problem brief` added to the task template and insight guidance in `work/README.md`; a problem-framing gate added to insight acceptance in `processes/triage.md`; a measurable-aim preference added to `processes/prioritization.md`; baseline/target capture added to filing in `processes/qa-product-review.md`; and a measurable-aim restatement added to the Plan step of `processes/dev-loop.md`. Remaining scope when this task is claimed: create `processes/product-practices.md`, decide whether the still-open research questions (prioritization frameworks at solo scale, insight aging/kill criteria, validation with early users, human+AI failure modes) need a further RES pass, and run the mock-triage read-through.
