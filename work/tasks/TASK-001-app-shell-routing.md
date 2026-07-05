---
id: TASK-001
title: App shell with routing and navigation
epic: EPIC-001
status: backlog
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

- [ ] `react-router` installed; routes defined for dashboard + the five module stubs
- [ ] Persistent layout (header or sidebar) with nav links; active link visually distinct
- [ ] Direct URL navigation and browser back/forward work (BrowserRouter)
- [ ] Page components live under `src/pages/`, layout under `src/components/`
- [ ] Tests: rendering the app at a given route shows that page's heading
- [ ] `bun run check` passes

## Verification

```
bun run check
bun run dev   # click through all nav links, reload on a deep URL
```
