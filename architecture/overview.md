# Architecture overview

Living document — update it whenever the shape of the system changes. Decisions with lasting consequences get an ADR in `decisions/`; notable events go to `LOG.md`.

## System shape

Jazz Master is a local-first practice app, still with no backend features and no accounts: all practice state lives in the browser (localStorage), all product logic runs client-side. See ADR-002.

Since TASK-021 the app is hosted as a hybrid (ADR-006, accepted 2026-07-06 — EPIC-013): **Astro owns the shell** — the landing page at `/` and any future public/server routes in `apps/web/src/pages/` — and the **entire React practice app is one client-only SPA island under `/app/*`**, mounted by the server-rendered catch-all `src/pages/app/[...path].astro` with `client:only="react"` (no SSR of practice routes; deep links work because the catch-all answers any `/app/...` URL). Build targets Cloudflare Workers via `@astrojs/cloudflare` with `output: 'server'`; deployment itself is TASK-024. Inside the island, routing is TanStack Router (file-based, TASK-022). Since TASK-023 there is also a **typed tRPC API surface**: server procedures under `apps/web/src/server/trpc/` served by the Astro catch-all endpoint `src/pages/trpc/[trpc].ts` (tRPC fetch adapter), consumed in the island through `@trpc/tanstack-react-query` on one shared React Query `QueryClient` (`src/app/providers.tsx`) — health-only scaffolding for now, no auth. Since TASK-028/TASK-055, local server-persistence development has a repo-owned Docker Compose Postgres service, `.env.example` connection convention, and Drizzle ORM migration workflow. The server DB smoke path remains TASK-056, product practice state remains local, and production database infrastructure remains owner-owned.

```mermaid
flowchart TD
    astro["Astro shell — src/pages/*.astro: landing at /, catch-all app/[...path].astro, tRPC endpoint trpc/[trpc].ts"]
    server["apps/web/src/server/trpc/ — appRouter: typed procedures (health)"]
    subgraph SPA island — client:only under /app/*
        shell[apps/web/src/app/AppShell.tsx — TanStack Router basepath=/app]
        pages[apps/web/src/app/pages/ — route-level modules]
        components[apps/web/src/components/ — Fretboard, ChordDiagram, layout]
        content[apps/web/src/content/ — exercise/lesson model + curriculum data]
        audio[apps/web/src/audio/ — play-along + recording capture helpers]
        scoring[apps/web/src/scoring/ — pure take analysis + score matching]
        theory["@jazz-master/theory — pure domain core: notes, intervals, chords, fretboard math"]
        storage[(apps/web/src/storage/ — typed stores over localStorage)]
    end
    astro --> shell
    astro --> server
    shell -. typed tRPC calls over /trpc .-> server
    shell --> pages
    pages --> components
    pages --> content
    pages -. browser audio .-> audio
    pages --> scoring
    pages --> theory
    components --> theory
    content --> theory
    audio --> theory
    scoring --> theory
    pages --> storage
```

## Layers and rules

| Layer | Path | Rule |
|---|---|---|
| Domain core | `codebase/packages/theory/` | `@jazz-master/theory` — pure TypeScript, **zero runtime dependencies in its `package.json`** (no React, no DOM, no side effects — structurally enforced). Exhaustively unit-tested — enharmonic spelling correctness is non-negotiable. |
| Astro shell | `codebase/apps/web/src/pages/` + `src/layouts/` | Astro's file router: public/server pages and API endpoints only (`index.astro`, `app/[...path].astro`, `trpc/[trpc].ts`). Never practice UI — that lives in the island. |
| Server API | `codebase/apps/web/src/server/trpc/` | tRPC procedures (`init.ts`, `context.ts`, `router.ts`, `routers/`), Zod at every procedure boundary, served through the fetch adapter in `src/pages/trpc/[trpc].ts`. Runs in workerd — no React/DOM. Client consumes it only via `src/app/trpc.ts` (`AppRouter` imported as type only, so server code never enters the client bundle). |
| Server database | `codebase/apps/web/src/server/db/` + `codebase/apps/web/drizzle.config.ts` | Server-only Drizzle schema and generated SQL migrations. `drizzle-orm`/`pg` stay out of React, components, and `packages/theory`; no runtime request path applies migrations. Product practice state still uses local storage until a future task deliberately moves a server-owned feature to Postgres. |
| Components | `codebase/apps/web/src/components/` | Reusable, thin; music knowledge comes from `@jazz-master/theory`, never inlined. |
| SPA pages | `codebase/apps/web/src/app/pages/` | One per practice module; own their route, compose components. `src/app/` is the island root (`AppShell.tsx`, `router.tsx`, `routes/`, generated `routeTree.gen.ts`). |
| Content | `codebase/apps/web/src/content/` | Exercise/lesson types, resolver, validator, and hand-authored lesson data. Pure TS — references theory constructs, never hard-coded note lists; imports `@jazz-master/theory` only (no components, no React, no storage). |
| Audio | `codebase/apps/web/src/audio/` | App-local browser-audio infrastructure. Pure timeline/scheduler/recording helpers are tested without Web Audio; `engine.ts` is the browser-only `smplr` seam that schedules FluidR3_GM guitar samples and synthesizes the play-along metronome click. The runner owns browser permission flows and imports playback lazily. |
| Scoring | `codebase/apps/web/src/scoring/` | Pure app-local take analysis and scoring. `analyzeTake` turns recorded mono PCM into monophonic note events; `scoreTake` greedily matches events to expected note/onset targets with octave-agnostic pitch-class matching and lenient/standard/strict timing presets. Kept inside the web app rather than a package until there is a second consumer. |
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

