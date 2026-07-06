---
title: How the wiki works — the pattern and its failure modes
updated: 2026-07-06
sources:
  - research/RES-003-karpathy-llm-wiki-skill.md
  - architecture/decisions/ADR-007-wiki-derived-knowledge-layer.md
  - wiki/README.md
  - processes/wiki-maintenance.md
---

# How the wiki works — the pattern and its failure modes

This wiki instantiates Karpathy's LLM-Wiki pattern (researched in RES-003): instead of re-deriving "how does X work" from a dozen files every session, knowledge is **compiled once** into maintained markdown pages and updated as sources change. The pattern's three layers map here as: *raw sources* = the canonical repo docs and code (never modified by wiki work), *compiled wiki* = these pages (agents write, humans review), *schema* = `wiki/README.md` (structure) plus `processes/wiki-maintenance.md` (operations, per the owner's ops-in-processes constraint).

## Why the pattern works

Two claims from RES-003. First, the bookkeeping that makes compiled knowledge trustworthy — cross-references, index upkeep, contradiction tracking, updating N pages when one fact changes — is exactly what humans reliably skip and LLM agents don't mind doing. Second, structure compounds: in retrieval-style workflows the same synthesis is re-discovered at every question, while a maintained wiki surfaces relationships and contradictions once, at ingest or lint time, and every later query starts from that accumulated structure. Markdown in git makes the whole thing reviewable, diffable, and cheap.

## The failure modes, and the guardrail answering each

The design isn't the pages — it's the defenses. Each maps to a documented risk (RES-003 finding 5 and recommendation 5; ADR-007):

- **The compilation gap** — distilling sources into summaries drops critical facts (the WiCER finding: blind compilation fails catastrophically often). *Defense:* pages are explicitly derived working memory, never truth; every page carries `sources:` frontmatter, and on any conflict the canonical file wins and the page is corrected.
- **Self-sealing drift** — a wiki that only integrates what fits its existing pages quietly suppresses contradictory evidence. *Defense:* lint is scheduled, not optional — the knowledge-maintenance sweep checks page claims against their cited sources, and the heartbeat's cadence table catches a wiki that `log.md` shows untouched across shipped changes.
- **Silent memory drift** — an agent-maintained store that changes without oversight stops being trustworthy. *Defense:* git review is the control surface; wiki edits ship in reviewed commits (same-commit rule with the work that changed the facts) and every change appends a `log.md` line, so staleness and history are auditable.
- **Tooling and token overhead** — at scale, agents waste context re-reading indexes and broad pages, tempting premature search infrastructure. *Defense:* stay small. `index.md` + grep is the retrieval story; pages earn their place by being re-derived repeatedly; search/embedding tooling requires an ADR and a demonstrated pain trigger.

## Why derived-only

RES-003 originally *rejected* a top-level `wiki/` — the fear was duplicating `architecture/`, `research/`, and `work/`. ADR-007 records the owner's override and its answer to that fear: the wiki never holds canonical content, only synthesis pointing outward. That's also why pages synthesize rather than quote (verbatim copies fossilize and drift — a lint finding), carry no lifecycle state (uncertainty belongs in `work/insights/` or `notes/`, plans in `work/`, direction in `strategy/`), and lose every conflict with their sources by rule.

## What a good page looks like

One durable "how it works" subject, explained in prose a reader can act on; `sources:` naming the canonical files it compiles; `updated:` bumped on substantive edits; listed in `index.md` with a one-line summary; born only when the knowledge kept being re-derived — because every page is a standing maintenance liability the lint sweep must carry.
