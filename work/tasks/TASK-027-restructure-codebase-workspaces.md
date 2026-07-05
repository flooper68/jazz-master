---
id: TASK-027
title: Restructure the repo per ADR-005 — codebase/ split, apps/web, packages/theory
epic: EPIC-013
status: backlog
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

- [ ] Repo root contains no code, configs, lockfile, or `node_modules` — only knowledge dirs, the shim `package.json`, and dotfiles
- [ ] `codebase/packages/theory/package.json` has zero runtime dependencies; app imports use `@jazz-master/theory` (no relative imports crossing the package boundary)
- [ ] `bun run check` green from the repo root (via shim) — typecheck + lint + test + build, all workspaces covered
- [ ] Test count identical to before the move; no test logic changed (mechanical import/path updates only)
- [ ] `bun run dev` serves the app exactly as before
- [ ] `git log --follow` shows preserved history for a moved theory file and a moved component
- [ ] No stale references: grep for `src/theory` outside `codebase/` and historical docs returns nothing in CLAUDE.md, overview.md, or active (non-done) work items
- [ ] `CLAUDE.md` and `architecture/overview.md` describe the new layout as current (in-migration markers removed)

## Verification

```
bun run check                      # from repo root, green
bun run dev                        # app unchanged; click through two modules
git log --follow --oneline codebase/packages/theory/src/note.ts   # history preserved
grep -rn "src/theory" CLAUDE.md architecture/overview.md          # nothing
```
