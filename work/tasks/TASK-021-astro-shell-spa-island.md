---
id: TASK-021
title: Host the existing React SPA inside Astro under /app/*
epic: none            # platform migration — candidate new epic, owner to decide
status: backlog
depends_on: [TASK-020]
research: RES-002
created: 2026-07-05
---

# TASK-021 — Host the existing React SPA inside Astro under /app/*

## Goal

The project builds and runs as an Astro app: Astro serves a landing page at `/`, and the current React practice app works unchanged as a client-only SPA under `/app/*`.

## Context

First implementation step of the RES-002 migration (recommendation 2 and 8). Convert the Vite project to Astro with `@astrojs/react` and the `@astrojs/cloudflare` adapter (`output: 'server'`, Workers target — configured now, deployed in TASK-024). Mount the existing React `App` from an Astro catch-all page `src/pages/app/[...path].astro` using `client:only="react"` so Astro never SSRs the practice app. The SPA keeps React Router in this task (TanStack migration is TASK-022); its routes move under the `/app` basename. Public pages live in Astro's `src/pages`; a minimal landing page at `/` linking into `/app` is enough. `src/theory/` stays pure — no Astro imports there ever. Keep `bun run check` as THE gate; rewire its build step to `astro build` and confirm typecheck/lint/test still cover the React code.

## Acceptance criteria

- [ ] `bun run dev` serves an Astro landing page at `/` and the full existing practice app at `/app/*`
- [ ] Deep links (e.g. `/app/<some-module>`) load directly, not only via client navigation
- [ ] React app is mounted with `client:only="react"` — no SSR of practice routes
- [ ] `@astrojs/cloudflare` adapter configured with `output: 'server'` (deployment itself is TASK-024)
- [ ] All existing component/page/theory tests still pass unmodified (or with mechanical-only changes)
- [ ] `bun run check` passes and still includes typecheck + lint + test + build
- [ ] `architecture/overview.md` updated to describe the Astro shell / SPA island split

## Verification

`bun run check` green. `bun run dev`, open `/`, click through to `/app`, exercise at least two practice modules, and hard-reload on a nested `/app/...` URL.
