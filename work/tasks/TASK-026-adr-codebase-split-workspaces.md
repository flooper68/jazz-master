---
id: TASK-026
title: Write ADR-005 — knowledge/code root split + Bun workspaces monorepo
epic: EPIC-013
status: done
depends_on: []
created: 2026-07-05
---

# TASK-026 — Write ADR-005: knowledge/code root split + Bun workspaces monorepo

## Goal

An accepted ADR that records the repository restructure — knowledge at the repo root, all code under `codebase/` as a Bun-workspaces monorepo (`apps/*`, `packages/*`) — before any files move.

## Context

Owner decision (this conversation, 2026-07-05): Jazz Master will grow into multiple apps (doc creation, presentations, CLIs) sharing the theory core, and the repo root should separate process/knowledge from code. This changes the system shape, so it needs an ADR per hard rule 6. The ADR must cover: the root split with a delegating shim `package.json` so `bun run check` from the root stays THE gate; Bun workspaces (no Turborepo/Nx) with `apps/web` and `packages/theory` as the first workspaces; the package-extraction rule (second concrete consumer or provable purity) with deferred `ui`/`storage`/`config` packages and their triggers; sequencing (restructure after TASK-004, before the Astro shell TASK-021); and rejected alternatives. The Astro platform ADR (TASK-020) is renumbered to ADR-006 as a consequence.

## Acceptance criteria

- [x] `architecture/decisions/ADR-005-*.md` exists, following the format of existing ADRs
- [x] Records both decisions: the root knowledge/code split (incl. the root shim) and the workspaces layout inside `codebase/`
- [x] States the package-extraction rule and the deferred packages with explicit triggers
- [x] States context, consequences, and considered-and-rejected alternatives (root-level packages, Turborepo/Nx, extracting ui/storage now, no shim, staying single-package)
- [x] Relationship to existing ADRs recorded (ADR-001/002 unchanged; TASK-020's ADR renumbered to ADR-006)
- [x] `architecture/overview.md` and `CLAUDE.md` reference the target structure, marked as in-migration until TASK-027 lands
- [x] TASK-020–025 adopted into EPIC-013 with paths reframed to `codebase/apps/web/`; TASK-008 notes the deferred `packages/storage` extraction
- [x] Owner has reviewed and accepted the ADR

## Verification

Read ADR-005 against the owner-approved plan (conversation of 2026-07-05) — every element of the plan is recorded or explicitly deferred with a trigger. Owner confirms acceptance.

## Log

### 2026-07-05 — done (owner-directed)

Plan and ADR content were developed and approved with the owner in
conversation before this task was filed; the task was executed in the same
session that created it. ADR-005 written as accepted (owner approved the
full plan including the `codebase/` nesting amendment). `architecture/
overview.md` gained a repository-layout section marked in-migration;
`CLAUDE.md` stack section notes the pending move; EPIC-013 created and
adopted TASK-020–025 (their "owner to decide" epic header resolved);
TASK-020 renumbered its deliverable to ADR-006; TASK-021 gained a
dependency on TASK-027; path-mapping notes added to TASK-020–025 and
TASK-008. Implementation of the move itself is TASK-027 (blocked on
TASK-004).
