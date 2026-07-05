---
id: TASK-022
title: Migrate SPA routing from React Router to TanStack Router
epic: EPIC-013
status: backlog
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

- [ ] Route codegen runs under both `bun run dev` and the production build
- [ ] Every existing SPA route reachable at the same URL as before (same paths under `/app`)
- [ ] Navigation and links are type-safe (a typo'd route path fails typecheck)
- [ ] `react-router` / `react-router-dom` removed from dependencies; no remaining imports
- [ ] No route files under Astro's `src/pages` belong to TanStack Router
- [ ] Deep-link hard reload still works for nested routes
- [ ] `bun run check` passes

## Verification

`bun run check` green. `grep -r "react-router" src/ package.json` returns nothing. Manually navigate all sidebar modules and hard-reload one nested route. Temporarily typo a route path in a `<Link>` and confirm typecheck fails, then revert.