## Local database development (TASK-028/TASK-055)

The root `docker-compose.yaml` defines one dev-only PostgreSQL service using
`postgres:18`, obvious local credentials (`jazz_master`/`jazz_master`), a
localhost-only port bind (`127.0.0.1:${JAZZ_MASTER_POSTGRES_PORT:-5432}:5432`),
a `pg_isready` healthcheck, and a named volume (`jazz_master_postgres_data`,
prefixed by the Compose project name at runtime) mounted at
`/var/lib/postgresql`, matching the PostgreSQL 18 image layout. `docker compose
down` preserves local data; `docker compose down --volumes` is the documented
intentional reset. `.env.example` documents the local `DATABASE_URL` convention
and the default host port.

Drizzle schema generation lives in the web workspace as migration infrastructure
only: `apps/web/drizzle.config.ts` reads `DATABASE_URL`, uses PostgreSQL, points
at `apps/web/src/server/db/schema.ts`, and writes generated migrations to
`apps/web/drizzle/`. Applying migrations is owned by the dedicated
`apps/migration` workspace app, whose config points at that same schema and
committed migration directory. Run migrations from the repo root with:

```sh
DATABASE_URL=postgresql://jazz_master:jazz_master@127.0.0.1:5432/jazz_master bun run --cwd codebase db:migrate
```

Use `bun run --cwd codebase db:generate` to create committed SQL migrations when
schema changes require them. `drizzle-kit push` is not the default workflow.
`bun run --cwd codebase dev` and `bun run --cwd codebase check` must still work
with Docker stopped and without `DATABASE_URL`.

Deployment migrations run from a Railway service, not from the Cloudflare build.
Configure the Railway service against the shared Bun monorepo with root
directory `codebase`, start command `bun run --cwd apps/migration start`, and a
service-scoped `DATABASE_URL` variable containing the deployment Postgres
connection string. The migration process exits after applying committed Drizzle
migrations; Railway's default `On Failure` restart policy is acceptable, and
`Never` is also fine for an intentional one-shot migration service.

## Deployment (TASK-024)

Target is **Cloudflare Workers** (not Pages — RES-002; ADR-006). `apps/web/wrangler.jsonc` is the user config (`nodejs_compat`, pinned `compatibility_date`); at build time the adapter emits the resolved Worker config to `dist/server/wrangler.json` (entry `entry.mjs`, static assets from `dist/client`) and a `.wrangler/deploy/config.json` redirect points wrangler at it, so no `main`/`assets` live in the user config.

