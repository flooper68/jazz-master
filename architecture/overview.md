# Architecture overview

Living document — update it whenever the shape of the system changes. Decisions with lasting consequences get an ADR in `decisions/`; notable events go to `LOG.md`.

## System shape

Jazz Master is a local-first practice app, still with no backend features and no accounts: all practice state lives in the browser (localStorage), all product logic runs client-side. See ADR-002.

Since TASK-021 the app is hosted as a hybrid (ADR-006, accepted 2026-07-06 — EPIC-013): **Astro owns the shell** — the landing page at `/` and any future public/server routes in `apps/web/src/pages/` — and the **entire React practice app is one client-only SPA island under `/app/*`**, mounted by the server-rendered catch-all `src/pages/app/[...path].astro` with `client:only="react"` (no SSR of practice routes; deep links work because the catch-all answers any `/app/...` URL). Build targets Cloudflare Workers via `@astrojs/cloudflare` with `output: 'server'`; deployment itself is TASK-024. Inside the island, routing is TanStack Router (file-based, TASK-022). Still ahead in the migration: tRPC API routes (TASK-023) and the gated Hyperdrive → Railway Postgres path.

```mermaid
flowchart TD
    astro["Astro shell — src/pages/*.astro: landing at /, catch-all app/[...path].astro"]
    subgraph SPA island — client:only under /app/*
        shell[apps/web/src/app/AppShell.tsx — TanStack Router basepath=/app]
        pages[apps/web/src/app/pages/ — route-level modules]
        components[apps/web/src/components/ — Fretboard, ChordDiagram, layout]
        content[apps/web/src/content/ — exercise/lesson model + curriculum data]
        theory["@jazz-master/theory — pure domain core: notes, intervals, chords, fretboard math"]
        storage[(apps/web/src/storage/ — typed stores over localStorage)]
    end
    astro --> shell
    shell --> pages
    pages --> components
    pages --> content
    pages --> theory
    components --> theory
    content --> theory
    pages --> storage
```

## Layers and rules

| Layer | Path | Rule |
|---|---|---|
| Domain core | `codebase/packages/theory/` | `@jazz-master/theory` — pure TypeScript, **zero runtime dependencies in its `package.json`** (no React, no DOM, no side effects — structurally enforced). Exhaustively unit-tested — enharmonic spelling correctness is non-negotiable. |
| Astro shell | `codebase/apps/web/src/pages/` + `src/layouts/` | Astro's file router: public/server pages only (`index.astro`, `app/[...path].astro`). Never practice UI — that lives in the island. |
| Components | `codebase/apps/web/src/components/` | Reusable, thin; music knowledge comes from `@jazz-master/theory`, never inlined. |
| SPA pages | `codebase/apps/web/src/app/pages/` | One per practice module; own their route, compose components. `src/app/` is the island root (`AppShell.tsx`, `router.tsx`, `routes/`, generated `routeTree.gen.ts`). |
| Content | `codebase/apps/web/src/content/` | Exercise/lesson types, resolver, validator, and hand-authored lesson data. Pure TS — references theory constructs, never hard-coded note lists; imports `@jazz-master/theory` only (no components, no React, no storage). |
| Persistence | `codebase/apps/web/src/storage/` | Typed stores over localStorage via `defineStore` — **no direct `localStorage` access outside this directory**. The seam where a backend would replace the implementation (ADR-002). |

Dependency direction: `app/pages → components → @jazz-master/theory` and `app/pages → content → @jazz-master/theory` (consumed as `workspace:*`). Nothing imports upward; `theory` imports nothing of ours and never imports Astro.

## Repository layout (ADR-005, landed with TASK-027)

