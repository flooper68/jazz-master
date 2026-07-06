---
id: ADR-007
title: wiki/ — a derived synthesis layer over the knowledge system
status: accepted
date: 2026-07-06
---

# ADR-007 — `wiki/` — a derived synthesis layer over the knowledge system

(ADR-006 is reserved for the Astro/Workers platform decision, TASK-020.)

## Context

The knowledge system (ADR-003/ADR-004) stores canonical truth in layers: `strategy/` (direction), `processes/` (how we work), `architecture/` (system shape and decisions), `work/` (flow items), `notes/` (raw inputs), `research/` (RES files). What it lacks is a *compiled* layer: cross-linked pages explaining how the product and the project work end to end. That knowledge exists only scattered across ADRs, epics, process docs, and code — every agent (and the owner) re-derives it per session.

RES-003 researched Karpathy's LLM-Wiki pattern (raw sources → compiled wiki → schema; ingest/query/lint operations) and recommended *against* a top-level `wiki/`, fearing duplication of existing layers; its lint recommendation became `processes/knowledge-maintenance.md`. The owner has now decided (2026-07-06) to add `wiki/` anyway — but as a **derived** layer, which addresses the duplication concern: wiki pages synthesize and cite canonical sources, they never replace them.

## Decision

- `wiki/` holds derived knowledge only: synthesis pages under `product/` (how the product works) and `project/` (how the project works), plus `index.md` (map, read first), `log.md` (append-only history), and `README.md` (page schema and conventions).
- **Derived, never canonical.** Every page carries `sources:` frontmatter citing the canonical files it compiles. On any conflict, the canonical source wins and the wiki page is corrected — a wiki page is working memory, not truth (RES-003 / WiCER compilation-gap finding).
- **Operations live in `processes/`** (owner constraint): `processes/wiki-maintenance.md` defines ingest/update, query, and lint. Existing processes trigger them — the dev loop's Record step updates affected pages when shipped work changes how things work, deep research feeds durable findings into pages, knowledge maintenance lints the wiki in its sweep, and the heartbeat's cadence check catches an unmaintained wiki.
- Wiki edits ride the same git controls as everything else: same-commit rule with the work that changed the facts, review before push, `work:` prefix for standalone wiki commits.
- No search tooling (vector/BM25/qmd) at this corpus size; `index.md` plus grep suffices (RES-003 rec. 6). Not a user-facing product feature (RES-003 rec. 7).

## Consequences

- Agents and the owner get a stable "how it works" entry point (`wiki/index.md`) instead of re-deriving the system picture from a dozen files each session.
- Maintenance cost is real: pages go stale unless the process triggers are honored — the knowledge-maintenance sweep and heartbeat cadence are the backstop, `wiki/log.md` the audit trail.
- Duplication risk is bounded by convention, not tooling: pages that quote canonical text verbatim instead of linking/synthesizing are lint findings.
- RES-003's `stale_when` ("adopts a formal project-knowledge subsystem") has triggered; its Outcome addendum records this ADR as the resolution.

## Related decisions

- ADR-003 (file-based knowledge system) — the wiki is a layer inside it, not a replacement.
- ADR-004 (closed-loop product process) — wiki triggers ride the loops this ADR established.
- RES-003 — the pattern's design source; recommendation 2 ("no parallel wiki/") overridden by owner decision, all other recommendations adopted.