- **Credential boundary (ADR-009, amended NOTE-007):** agents never hold deploy credentials — no `wrangler login` on development machines, ever, and **no deploy token exists anywhere** (not in repo secrets, not on disk). The credential is implicit in the Cloudflare↔GitHub connection the owner authorizes in the Cloudflare dashboard.
- **Dev deploys (Cloudflare Workers Builds):** the repo is connected to the `jazz-master-web` worker in the Cloudflare dashboard; every push to `main` triggers a build — root directory `codebase/apps/web`, build command `cd ../.. && bun install --frozen-lockfile && bun run check`, deploy command `bunx wrangler deploy`. The deployed worker **is the dev environment**; build status appears in the Cloudflare dashboard and as a GitHub commit status. Cloudflare does not need `DATABASE_URL`; Railway owns deployment migrations through `apps/migration`. The Worker request path never runs migrations and agents do not provision or hold production database credentials.
- **Production:** does not exist, and standing one up is off the roadmap (TASK-036 abandoned by owner decision 2026-07-07, NOTE-008) — the dev worker URL is the product's home for the foreseeable future. If production ever matters, a fresh task starts from TASK-036's preserved open questions; ADR-009's owner-only-deploy decision stands regardless.
- **Local Workers-runtime preview:** `bun run build && bun run preview` — with the Cloudflare adapter, `astro preview` serves the built worker in workerd, so Workers-specific breakage is catchable before pushing. (`bun run deploy` exists but fails locally for lack of credentials — correct behavior under ADR-009.)
- **Live dev URL:** https://jazz-master.premysl-ciompa.workers.dev (first green Workers Builds deploy 2026-07-07; verified: `/` SSR, `/trpc/health` typed JSON, `/app/*` deep-link reloads, full onboarding→lesson→history flow, zero console errors).
- **Bindings:** `ASSETS` (static files) and `IMAGES`, both adapter-injected and id-less. The adapter would also force a `SESSION` KV namespace, but `session: { driver: sessionDrivers.memory() }` in `astro.config.mjs` suppresses it — the app uses no sessions, and a KV binding would have required KV provisioning rights on the CI token.
- **Production posture (INS-020/021):** the dev health chip (`HealthFooter`) renders only in dev builds; tRPC error responses are stripped of stack traces outside dev via `sanitizeErrorShape` in `src/server/trpc/init.ts` — workerd sets no `NODE_ENV`, so tRPC's own env heuristic can't be trusted. `/trpc/*` serves no CORS headers (same-origin consumers only) and Astro's default cross-site-POST origin check stays on; that is the deliberate posture while the API is health-only — revisit when real procedures land (TASK-025+). Same trigger for message masking: `sanitizeErrorShape` strips stacks but tRPC still returns `INTERNAL_SERVER_ERROR` messages verbatim (no `NODE_ENV` masking in workerd), so the first throwing procedure must add message sanitization too.

## Knowledge system

The repo is also the product operating system. `strategy/` sets direction, `processes/` defines executable playbooks, `work/` tracks lifecycle-managed epics/tasks/insights/issues/reviews, `notes/` preserves raw feedback and observations, `research/` stores completed research, `architecture/` records system shape and decisions, and `artifacts/` stores human-facing rendered outputs such as presentations and visual reports. `wiki/` is a derived layer on top: compiled "how the product/project works" pages that cite the canonical files and lose to them on conflict (ADR-007; ops in `processes/wiki-maintenance.md`). Markdown files remain the canonical source for agent-facing instructions and project knowledge. See ADR-003 and ADR-004.

## Routing

Two routers with a hard boundary at `/app`. Astro's file router owns everything outside it (`src/pages/index.astro`, future public pages). Inside the island: TanStack Router, file-based (TASK-022) — route files live in `apps/web/src/app/routes/` (never `src/pages/`, which Astro owns), one per practice module plus `__root.tsx`, which carries the onboarding gate (formerly `App.tsx`), renders `Layout`, and points `notFoundComponent` at `NotFoundPage`. The `@tanstack/router-plugin` Vite plugin in `astro.config.mjs` generates `src/app/routeTree.gen.ts` (committed, because `bun run build` runs `tsc -b` before `astro build` regenerates it); navigation is type-safe — a typo'd `Link` path fails typecheck. `router.tsx`'s `createAppRouter(history?)` sets `basepath: '/app'` (replacing the old BrowserRouter basename) and lets tests inject a memory history; `AppShell.tsx` creates the browser-history instance for the island. `apps/web/src/components/Layout.tsx` is the persistent shell (sidebar `Link`s with `activeProps`, content via `<Outlet>`). The dashboard→practice Start handoff rides typed history state (`declare module '@tanstack/history'` in `PracticePage.tsx`; `@tanstack/history` is pinned to the exact version `@tanstack/react-router` depends on). Tests render the real route tree through `src/test/renderRoute.tsx`.

## Theory core

`codebase/packages/theory/src/` — `note.ts` (Note = letter + accidental, parse/format/pitch class), `interval.ts` (named-interval table; `transpose` moves the letter then derives the accidental, so spelling is correct by construction), `chord.ts` (formulas as interval stacks; `spellChord`, `parseChord`). Public API is the `index.ts` barrel only; parse functions return `null` on bad input, `spellChord` throws on a bad root string (programmer error). Names beyond double accidentals are unrepresentable — `noteName` throws.

## Persistence (TASK-008)

