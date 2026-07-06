---
id: TASK-022
title: Migrate SPA routing from React Router to TanStack Router
epic: EPIC-013
status: done
depends_on: [TASK-021]
research: RES-002
created: 2026-07-05
---

# TASK-022 — Migrate SPA routing from React Router to TanStack Router

## Goal

The `/app/*` SPA uses TanStack Router with file-based routes and type-safe navigation; React Router is removed. Mechanical migration only — no product behavior changes.

## Context

RES-002 recommendation 3. TanStack route files live under `src/app/routes` (never `src/pages`, which Astro owns) with the route tree rooted at `/app`. The `@tanstack/router-plugin` Vite plugin is added through Astro's `vite.plugins` passthrough, ordered before the React plugin, with `autoCodeSplitting: true`. RES-002 flags this plugin/codegen wiring as the riskiest mechanical part and notes it is a single-source inference (neither TanStack nor Astro documents the combination) — so **spike the codegen first**: prove `routeTree.gen.ts` generation works inside `astro dev`/`astro build` before migrating any routes. If the plugin cannot run under Astro, stop, file the finding as an insight, and fall back to TanStack's code-based routing rather than inventing a workaround.

**ADR-005 note (2026-07-05):** paths in this task predate the TASK-027 restructure — read every `src/...` path as `codebase/apps/web/src/...` (e.g. route files under `codebase/apps/web/src/app/routes`), and the Verification grep as `grep -r "react-router" codebase/apps/web/src/ codebase/apps/web/package.json`.

## Acceptance criteria

- [x] Route codegen runs under both `bun run dev` and the production build
- [x] Every existing SPA route reachable at the same URL as before (same paths under `/app`)
- [x] Navigation and links are type-safe (a typo'd route path fails typecheck)
- [x] `react-router` / `react-router-dom` removed from dependencies; no remaining imports
- [x] No route files under Astro's `src/pages` belong to TanStack Router
- [x] Deep-link hard reload still works for nested routes
- [x] `bun run check` passes

## Verification

`bun run check` green. `grep -rn "react-router" src/ package.json | grep -v "@tanstack"` returns nothing (the original bare grep also matches `@tanstack/react-router`; wording fixed during implementation, review finding 4). Manually navigate all sidebar modules and hard-reload one nested route. Temporarily typo a route path in a `<Link>` and confirm typecheck fails, then revert.

## Log

### 2026-07-06 — claimed (agent)

Plan (INS-017 noted — RES-002 is stale on Astro 7, so the spike doubles as re-verification):

1. **Spike codegen first** (per task): add `@tanstack/react-router` + `@tanstack/router-plugin` (dev), wire `tanstackRouter()` into `astro.config.mjs` `vite.plugins` before the React integration's plugin, `routesDirectory: src/app/routes`, `autoCodeSplitting: true`. Prove `routeTree.gen.ts` generates under both `astro dev` and `astro build` with a minimal root + index route. If it can't run under Astro: stop, file insight, fall back to code-based routing.
2. Migrate mechanically: `__root.tsx` carries the onboarding gate + `Layout` + `notFoundComponent` (NotFoundPage); one flat route file per existing path; router `basepath: '/app'` (replaces BrowserRouter basename); `AppShell` becomes createRouter + RouterProvider. Dashboard→Practice `startLessonId` handoff stays history state via `HistoryState` module augmentation.
3. `Layout`: NavLink → TanStack `Link` with `activeProps`/`activeOptions`; keep `aria-current` behavior the App test asserts.
4. Tests: App.test drives the real generated route tree with `createMemoryHistory` at `/app/*` paths; page tests get minimal code-based test routers replacing `MemoryRouter`. First render is async under RouterProvider → `findBy*` where needed.
5. Commit `routeTree.gen.ts` (build runs `tsc -b` before `astro build`, so the tree must exist pre-build).
6. Remove `react-router`, grep clean, `bun run check`, manual verification per the task.

### 2026-07-06 — done

Spike confirmed the RES-002 risk is moot: `tanstackRouter()` in `astro.config.mjs` `vite.plugins` generates `routeTree.gen.ts` under both `astro dev` (route served 200) and `astro build` — no fallback to code-based routing needed. Migration went as planned: 8 file routes + `__root.tsx` (onboarding gate moved from the deleted `App.tsx`; `NotFoundPage` is the root `notFoundComponent`), `createAppRouter(history?)` factory with `basepath: '/app'`, `AppShell` renders `RouterProvider`. `Layout` uses `Link` `activeProps`/`activeOptions` (TanStack sets `aria-current="page"` itself; base className concatenates with active/inactive classes — verified in package source). Dashboard→Practice handoff moved to typed history state (`declare module '@tanstack/history'`), cleared with an updater navigate.

Deviations: (1) `@tanstack/history@1.162.0` added as an explicit dep pinned to react-router's exact version — bun stores it unresolvably for TS module augmentation otherwise; (2) `App.test.tsx` became `src/app/router.test.tsx` and page tests now render the real route tree via `src/test/renderRoute.tsx` (memory history at `/app/*`), so `HistoryPage.test` seeds a profile and asserts the real `/app/practice` href; (3) `window.scrollTo` stubbed in test setup (jsdom noise on every TanStack navigation).

Verification: check green (typecheck, lint, 514 tests, build); grep clean; all 8 sidebar modules clicked through in a real browser at `/app/*`, `/app/history` hard-reload OK, dashboard Start handoff auto-started the planned lesson, zero console errors; typo'd `Link` path failed typecheck (TS2820 with the route union), reverted green.

Reviewed by independent code-reviewer agent: no correctness findings; fixed now — stale `architecture/overview.md`/`AGENTS.md` routing sections, oxlint `only-export-components` warning in `__root.tsx` (annotated disable), unsatisfiable verification grep wording; filed — INS-018 (no drift guard for the committed gen file in `check`), INS-019 (handoff-consume effect untested).