The repo root holds only the knowledge system (strategy/processes/work/notes/research/architecture/artifacts) — **no `package.json` at the root** (owner decision during TASK-027; ADR-005's original root-shim idea is amended there). All code lives under `codebase/`, a Bun-workspaces monorepo:

```
codebase/
  package.json          # workspace root: apps/*, packages/*; lockfile + node_modules here
  tsconfig.base.json    # shared compiler options; per-workspace tsconfigs extend it
  vitest.config.ts      # test.projects: all workspaces run from one `bun run test`
  packages/theory/      # @jazz-master/theory — the pure domain core, zero runtime deps
  apps/web/             # the Astro shell + React SPA island (TASK-021)
```

Future apps (CLI, docs, presentations) are added as `apps/*` directories. Package extraction requires a second concrete consumer or provable purity; `packages/ui`, `packages/storage`, and `packages/config` are deferred with triggers recorded in ADR-005. All bun commands run from `codebase/` — from the repo root use `bun run --cwd codebase <script>`.

## Toolchain

Bun (runtime, packages, workspaces) · Astro 7 + `@astrojs/react` + `@astrojs/cloudflare` (`output: 'server'`, Workers target; build/dev via `astro build`/`astro dev`, Vite underneath) · React 19 · TypeScript (project references: `apps/web` → `packages/theory`, which is `composite` and emits declarations only) · Tailwind v4 (CSS-config via `@theme`, wired through `vite.plugins` in `astro.config.mjs`) · Vitest + Testing Library (jsdom in `apps/web` via its `vitest.config.ts`; node defaults in packages) · oxlint. See ADR-001/ADR-006. The single verification gate is `bun run check` (run in `codebase/`). Gotcha: dev-server SSR runs inside workerd, so `apps/web/wrangler.jsonc` must keep `nodejs_compat` or every route 500s with `process is not defined`.

## Knowledge system

The repo is also the product operating system. `strategy/` sets direction, `processes/` defines executable playbooks, `work/` tracks lifecycle-managed epics/tasks/insights/issues/reviews, `notes/` preserves raw feedback and observations, `research/` stores completed research, `architecture/` records system shape and decisions, and `artifacts/` stores human-facing rendered outputs such as presentations and visual reports. `wiki/` is a derived layer on top: compiled "how the product/project works" pages that cite the canonical files and lose to them on conflict (ADR-007; ops in `processes/wiki-maintenance.md`). Markdown files remain the canonical source for agent-facing instructions and project knowledge. See ADR-003 and ADR-004.

## Routing

Two routers with a hard boundary at `/app`. Astro's file router owns everything outside it (`src/pages/index.astro`, future public pages). Inside the island: TanStack Router, file-based (TASK-022) — route files live in `apps/web/src/app/routes/` (never `src/pages/`, which Astro owns), one per practice module plus `__root.tsx`, which carries the onboarding gate (formerly `App.tsx`), renders `Layout`, and points `notFoundComponent` at `NotFoundPage`. The `@tanstack/router-plugin` Vite plugin in `astro.config.mjs` generates `src/app/routeTree.gen.ts` (committed, because `bun run build` runs `tsc -b` before `astro build` regenerates it); navigation is type-safe — a typo'd `Link` path fails typecheck. `router.tsx`'s `createAppRouter(history?)` sets `basepath: '/app'` (replacing the old BrowserRouter basename) and lets tests inject a memory history; `AppShell.tsx` creates the browser-history instance for the island. `apps/web/src/components/Layout.tsx` is the persistent shell (sidebar `Link`s with `activeProps`, content via `<Outlet>`). The dashboard→practice Start handoff rides typed history state (`declare module '@tanstack/history'` in `PracticePage.tsx`; `@tanstack/history` is pinned to the exact version `@tanstack/react-router` depends on). Tests render the real route tree through `src/test/renderRoute.tsx`.

## Theory core

`codebase/packages/theory/src/` — `note.ts` (Note = letter + accidental, parse/format/pitch class), `interval.ts` (named-interval table; `transpose` moves the letter then derives the accidental, so spelling is correct by construction), `chord.ts` (formulas as interval stacks; `spellChord`, `parseChord`). Public API is the `index.ts` barrel only; parse functions return `null` on bad input, `spellChord` throws on a bad root string (programmer error). Names beyond double accidentals are unrepresentable — `noteName` throws.

## Persistence (TASK-008)

`apps/web/src/storage/` exposes `defineStore<T>({ name, version, defaultValue, migrate? })`, returning a typed `Store<T>` (`get`/`set`/`update`/`reset`). Values persist under `jazz-master:<name>` in a `{ version, data }` envelope. Reads never throw: missing keys, corrupt JSON, malformed envelopes, versions from the future, and failed migrations all fall back to `defaultValue()` with a `console.warn`. When the persisted version is older, `migrate(persisted, fromVersion)` upgrades the data and the result is written back. Current durable user-data stores are `profile`, `sessions`, and `daily-plans`. **Convention: no direct `localStorage` access outside `src/storage/`** — every feature defines a store, so a backend can later replace the wrapper (ADR-002). Extraction to `packages/storage` waits for a second consumer (ADR-005); React hooks over stores are deferred to first use.

## Content model (TASK-011)

`apps/web/src/content/` is the shared contract between curriculum data (TASK-012), the practice runner (TASK-013), and the planner (EPIC-011). An `Exercise` is one playable unit — `ExerciseMaterial` (a discriminated union referencing theory constructs: scale or arpeggio + root + type/quality; more kinds arrive with the tasks that need them), a fret `window` (the position), `tempoBpm`, a `duration` (minutes or repetitions), and `display` hints. A `Lesson` is ordered exercises plus planner metadata: `area` (`scales | arpeggios | chords | standards`), `level` (1 = beginner), `prerequisites` (lesson ids), `estimatedMinutes`. `resolveExercise` turns a reference into concrete spelled notes + `PositionedNote[]` (throws on broken references); `validateLessons` returns a problem list covering unparseable roots, invalid windows, non-positive amounts, duplicate ids, and missing/cyclic prerequisites — lesson packs assert it returns `[]` in a test.

## Current state (2026-07-06)

App shell done (TASK-001): routing + sidebar nav + stub pages. Theory core done (TASK-002, TASK-009, TASK-010): notes, intervals, chord spelling/parsing, scales/modes/arpeggios, fretboard positions, 12-key test coverage. Fretboard (TASK-003) and chord diagrams (TASK-004) done. Monorepo restructure done (TASK-027, per ADR-005): code lives under `codebase/` as `apps/web` + `packages/theory`. Persistence layer done (TASK-008): typed localStorage stores — this completes EPIC-001. Exercise/lesson content model done (TASK-011): `apps/web/src/content/` opens EPIC-008. First lesson pack done (TASK-012): 10 scales/arpeggios lessons across 3 levels in `apps/web/src/content/lessons.ts`, listed on the Practice page. Guided practice runner done (TASK-013, completing EPIC-008): the Practice page runs lessons exercise by exercise (resolved fretboard positions, countdown, got-it/shaky/missed self-grades) and persists `PracticeSession` records — the contract EPIC-011/012 consume — to the `sessions` store (`apps/web/src/storage/sessions.ts`), upserted after every grade so abandoned runs keep their history. Adaptive planner done (TASK-016/017, completing EPIC-011): a local `PracticeProfile` plus `generatePlan` produce a persisted Today's plan with reasons, runner handoff, and completion ticks from session records. Practice history done (TASK-018, opening EPIC-012): `/history` lists persisted sessions grouped by local day with area/time-range filters and per-exercise drill-down; pure grouping/filtering logic lives in `apps/web/src/history/` (same plain-function tier as `planner/`). Dashboard v1 done (TASK-019, completing EPIC-012): `/` is the product's front door — today's plan with a Start handoff into the runner, streak, minutes-this-week, and per-area needs-attention callouts from a pure `apps/web/src/dashboard/` derivation module. ADR-006 (Astro/Workers/tRPC/Hyperdrive target platform) is **accepted** (owner grill 2026-07-06, NOTE-005; TASK-020 done). Astro shell landed (TASK-021): Astro 7 serves a barebones landing at `/` and hosts the React app as a client-only island under `/app/*`; React pages moved to `src/app/pages/`; build targets Workers via `@astrojs/cloudflare` (deploy is TASK-024). TanStack Router migration done (TASK-022): react-router removed, file-based routes under `src/app/routes/` with type-safe navigation and the same URLs. Next in EPIC-013: TASK-023 (tRPC scaffold) — owner-directed ahead of the notation/scoring research (TASK-014/015).
