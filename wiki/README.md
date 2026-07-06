# Wiki — derived knowledge

Compiled, cross-linked pages on **how the product works** and **how the project works**. This layer is *derived*: every page synthesizes canonical sources and cites them; nothing here is the source of truth. On conflict, the cited source wins and the page gets fixed. Decision record: `architecture/decisions/ADR-007-wiki-derived-knowledge-layer.md`. Operations (ingest/query/lint) live in `processes/wiki-maintenance.md` — this file only defines structure and page conventions.

## Layout

```
wiki/
  README.md     # this schema
  index.md      # map of all pages — read this first
  log.md        # append-only history of wiki changes
  product/      # how the product works: modules, flows, domain behavior
  project/      # how the project works: knowledge system, workflows, rhythm
```

## Page conventions

- Filename: `<kebab-slug>.md` under `product/` or `project/`. No IDs — pages are living documents, not flow items.
- Frontmatter:

```yaml
---
title: <what the page explains>
updated: YYYY-MM-DD          # bumped on every substantive edit
sources:                     # canonical files this page compiles — repo-relative paths
  - architecture/overview.md
  - processes/dev-loop.md
---
```

- Body: synthesis in plain prose. Link other wiki pages by relative path, canonical docs by repo-relative path. Prefer "X works like this (see ADR-002)" over quoting ADR-002.
- A page states how things **are**, sourced. Plans live in `work/`, direction in `strategy/`, uncertainty in `work/insights/` or `notes/` — never here as fact.
- Every page must be listed in `index.md` with a one-line summary; every page edit appends a line to `log.md`.
