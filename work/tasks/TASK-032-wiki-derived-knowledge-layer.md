---
id: TASK-032
title: Add wiki/ derived-knowledge layer with ops wired into processes
epic: none            # standalone: owner-directed knowledge-system extension; EPIC-007 is scoped to researched practices, not knowledge-system structure
status: done
depends_on: []
source: owner instruction (2026-07-06 session)
research: RES-003
created: 2026-07-06
---

# TASK-032 — Add wiki/ derived-knowledge layer with ops wired into processes

## Goal

A `wiki/` directory exists as a derived, cross-linked synthesis of how the product and the project work — Karpathy's LLM-Wiki pattern adapted per RES-003 — with its operations (ingest, query, lint) living in `processes/` and triggered from the existing process loop.

## Context

Owner decision (2026-07-06 session), overriding RES-003's "considered and rejected: add a new top-level `wiki/` now". RES-003 rejected a *parallel* wiki that would duplicate `architecture/`, `research/`, and `work/`; the owner wants a wiki that is explicitly **derived** — pages synthesize and cite the canonical sources, never replace them — which addresses the duplication concern directly. Owner constraints: `wiki/` holds the derived knowledge plus `index.md` and `log.md`; the *operations* live in `processes/` (new `processes/wiki-maintenance.md`); and the existing processes that gather or lint knowledge (dev loop, deep research, heartbeat, knowledge maintenance) gain explicit wiki triggers.

RES-003's non-negotiables carry over: raw-source preservation and citations on every page (WiCER "compilation gap"), git review as the control surface, no vector/BM25 tooling at this corpus size. RES-003's `stale_when` ("Jazz Master adopts a formal project-knowledge subsystem") is triggered by this task and resolved with an Outcome addendum.

## Acceptance criteria

- [x] `architecture/decisions/ADR-007-*.md` records the decision (ADR-006 stays reserved for the Astro/Workers ADR per TASK-020)
- [x] `wiki/` exists with `README.md` (schema), `index.md`, `log.md`, and seed pages covering how the product works and how the project works, each page carrying `sources:` frontmatter that cites canonical docs
- [x] `processes/wiki-maintenance.md` defines ingest/query/lint operations and guardrails (derived-only; canonical docs win conflicts)
- [x] Wiki triggers wired into `processes/dev-loop.md` (Record step), `processes/deep-research.md` (feed forward), `processes/heartbeat.md` (cadence), and `processes/knowledge-maintenance.md` (scope + lint step + routing)
- [x] `CLAUDE.md`, `AGENTS.md`, `work/README.md`, and `architecture/overview.md` index the new layer; `architecture/LOG.md` has an entry
- [x] `research/RES-003` outcome recorded (stale_when triggered → resolved by this adoption)
- [x] `bun run check` passes

## Verification

- `ls wiki/` shows `README.md index.md log.md product/ project/`; every page under `product/`/`project/` has `sources:` frontmatter pointing at existing files
- `git grep -ln "wiki" processes/dev-loop.md processes/deep-research.md processes/heartbeat.md processes/knowledge-maintenance.md CLAUDE.md AGENTS.md` lists all six files
- Spot-check one wiki claim per page against its cited source (no contradiction with `architecture/overview.md`, `strategy/VIS-001`, or process docs)
- `bun run --cwd codebase check` green

## Log

### 2026-07-06 — claimed (agent)

Plan: ADR-007 records the decision (ADR-006 is reserved). `wiki/README.md` carries the schema (page types, frontmatter, conventions); `processes/wiki-maintenance.md` carries the ops per owner instruction. Seed three pages: `product/overview.md`, `project/overview.md`, `project/lifecycle-of-a-change.md` — synthesis pages that don't exist anywhere today. Wire triggers: dev-loop step 7, deep-research step 6, heartbeat cadence table, knowledge-maintenance scope/steps/routing. Update indexes (CLAUDE.md, AGENTS.md, work/README.md, architecture/overview.md), LOG.md entry, RES-003 outcome addendum.

### 2026-07-06 — done

Shipped as planned, no deviations. Knowledge-maintenance sweep steps renumbered (wiki lint inserted as step 6); reviewer confirmed via grep that no other doc references those steps by number. Independent review pass: no must-fix findings — all 21 `sources:` paths and links resolve, wiki claims verified against VIS-001/goals/overview/process docs, ADR-006 reservation intact, CLAUDE.md/AGENTS.md additions identical. Reviewer nit noted for the record: RES-003's tripped `stale_when` is resolved only by its Outcome section, not frontmatter — future sweeps should read the addendum before re-flagging. `bun run check` green (393 tests, build OK).