`apps/web/src/storage/` exposes `defineStore<T>({ name, version, defaultValue, migrate? })`, returning a typed `Store<T>` (`get`/`set`/`update`/`reset`). Values persist under `jazz-master:<name>` in a `{ version, data }` envelope. Reads never throw: missing keys, corrupt JSON, malformed envelopes, versions from the future, and failed migrations all fall back to `defaultValue()` with a `console.warn`. When the persisted version is older, `migrate(persisted, fromVersion)` upgrades the data and the result is written back. Current durable user-data stores are `profile`, `sessions`, `daily-plans`, `play-along-tempos` (per-exercise slow-practice BPM), `notation-preferences`, and `scoring-preferences` (lenient/standard/strict take-scoring tolerance). Session `durationSeconds` is accumulated active exercise time: the runner starts counting when playback/recording begins for an exercise and stops when that playthrough completes, so setup and grading prompt time are excluded. `PracticeSession.results[]` can now carry machine-score metadata per exercise: score, tolerance preset, pitch/timing/completeness components, per-note verdicts, and detected-extra count; session-level `score` is the mean of scored exercise results for history/dashboard summaries. RES-014/INS-023 add an important caveat: Safari/WebKit can evict script-writable storage after a period without user interaction. Since ISSUE-005, the Profile page exposes JSON backup export/import for all current typed stores, including score metadata/preferences. The import contract lives in `storage/backup.ts`: it rejects malformed, oversized, unsupported-version, or bad-date backups, then writes versioned envelopes transactionally and verifies durable bytes before reporting success. **Convention: no direct `localStorage` access outside `src/storage/`** — every feature defines a store, so a backend can later replace the wrapper (ADR-002). Extraction to `packages/storage` waits for a second consumer (ADR-005); React hooks over stores are deferred to first use.

## Content model (TASK-011)

`apps/web/src/content/` is the shared contract between curriculum data (TASK-012), the practice runner (TASK-013), and the planner (EPIC-011). An `Exercise` is one playable unit — `ExerciseMaterial` (a discriminated union referencing theory constructs: scale or arpeggio + root + type/quality; more kinds arrive with the tasks that need them), a fret `window` (the position), `tempoBpm`, a `duration` (minutes or repetitions), and `display` hints. A `Lesson` is ordered exercises plus planner metadata: `area` (`scales | arpeggios | chords | standards`), `level` (1 = beginner), `prerequisites` (lesson ids), `estimatedMinutes`. `resolveExercise` turns a reference into concrete spelled notes + `PositionedNote[]` (throws on broken references); `validateLessons` returns a problem list covering unparseable roots, invalid windows, non-positive amounts, duplicate ids, and missing/cyclic prerequisites — lesson packs assert it returns `[]` in a test.

## Play-along audio (TASK-046/047)

`apps/web/src/audio/` is the EPIC-014 playback seam. `timeline.ts` turns resolved
exercise positions into straight-eighth note events plus quarter-note clicks;
`scheduler.ts` owns the lookahead loop semantics (count-in, loop wrap, stop,
tempo changes) without touching browser APIs; `engine.ts` is the only Web Audio
adapter and owns the `smplr` integration behind the lazily loaded audio module.
The default sampler preset targets FluidR3_GM
`electric_guitar_jazz` from `midi-js-soundfonts`, loading only the MIDI notes
needed for the current exercise and using `CacheStorage` when the browser
allows it; local HTTP dev falls back to normal fetch. The metronome/count-in
path synthesizes its own click and can run without guitar samples. The practice
runner owns the UI controls: play/stop lazy-loads the engine, loop and
click/count-in are toggles, tempo is capped at the authored exercise BPM, and
the chosen slow-practice tempo persists per `Exercise.id` through the
`play-along-tempos` typed store.

## Recording capture (TASK-041)

The runner now has an exercise-local capture flow backed by
`apps/web/src/audio/recording.ts`. The Record button is the only place that
requests microphone permission, using music-oriented constraints
(`echoCancellation`, `noiseSuppression`, and `autoGainControl` requested off,
with browser noncompliance tolerated per RES-014). Once permission is granted,
the runner creates/resumes an AudioContext inside the gesture, shows a live RMS
input meter, schedules a four-beat synthesized count-in at the exercise tempo,
then starts MediaRecorder on the known beat grid. Capture prefers
`audio/webm;codecs=opus` and falls back to `audio/mp4` for Safari; the recorded
Blob becomes an in-memory object URL for replay only. No take audio is persisted
or uploaded, and the URL plus mic tracks are cleaned up when the user discards
the take or leaves the exercise. TASK-041 is done; cross-browser/device mic
coverage now belongs to QA/product review rather than blocking task completion.

## Score feedback (TASK-043)

