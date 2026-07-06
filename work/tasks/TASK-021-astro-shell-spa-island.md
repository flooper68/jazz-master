---
id: TASK-021
title: Host the existing React SPA inside Astro under /app/*
epic: EPIC-013
status: done
depends_on: [TASK-020, TASK-027]
research: RES-002
created: 2026-07-05
---

# TASK-021 — Host the existing React SPA inside Astro under /app/*

## Goal

The project builds and runs as an Astro app: Astro serves a landing page at `/`, and the current React practice app works unchanged as a client-only SPA under `/app/*`.

## Context

First implementation step of the RES-002 migration (recommendation 2 and 8). Convert the Vite project to Astro with `@astrojs/react` and the `@astrojs/cloudflare` adapter (`output: 'server'`, Workers target — configured now, deployed in TASK-024). Mount the existing React `App` from an Astro catch-all page `src/pages/app/[...path].astro` using `client:only="react"` so Astro never SSRs the practice app. The SPA keeps React Router in this task (TanStack migration is TASK-022); its routes move under the `/app` basename. Public pages live in Astro's `src/pages`; a minimal landing page at `/` linking into `/app` is enough. `src/theory/` stays pure — no Astro imports there ever. Keep `bun run check` as THE gate; rewire its build step to `astro build` and confirm typecheck/lint/test still cover the React code.

**ADR-005 note (2026-07-05):** this task now runs after the TASK-027 restructure — the project being converted is the `codebase/apps/web` workspace, and every `src/...` path in this task reads as `codebase/apps/web/src/...`. "`src/theory/` stays pure" reads as "`codebase/packages/theory` stays pure" (no Astro imports there ever). `bun run check` runs from `codebase/` — there is no root shim (ADR-005 as amended in TASK-027).

## Acceptance criteria

- [x] `bun run dev` serves an Astro landing page at `/` and the full existing practice app at `/app/*`
- [x] Deep links (e.g. `/app/<some-module>`) load directly, not only via client navigation
- [x] React app is mounted with `client:only="react"` — no SSR of practice routes
- [x] `@astrojs/cloudflare` adapter configured with `output: 'server'` (deployment itself is TASK-024)
- [x] All existing component/page/theory tests still pass unmodified (or with mechanical-only changes)
- [x] `bun run check` passes and still includes typecheck + lint + test + build
- [x] `architecture/overview.md` updated to describe the Astro shell / SPA island split

## Verification

`bun run check` green. `bun run dev`, open `/`, click through to `/app`, exercise at least two practice modules, and hard-reload on a nested `/app/...` URL.

## Log

### 2026-07-06 — claimed (agent)

Plan (as executed): add `astro` + `@astrojs/react` + `@astrojs/cloudflare` to `apps/web`; `astro.config.mjs` with `output: 'server'`, Workers-target adapter, and the Tailwind Vite plugin via `vite.plugins`. Astro owns `src/pages/`, so the React practice pages move mechanically to `src/app/pages/` (forward-compatible with TASK-022's `src/app/routes`). New `src/app/AppShell.tsx` wraps `App` in `BrowserRouter basename="/app"`; `index.html` + `main.tsx` are deleted. Astro pages: `src/pages/index.astro` (barebones landing per NOTE-005: name + one sentence + link into `/app`) and `src/pages/app/[...path].astro` mounting `AppShell` with `client:only="react"` — the server-rendered catch-all is what makes deep links work. `vite.config.ts` becomes `vitest.config.ts` (react plugin + jsdom, unchanged test setup); scripts move to `astro dev/build/preview`. Root `check` composition unchanged. Docs: `architecture/overview.md` + the AGENTS.md structure lines that name `src/pages/`.

### 2026-07-06 — done

Landed as planned, one deviation and one gotcha. **Deviation:** `wrangler.jsonc` (slated for TASK-024) was created now with `name`/`compatibility_date`/`compatibility_flags: ["nodejs_compat"]` — the Astro 7 Cloudflare adapter runs dev-server SSR inside workerd, and without `nodejs_compat` every route 500s with `process is not defined` (Astro's logger then crashes masking the real error). **Gotcha filed as INS-017:** RES-002's `stale_when` tripped — Astro 7 is current (research was written against Astro 5 docs); its unconsumed recommendations should be re-verified before TASK-022/023/025 consume them. All tests pass unmodified except mechanical import-depth changes from the `src/pages/` → `src/app/pages/` move (Astro owns `src/pages/` now); `App.test.tsx` needed nothing — `AppShell` adds the basename outside `App`. Verified per the Verification section: `bun run check` green (514 tests); in-browser via Playwright — landing at `/`, link into `/app` (onboarding wizard → dashboard), Voicings and Practice modules exercised including a running lesson (fretboard, countdown, grading buttons), deep-link hard load on `/app/history` works, served `/app/*` HTML contains only the island mount (no SSR of practice content). Independent review (code-reviewer agent): low risk; the one major finding (LOG.md referenced INS-017 before it existed) fixed by filing INS-017 in this commit; minor findings (task status flip, stale root `vitest.config.ts` comment) fixed; nits (prerender the landing page, `astro/client` types) left — prerender can join TASK-024. Docs updated in the same change: `architecture/overview.md`, AGENTS.md stack/structure lines, `wiki/product/overview.md` (+ wiki log), `architecture/LOG.md`.
