---
id: ADR-005
title: Knowledge/code root split + Bun-workspaces monorepo under codebase/
status: accepted
date: 2026-07-05
---

# ADR-005 — Knowledge/code root split + Bun-workspaces monorepo under `codebase/`

## Context

The owner has decided Jazz Master will grow beyond the single web app: document-creation tools, presentation generators, and CLIs are planned future apps that must share the music-theory domain core. Today all code is one Vite package whose `src/`, configs, and `node_modules` sit at the repo root, interleaved with the knowledge system (`strategy/`, `processes/`, `work/`, `architecture/`, …). Two problems: there is no home for a second app or a shared package, and the repo root mixes the product operating system with the product's code.

Timing matters: the RES-002 platform migration (TASK-020–025) will convert the web app to an Astro shell on Cloudflare Workers. Restructuring first means Astro is set up directly in its final location instead of being moved later.

## Decision

1. **Root split.** The repo root holds knowledge and process only (strategy, processes, work, notes, research, architecture, artifacts). All executable code lives under `codebase/`.
2. **Bun workspaces.** `codebase/package.json` is the workspace root: `"workspaces": ["apps/*", "packages/*"]`. The single lockfile and `node_modules` live in `codebase/`. No Turborepo/Nx.
3. **First workspaces.** `codebase/apps/web` (the current app, moved as-is) and `codebase/packages/theory` (`@jazz-master/theory` — the pure domain core, consumed via `"workspace:*"`). Its `package.json` carries zero runtime dependencies, making the no-React/no-DOM rule structural instead of conventional.
4. **Root shim.** A root `package.json` contains delegating scripts only (`"check": "bun --cwd codebase run check"`, same for `dev`/`test`) and no dependencies. `bun run check` from the repo root remains THE gate, so every process doc and agent habit keeps working verbatim.
5. **Gate wiring.** `check` keeps its meaning (typecheck + lint + test + build): `tsc -b` with project references from `codebase/` (shared `tsconfig.base.json`, `composite: true` packages), oxlint over `codebase/`, Vitest `projects` covering all workspaces, build via `bun run --filter 'apps/*' build`.
6. **Package-extraction rule.** A new `packages/*` entry requires **a second concrete consumer or provable purity** (`theory` qualifies on purity alone). Deferred with explicit triggers:
   - `packages/ui` (Fretboard, ChordDiagram, notation rendering) — when the first non-web app needs to render them (e.g. a presentation app).
   - `packages/storage` (TASK-008's typed wrapper) — when a second app needs persistence; until then it is built inside `apps/web`.
   - `packages/config` (shared tsconfig/lint presets) — only if per-workspace config drift causes real pain.

## Consequences

- Future apps (`apps/cli`, `apps/docs`, `apps/presentations`) are a one-directory addition with zero refactoring; Bun makes CLIs a `bin` entry consuming `@jazz-master/theory`.
- The restructure (TASK-027) is one mechanical commit: `git mv` + import rewrites to `@jazz-master/theory`, no logic changes, sequenced after TASK-004 completes and before the Astro shell (TASK-021).
- Project references add a small config tax (`composite: true`, per-workspace tsconfigs extending the base).
- Tailwind v4 (`@theme`, Vite plugin) stays scoped to `apps/web` — not shared prematurely.
- Future CI (INS-001) runs with `working-directory: codebase`.
- ADR-001 (stack) and ADR-002 (local-first) are unchanged. The Astro/Workers platform ADR from TASK-020 becomes **ADR-006** and its implementation paths move under `codebase/apps/web/`.

## Considered and rejected

- **`apps/` + `packages/` at the repo root** — keeps code and knowledge system interleaved; the root split is the point of this change.
- **Turborepo / Nx** — unneeded at this scale; `bun run --filter` covers orchestration. Revisit in a new ADR if task-graph caching becomes a real need.
- **Extract `ui`/`storage` now** — single-consumer packages are dead weight; the extraction rule above prevents a package graveyard.
- **No root shim (always `cd codebase`)** — purer root, but `bun run check` at the root is referenced across CLAUDE.md, hard rules, and processes; recurring agent friction for no benefit.
- **Stay single-package until a second app is concrete** — was the standing default, superseded by the owner's explicit multi-app direction; restructuring is cheapest now, before Astro (TASK-021) and persistence (TASK-008) land.
