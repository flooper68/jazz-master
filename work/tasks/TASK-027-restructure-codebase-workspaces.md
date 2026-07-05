---
id: TASK-027
title: Restructure the repo per ADR-005 — codebase/ split, apps/web, packages/theory
epic: EPIC-013
status: done
depends_on: [TASK-026, TASK-004]
created: 2026-07-05
---

# TASK-027 — Restructure the repo per ADR-005: codebase/ split, apps/web, packages/theory

## Goal

The repository matches ADR-005: all code lives under `codebase/` as a Bun-workspaces monorepo with `apps/web` and `packages/theory`, `bun run check` is green from the repo root, and behavior is completely unchanged.

## Context

Implements ADR-005. Was gated on TASK-004 (since done) — never restructure over an open task; any in-flight working-tree changes must be committed first. Purely mechanical: `git mv` for all moves (history must stay followable), import rewrites only, no logic changes, one commit.

Moves: app code + configs (`src/` minus `theory/`, `index.html`, `vite.config.ts`, tsconfigs, `package.json`) → `codebase/apps/web/`; `src/theory/` → `codebase/packages/theory/src/` published as `@jazz-master/theory` (a `package.json` with **zero runtime dependencies** — this makes the no-React/no-DOM rule structural). App imports of theory change to `@jazz-master/theory`. New files: `codebase/package.json` (workspace root: `"workspaces": ["apps/*", "packages/*"]`, the real `check` script), `codebase/tsconfig.base.json` + per-workspace tsconfigs with project references (`composite: true` in packages), root shim `package.json` (delegating scripts only, no dependencies), Vitest `projects` config so all workspace tests run from one `bun run test`. Lockfile and `node_modules` live in `codebase/` only. Tailwind stays inside `apps/web`.

Same commit, per hard rules 4 and 6: update `CLAUDE.md` (knowledge map row for `codebase/`, Commands, Stack paths, Conventions paths — remove the in-migration marker) and `architecture/overview.md` (layout section becomes current state).

## Acceptance criteria

- [x] Repo root contains no code, configs, lockfile, or `node_modules` — only knowledge dirs and dotfiles. *(Amended mid-task by owner instruction: no shim — the root has no `package.json` at all; ADR-005 decision 4 amended.)*
- [x] `codebase/packages/theory/package.json` has zero runtime dependencies; app imports use `@jazz-master/theory` (no relative imports crossing the package boundary)
- [x] `bun run check` green from `codebase/` (`bun run --cwd codebase check` from the root) — typecheck + lint + test + build, all workspaces covered
- [x] Test count identical to before the move; no test logic changed (mechanical import/path updates only)
- [x] `bun run dev` serves the app exactly as before
- [x] `git log --follow` shows preserved history for a moved theory file and a moved component
- [x] No stale references: grep for `src/theory` outside `codebase/` and historical docs returns nothing in CLAUDE.md, overview.md, or active (non-done) work items
- [x] `CLAUDE.md` and `architecture/overview.md` describe the new layout as current (in-migration markers removed)

## Verification

```
bun run --cwd codebase check       # from repo root, green
bun run --cwd codebase dev         # app unchanged; click through two modules
git log --follow --oneline codebase/packages/theory/src/note.ts   # history preserved
grep -rn "src/theory" CLAUDE.md architecture/overview.md          # nothing
```

## Log

### 2026-07-05 — claimed (agent)

Plan *(steps 2–6 superseded in part mid-task: owner instructed there is no root shim `package.json` at all — see the done entry)*: baseline is 210 tests / 7 files, clean tree. Mechanical sequence:
1. `git mv src/theory → codebase/packages/theory/src`; rest of `src/` + `index.html`, `public/`, `vite.config.ts`, tsconfigs, `package.json` → `codebase/apps/web/`; `bun.lock` + `.oxlintrc.json` → `codebase/`.
2. New files: root shim `package.json` (delegating scripts, zero deps), `codebase/package.json` (workspaces + real check script + tooling devDeps), `codebase/tsconfig.base.json`, `codebase/tsconfig.json` (solution), `codebase/tsconfig.node.json` (typechecks vitest.config.ts), `codebase/vitest.config.ts` (`test.projects: ['apps/*', 'packages/*']`), `codebase/packages/theory/package.json` (`@jazz-master/theory`, zero runtime deps, exports `./src/index.ts`) + composite tsconfig.
3. TS: project references — web app references `../../packages/theory` (composite, emitDeclarationOnly); base config carries the shared strictness flags verbatim from the old tsconfig.app.json.
4. Import rewrite: `../theory` → `@jazz-master/theory` in Fretboard.tsx and DashboardPage.tsx (the only two cross-boundary importers). Theory-internal imports stay relative.
5. `bun install` in codebase/ (lockfile regenerates), `bun run check` from root via shim, `bun run dev` click-through.
6. Same commit: CLAUDE.md + architecture/overview.md describe new layout as current; path refs updated in active (non-done) work items and process docs. Delete stale root `dist/`/`node_modules`.

### 2026-07-05 — done

All 37 code/config files moved with `git mv` (staged as renames — history followable); only content changes are the two import rewrites (`../theory` → `@jazz-master/theory` in Fretboard.tsx and DashboardPage.tsx). **Deviation (owner instruction mid-task): no root shim `package.json` — the repo root has no `package.json` at all.** Commands run via `bun run --cwd codebase <script>`; ADR-005 decision 4 amended in place; CLAUDE.md/AGENTS.md/README/overview/processes/active work items updated accordingly. Gate: `bun run check` green from `codebase/` — typecheck (project references), oxlint (28 files), 210 tests in 7 files (identical to pre-move baseline), production build. Dev-server click-through of Dashboard and Voicings verified via browser, zero console errors. Bun gotchas recorded in `architecture/LOG.md` (`--filter './apps/*'`, `bun run --cwd` argument order, isolated installs). Reviewed by independent code-reviewer agent: clean; its one fix (status/doc consistency) and two nits (ADR filter-glob wording, superseded-plan note) applied before ship.