After a recorded take stops, the runner decodes the in-memory Blob to mono PCM,
passes it through `apps/web/src/scoring/analyzeTake`, then scores against the
exercise's resolved notes on the current tempo grid with the selected tolerance
preset. The UI shows an analyzing state, a compact 0-100 score with
pitch/timing/completeness components, per-note verdict chips, and extra-note
count. Empty/unclear analysis shows a "couldn't hear enough clear notes" state
and writes no punitive score. On grading, scored metadata is attached to that
exercise's `PracticeSession.results[]` entry through the typed `sessions` store;
the raw take audio remains transient and is never persisted. The chosen
tolerance lives in the `scoring-preferences` store and is included in JSON
backup/import.

## Current state (2026-07-08)

App shell done (TASK-001): routing + sidebar nav + stub pages. Theory core done (TASK-002, TASK-009, TASK-010): notes, intervals, chord spelling/parsing, scales/modes/arpeggios, fretboard positions, 12-key test coverage. Fretboard (TASK-003) and chord diagrams (TASK-004) done. Monorepo restructure done (TASK-027, per ADR-005): code lives under `codebase/` as `apps/web` + `packages/theory`. Persistence layer done (TASK-008): typed localStorage stores — this completes EPIC-001. Exercise/lesson content model done (TASK-011): `apps/web/src/content/` opens EPIC-008. First lesson pack done (TASK-012): 10 scales/arpeggios lessons across 3 levels in `apps/web/src/content/lessons.ts`, listed on the Practice page. Guided practice runner done (TASK-013, completing EPIC-008): the Practice page runs lessons exercise by exercise (resolved fretboard positions, countdown, got-it/shaky/missed self-grades) and persists `PracticeSession` records — the contract EPIC-011/012 consume — to the `sessions` store (`apps/web/src/storage/sessions.ts`), upserted after every grade so abandoned runs keep their history. Adaptive planner done (TASK-016/017, completing EPIC-011): a local `PracticeProfile` plus `generatePlan` produce a persisted Today's plan with reasons, runner handoff, and completion ticks from session records. Practice history done (TASK-018, opening EPIC-012): `/history` lists persisted sessions grouped by local day with area/time-range filters and per-exercise drill-down; pure grouping/filtering logic lives in `apps/web/src/history/` (same plain-function tier as `planner/`). Dashboard v1 done (TASK-019, completing EPIC-012): `/` is the product's front door — today's plan with a Start handoff into the runner, streak, minutes-this-week, and per-area needs-attention callouts from a pure `apps/web/src/dashboard/` derivation module. ADR-006 (Astro/Workers/tRPC/Hyperdrive target platform) is **accepted** (owner grill 2026-07-06, NOTE-005; TASK-020 done). Astro shell landed (TASK-021): Astro 7 serves a barebones landing at `/` and hosts the React app as a client-only island under `/app/*`; React pages moved to `src/app/pages/`; build targets Workers via `@astrojs/cloudflare` (deploy is TASK-024). TanStack Router migration done (TASK-022): react-router removed, file-based routes under `src/app/routes/` with type-safe navigation and the same URLs. tRPC scaffold done (TASK-023): typed `/trpc/health` end to end — `appRouter` under `src/server/trpc/` with Zod boundaries, Astro fetch-adapter endpoint, `@trpc/tanstack-react-query` client on one shared `QueryClient`, health chip rendered in the SPA; jsdom tests exercise the real wire path via `src/test/trpcTestFetch.ts` (fetchRequestHandler in-process). Workers deploy done (TASK-024, 2026-07-07): redesigned twice mid-task by owner grills (ADR-009 + amendment; NOTE-006/007) — deploy tooling, production posture (dev-only health chip, stack-stripped tRPC errors), the workerd preview path, and a binding-free worker all landed, and the app is live on the dev environment at https://jazz-master.premysl-ciompa.workers.dev via **Cloudflare Workers Builds** (check gate in the build command; every push to `main` deploys). Production is off the roadmap (TASK-036 abandoned 2026-07-07, NOTE-008); the dev URL is the product's home.

EPIC-010 recording/scoring is in progress from a deliberately risk-accepted
position: RES-014 returned staged-go for monophonic offline-after-take scoring,
but the owner abandoned TASK-040's real-guitar spike on 2026-07-08 (NOTE-010).
TASK-041's capture implementation is present in the runner and covered by
component/unit tests; NOTE-012 moved human-only browser/device verification out
of task completion gates and into QA/product review. TASK-042 added the pure
`apps/web/src/scoring/` module: synthesized mono fixtures prove perfect, late,
wrong, missed, extra, empty, and octave-shifted takes across multiple keys.
TASK-043 now wires capture to scoring, score UI, typed score persistence, history
summary display, and tolerance preferences. Real-signal quality issues should be
handled in follow-up QA rather than treated as a current blocker.
