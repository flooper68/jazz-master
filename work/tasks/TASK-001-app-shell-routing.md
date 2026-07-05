---
id: TASK-001
title: App shell with routing and navigation
epic: EPIC-001
status: done
depends_on: []
created: 2026-07-05
---

# TASK-001 — App shell with routing and navigation

## Goal

Replace the placeholder landing page with an app shell: client-side routing and a navigation sidebar/header listing the practice modules.

## Context

The app currently renders a static placeholder in `src/App.tsx`. Feature epics (voicings, progressions, practice tools, repertoire, ear training) each need a route to live under. Use `react-router` (v7, library mode) — add it with `bun add react-router`.

Suggested routes: `/` (dashboard placeholder), `/voicings`, `/progressions`, `/practice`, `/repertoire`, `/ear-training`. Each can render a stub page component for now.

## Acceptance criteria

- [x] `react-router` installed; routes defined for dashboard + the five module stubs
- [x] Persistent layout (header or sidebar) with nav links; active link visually distinct
- [x] Direct URL navigation and browser back/forward work (BrowserRouter)
- [x] Page components live under `src/pages/`, layout under `src/components/`
- [x] Tests: rendering the app at a given route shows that page's heading
- [x] `bun run check` passes

## Verification

```
bun run check
bun run dev   # click through all nav links, reload on a deep URL
```

## Log

### 2026-07-05 — claimed (agent)
Plan: `bun add react-router` (v7 library mode). Routes live in `App.tsx` (`Routes` + a `Layout` route with nested children); `BrowserRouter` wraps `App` in `main.tsx` so tests can mount `App` inside `MemoryRouter` at arbitrary URLs. `src/components/Layout.tsx` = persistent header + nav (`NavLink` for active styling) + `<Outlet>`. Six stub pages under `src/pages/` (default exports per convention): Dashboard, Voicings, Progressions, Practice, Repertoire, EarTraining. Tests: render `App` at each route, assert the page heading; nav active-state test.

### 2026-07-05 — done
Shipped as planned, with sidebar layout. 10 tests: heading per route (×6+404), persistent title, exactly-one active link via `aria-current`, click navigation. Deviations: (1) `bun add react-router` resolved to **v8.1.0**, not v7 as the task text said — library-mode API (`BrowserRouter`/`Routes`/`NavLink`/`Outlet`) verified unchanged, proceeded on v8; (2) found & fixed a latent test-infra bug: vitest runs without `globals`, so Testing Library auto-cleanup never registered and renders leaked across tests — explicit `afterEach(cleanup)` added to `src/test/setup.ts`. Review (code-reviewer + ui-code-reviewer): no must-fix; fixed now: `*` catch-all → `NotFoundPage`, `focus-visible` outlines on nav links, nav `aria-label` "Main", tagline contrast; deferred to INS-002: PageHeading dedup, skip link, Layout.test.tsx. Verification done literally: `bun run check` green; dev server click-through of all six links, browser back, hard reload on `/progressions`, unknown URL shows 404 — all via Playwright.
