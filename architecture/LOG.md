# Engineering log

Chronological, append-only. One short entry per notable event: migrations, dead ends, gotchas, incidents, decisions too small for an ADR. Newest at the top.

---

## 2026-07-09 — TASK-075 public landing/auth polish

Replaced the bare public `/` page with a full signed-out landing page using
Astro public shell components, practice-specific copy, and a static
practice-board mock. `/sign-in` and `/sign-up` now share that public visual
system while preserving Clerk's prebuilt auth components, local auth links,
`noindex`, and the `/app` fallback/return behavior from TASK-074.

## 2026-07-09 — TASK-074 app-hosted Clerk auth pages

Added Astro-owned `/sign-in` and `/sign-up` pages using Clerk's prebuilt
components. Signed-out `/app/*` requests now redirect to local `/sign-in` with a
`redirect_url` back to the requested app path, and the auth pages cross-link
locally with `/app` fallback redirects. Password recovery/reset, MFA/2FA, and
required session-task handling stay in Clerk's prebuilt UI and Dashboard
configuration.

## 2026-07-09 — ISSUE-008 live Worker all-routes 500 fixed forward

Fixed a blocker deployed-runtime incident where every probed live Worker route
returned HTTP 500 after TASK-073. Clerk middleware no longer requires Clerk
runtime keys before public `/` and public tRPC smoke routes can respond:
configured environments still use Clerk, unconfigured public routes bypass auth,
and unconfigured `/app/*` returns a controlled 503 rather than crashing Worker
startup.

## 2026-07-09 — TASK-073 Workers observability

Enabled Cloudflare Workers Logs and source-map upload in `wrangler.jsonc`
(`observability.enabled: true`, `head_sampling_rate: 1`,
`upload_source_maps: true`) and added server-side structured JSON logs for tRPC
request outcomes plus the restored `/trpc/dbSmoke` Hyperdrive/Postgres probe.
The log helper redacts or drops Clerk identifiers, auth/cookie headers,
database URLs, request/response bodies, SQL fields, and tokens. Owner log
inspection remains dashboard-only under ADR-009; agents still hold no
Cloudflare credentials.

## 2026-07-09 — TASK-066 profile moved to Clerk/Postgres

Moved practice profile and onboarding completion off localStorage and into
protected Clerk-scoped tRPC procedures backed by normalized Postgres tables:
`practice_profiles` for scalar profile fields and `practice_profile_goal_areas`
for ordered goal priorities. `onboarding_completed_at` is product lifecycle
time and stays distinct from DB row `created_at`. Removed the temporary
`dbSmoke` and `mockPractice` tRPC/database scaffolding after the real profile
path verified local Postgres access.

## 2026-07-09 — TASK-065 Clerk-keyed user anchor

Added the minimal app-owned `users` table keyed directly by Clerk user ID, with
only `created_at` and `updated_at` metadata. Server code now has
`ensureUser(clerkUserId)`, and protected tRPC exposes a `users.ensure` path that
creates or reuses the row only for authenticated callers. `auth.me` remains
auth-only, and Clerk-owned email/name/profile data stays out of Postgres.

## 2026-07-09 — TASK-063 Clerk auth foundation

Added `@clerk/astro` to the web app, installed Astro middleware that protects
`/app/*` while keeping `/` public, and added a runtime env assertion for
`PUBLIC_CLERK_PUBLISHABLE_KEY` plus `CLERK_SECRET_KEY` so local dev uses real
Clerk keys rather than keyless mode. tRPC context now carries Clerk identity
from Astro locals, `protectedProcedure` rejects unauthenticated calls, and
`auth.me` is the protected foundation probe. The React shell renders Clerk's
`UserButton`. `dbSmoke` remains public and temporary until real app-data
procedures replace smoke-only DB verification.

## 2026-07-09 — TASK-062 ADR-012 accepted

ADR-012 now supersedes ADR-002 as the long-run persistence target: Clerk owns
identity, `/app/*` will require sign-in, browser code talks to tRPC, server code
owns Drizzle/Postgres access, and Postgres becomes the source of truth for
long-run app data. Existing local browser data is intentionally discarded rather
than migrated; typed localStorage stores remain only as migration state until
TASK-063/TASK-065 through TASK-072 retire them slice by slice.

## 2026-07-09 — TASK-061 mock practice DB path

Added the first committed Drizzle table, `mock_practice_rows`, plus a
server-only repository and `mockPractice.record` tRPC mutation that writes a
practice-shaped mock row and reads recent rows back. This proves a typed
Postgres write/read path without moving real profile/session/planner/score data
off local storage.

## 2026-07-09 — TASK-064 Hyperdrive binding wired to dbSmoke

Added the owner-provided Cloudflare Hyperdrive config id to `apps/web/wrangler.jsonc`
as binding `HYPERDRIVE` and passed that runtime binding from the Astro tRPC
endpoint into server context. The Drizzle smoke client now prefers
`HYPERDRIVE.connectionString` and falls back to local `DATABASE_URL`, so the
deployed `/trpc/dbSmoke` path can reach Railway through Hyperdrive while local
checks still run without a database.

## 2026-07-09 — TASK-056 server DB smoke path

Added the first app-side Drizzle runtime path: `src/server/db/smoke.ts` creates
an optional server-only smoke client from `DATABASE_URL`, tRPC context exposes it
without requiring configuration, and `/trpc/dbSmoke` runs `select 1` through
Drizzle when a database is configured. Missing database config returns an
`unconfigured` status, so normal dev/test/build flows still work with Docker
stopped and product practice state remains local.

## 2026-07-09 — TASK-060 Railway migration service follow-up

Railway service isolation was tightened after a deploy built
`codebase/apps/migration` with Railpack/npm and failed to resolve the monorepo
`tsconfig.base.json`. The migration app now has a standalone `tsconfig`, its own
Bun Dockerfile, and owns the committed Drizzle migration directory; web
`db:generate` still reads the web schema but writes SQL metadata into
`apps/migration/drizzle/`.

## 2026-07-09 — TASK-060 Railway migration service

Deployment migrations moved out of Cloudflare Workers Builds and into a
dedicated `apps/migration` Bun workspace intended to run as a Railway service.
Root `db:migrate` now routes through that app, Cloudflare's build command is back
to install + `bun run check`, and the deployment `DATABASE_URL` belongs only on
the Railway migration service. Worker request paths still do not migrate, and
runtime DB access remains future work.

## 2026-07-09 — TASK-055 Drizzle migration foundation

Added Drizzle ORM migration infrastructure for the web app: `drizzle-orm` and
`pg` as app dependencies, `drizzle-kit` and `@types/pg` as dev dependencies,
`apps/web/drizzle.config.ts` reading `DATABASE_URL`, an intentionally empty
server-only schema entrypoint at `src/server/db/schema.ts`, and root/web
`db:generate`/`db:migrate` scripts. Migration files will be generated into
`apps/web/drizzle/` and committed when schema changes require them. Deploy-time
migrations are a Cloudflare Workers Builds step using an owner-owned build-only
`DATABASE_URL`; the Worker request path does not migrate, and practice state
remains local.

## 2026-07-08 — TASK-028 local Postgres compose service

Added a root Docker Compose PostgreSQL service for local server-persistence development: `postgres:18`, dev-only `jazz_master` credentials, localhost-only port binding, named volume mounted at `/var/lib/postgresql` for the Postgres 18 image layout, and `pg_isready` healthcheck. Documented `.env.example`, `psql` smoke checks, optional host-port override for local conflicts, and explicit reset via `docker compose down --volumes`; the app still does not require Docker or Postgres for dev/check.

## 2026-07-08 — score feedback and score-only persistence shipped (TASK-043)

The runner now analyzes recorded takes after stop, shows a 0-100 machine score
with per-note verdicts, persists score metadata on `PracticeSession.results[]`,
and leaves raw audio transient. Added the `scoring-preferences` typed store for
lenient/standard/strict tolerance and included score metadata/preferences in
backup import/export validation. Review gotcha: async analysis needs a generation
guard so a stale decode from an earlier take cannot overwrite a later take's
score state.

## 2026-07-08 — human-only verification moved out of task gates (NOTE-012)

Owner decision: agents should not create or preserve tasks that require
human-only manual browser/device verification before `done`. Task verification
now must be automated or agent-runnable; humans catch device/browser issues
during QA/product review and those findings become issues. TASK-041's capture
flow is therefore marked done on its implemented/reviewed scope, with residual
Firefox/Safari/iOS Safari mic risk routed to QA.

## 2026-07-08 - local storage backup and restore shipped (ISSUE-005)

The Profile page now exposes JSON backup export/import for the typed local
stores: profile, sessions, daily plans, play-along tempos, and notation
preferences. Restore validates the full backup first, rejects oversized or
malformed files, writes versioned envelopes inside `apps/web/src/storage/`, and
verifies the durable bytes before reporting success. This mitigates the
Safari/WebKit localStorage eviction risk without changing the no-account,
local-first architecture.

## 2026-07-08 - manual regression process added

Added `processes/regression-testing.md` and RES-016 to create a compiled
manual/browser regression pack (`work/REGRESSION.md`) from shipped task
Acceptance criteria and Verification steps. Heartbeat schedules regression work
as a normal task when the pack is missing/stale or high-risk product areas
change; heartbeat does not run the browser pass inline. QA reviews now read the
latest regression run as setup context.

## 2026-07-08 - knowledge maintenance sweep round 2 (TASK-053)

Second sweep resolved the post-runner knowledge drift: `research/README.md` now
has a RES index, duplicate `INS-031` was renumbered (`INS-036` is play-along),
RES-002's remaining stale-research trigger is explicitly gated to TASK-025,
Safari localStorage eviction is documented in ADR-002/overview and routed to
TASK-054, ISSUE-004 is confirmed, and EPIC-007 is closed.

## 2026-07-08 — dev-loop claim-time owner report added

The dev loop now requires agents to announce a claimed work item before deeper
planning or implementation: ID/title, problem, intended outcome, likely touch
area, and verification signal. This keeps the owner oriented as soon as a task
lock is taken, without adding new tracker fields.

## 2026-07-08 - unfinished placeholder app routes hidden (TASK-051)

The SPA primary nav now exposes only usable surfaces: Dashboard, Practice,
History, and Profile. Placeholder routes for voicings, progressions,
repertoire, and ear training were removed from the TanStack file route tree, so
direct visits intentionally hit the existing not-found page until those modules
have real workflows.

## 2026-07-08 — synthesized take scoring engine added (TASK-042)

Added `apps/web/src/scoring/` as a pure app-local scoring layer rather than a
new package: `analyzeTake` runs offline MPM-style monophonic pitch detection
over PCM and groups detected frames into note events; `scoreTake` matches those
events to expected notes/onsets with octave-agnostic pitch-class matching,
lenient/standard/strict timing presets, per-note verdicts, and 60/30/10
pitch/timing/completeness components. Verification is synthesized-fixture only
per the accepted TASK-040 risk decision; real guitar behavior still needs QA.

## 2026-07-08 — runner notation readability pass shipped (TASK-048)

Runner notation now has mode-aware VexFlow rendering (staff, TAB, or both), larger
default/focus scaling, a reserved keyboard-scrollable score viewport, and an
in-run focus dialog with grading controls. The chosen score display persists in
the typed `notation-preferences` localStorage store, and the Playwright smoke
suite now asserts real SVG score glyphs render.

## 2026-07-08 — runner recording capture implemented; manual browser verification pending (TASK-041)

The practice runner now has an exercise-local take recorder: Record requests the
microphone on the user gesture, shows an input level meter, plays a four-beat
Web Audio count-in at the exercise tempo, captures via MediaRecorder
(`audio/webm;codecs=opus` with `audio/mp4` fallback), and exposes an in-memory
replay that is discarded when the exercise unmounts. No audio is persisted or
uploaded. TASK-041 remains blocked, not done, because desktop Firefox/Safari and
iOS Safari mic verification requires browsers/devices unavailable in this
environment.

## 2026-07-08 — real-guitar scoring spike skipped by accepted risk (NOTE-010)

Owner chose to skip TASK-040's real-guitar feasibility check and assume RES-014's
monophonic offline pitch/onset pipeline is good enough to proceed. TASK-040 is
abandoned, and TASK-041/TASK-042 are unblocked with explicit accepted-risk
context: scoring work now starts from RES-014 defaults and synthesized fixtures,
with real-signal problems expected to surface during implementation/dogfooding.

## 2026-07-08 — runner play-along controls shipped (TASK-047)

The practice runner now lazy-loads the play-along engine from an exercise-level
control strip: play/stop, loop, click/count-in, and a tempo slider capped at the
authored BPM. Slow-practice tempo persists per `Exercise.id` in the versioned
`play-along-tempos` store; changing exercises, ending a run, or completing a
lesson disposes active playback.

## 2026-07-08 — play-along audio engine seam added (TASK-046)

Added `apps/web/src/audio/`: pure timeline/scheduler helpers plus a browser-only
Web Audio engine that dynamically imports `smplr` for exact-range FluidR3_GM
electric-jazz-guitar samples. Metronome clicks are synthesized, sample fetches
use `CacheStorage` when available, and source attribution lives under
`apps/web/public/audio/play-along/`.

## 2026-07-07 — Play-along sampled-audio stack chosen (TASK-045)

RES-015/ADR-011 chose `smplr` behind a project-owned Web Audio lookahead
scheduler for EPIC-014 play-along. Default sample source is FluidR3_GM
electric/jazz guitar with piano as fallback, lazy-loaded and CacheStorage-backed
where available. Implementation split into TASK-046 (audio engine) and TASK-047
(runner controls + per-exercise tempo persistence).

## 2026-07-07 — Notation chunk trimmed 692→389 KB gzip (TASK-039); EPIC-009 closed

The v4-era `vexflow-core` package RES-013 flagged needs-spike is obsolete in v5: the
main `vexflow@5` package ships subpath entries instead — `vexflow/core` (zero fonts)
and `vexflow/bravura` (Bravura + Academico, both embedded as data URIs). The bravura
entry re-exports the identical API barrel, so the trim was a one-line import swap in
`notationRender.ts`; the dropped weight is the embedded Petaluma/PetalumaScript/
Gonville font modules. Academico must stay (TAB fret digits route to it — see the
TASK-037 entry below), which is why `/bravura` beats `/core` + lazy fonts for us.
VexFlow's cdn.jsdelivr.net `Font.HOST_URL` fallback is dead code when font data is
passed (always, in this entry) — offline rendering verified in-browser with all
external requests blocked. Last EPIC-009 task; the epic is done.

ADR-010 made real: `<Notation>` renders staff+TAB from theory-core spellings, VexFlow
behind a dynamic-import chunk (692 KB gzip, verified split). The spike confirmed the
v4-era Formatter/Accidental docs hold in v5 — no fallback needed. Gotchas for anyone
styling VexFlow on our dark theme: TAB fret digits default to the Bravura *music*
font (blocky time-sig glyphs — route `MetricsDefaults.TabNote.text.fontFamily` to
Academico), fret numbers sit on an opaque white blanking rect
(`context.setBackgroundFillStyle('transparent')`), and `renderer.resize()` pins inline
pixel width/height that beats responsive svg attributes. All handled inside
`notationRender.ts`; details in TASK-037's log. Runner integration polish → INS-029.

## 2026-07-07 — E2E layer adopted (TASK-035); Astro-dev daemonization gotcha

The Playwright smoke suite is live: 4 specs over the guided-practice slice, `bun run --cwd codebase check:e2e`, deliberately outside `bun run check` (NOTE-005). Gotcha for anyone wiring tools to `astro dev`: Astro 7 detects agentic environments and silently daemonizes the dev server (the launcher process exits), which any process-supervising tool — Playwright's `webServer` here — reads as the server dying. `ASTRO_DEV_BACKGROUND=1` in the child env suppresses the detection and keeps it foreground; see the comment in `apps/web/playwright.config.ts`.

## 2026-07-07 — Production environment taken off the roadmap (TASK-036 abandoned; grill NOTE-008)

The owner ditched the parked production-deploy task outright: production is far enough out that a standing gated placeholder is pure context cost. This supersedes NOTE-006's "gated until the owner asks". The dev worker URL is the product's home for the foreseeable future. Nothing about ADR-009 changes — production deploys, if they ever exist, remain owner-only and never agent-reachable — and TASK-036's file keeps its three open questions (prod-trigger enforcement, naming/domain, promote-artifact semantics) as raw material for any future fresh task. `abandoned` added to the task status vocabulary in `work/README.md` (terminal, carries `abandoned_reason:`).

## 2026-07-07 — RES-014: browser guitar-take scoring is staged-go (TASK-015)

VIS-001's riskiest bet is feasible in stages: monophonic offline-after-take analysis (MPM/`pitchy` or YIN/`pitchfinder` + spectral-flux onsets, metronome count-in, ±100 ms full-credit windows, 60/30/10 pitch/timing/completeness score, score-only persistence) is credible in the browser today; real-time worklet feedback and per-note chord scoring are rejected for v1 (chords staged later as a chroma-template check). EPIC-010 implementation staged behind a real-guitar spike (TASK-040) — the repo's first task whose verification needs the owner physically playing.

## 2026-07-07 — ISSUE-001: app shell made responsive

The fixed `w-56` sidebar + implicit `min-width:auto` on the flex main were the root cause of every route overflowing phone viewports. Sidebar now collapses to a top bar below `md`; `<main>` carries `min-w-0`. Verification pattern worth keeping: real-browser `document.documentElement.scrollWidth` checks at 375px across all routes (752px → 375px on /app/voicings). Gotcha: the Playwright-MCP screenshot tool writes into the main repo root, not the caller's worktree cwd.

## 2026-07-07 — Notation/TAB rendering decided: VexFlow 5 behind a component seam (TASK-014 → RES-013, ADR-010)

VexFlow 5 (MIT), used via its low-level native API — not VexTab/EasyScore — wrapped in a project-owned `<Notation>` component and lazy-loaded out of the initial `/app` chunk (~677 KB gzip otherwise). Chosen because its input model *is* spelled pitches, so the theory core's enharmonics render verbatim; staff+TAB alignment is one documented Formatter pass. alphaTab rejected (fret-first model, derived spelling, worker/asset baggage), OSMD rejected (MusicXML-only input over the same VexFlow engine), custom SVG recorded as the fallback behind the seam. Implementation: TASK-037–039.

## 2026-07-07 — ISSUE-002: focus-on-swap mechanism adopted

Same-route view swaps (practice list ↔ runner ↔ summary, onboarding → app) now move focus to the incoming view's heading via the shared `useViewFocus` hook (`apps/web/src/components/useViewFocus.ts`) instead of dropping it on `body`. Use the hook for any future view swap rather than ad-hoc focus effects; route-change focus is a deferred, milder follow-up (INS-027).

## 2026-07-07 — TASK-031: commit-isolation guardrails adopted in the git workflow

After INS-008 (commit `5b63bcd` swept another agent's staged work), `processes/git-workflow.md` gained a "Commit isolation" section: worktree-per-agent preferred; in shared trees, inspect `git status --short`, then stage and commit by pathspec (`git commit -m ... -- <paths>`), verify with `git log -1 --stat`. "Anatomy of a ship", the end-of-run check, dev-loop, heartbeat, and code-review aligned.

## 2026-07-06 — ADR-009 amended: Cloudflare Workers Builds replaces the GitHub Action (grill NOTE-007)

One commit after the `deploy-dev` workflow landed — and one run after it proved the design by passing the full check gate on a GitHub runner and failing only on the deliberately-missing token — the owner redirected to Cloudflare Workers Builds: the repo connects to the worker in the Cloudflare dashboard, Cloudflare runs the check gate (owner kept it — NOTE-007 Q1a) and deploys on push to `main`. Net effect on ADR-009: stronger — no deploy token exists anywhere, not even in GitHub secrets. The workflow file lived for 39 minutes; its one run stands as evidence the gate works in CI.

## 2026-07-06 — ADR-009: no local deploy credentials, CI-only deploys (grill NOTE-006)

The TASK-024 login blocker became a decision instead of a login: the owner rejected local wrangler credentials outright — AI agents must not have access to production, so the only deploy credential is a scoped API token in GitHub Actions secrets. Dev now auto-deploys on every push to `main` (TASK-024 reshaped); production is a gated, manual-UI-trigger concern (TASK-036) carrying the open question of whether owner approval is mechanically enforced (GitHub environment + required reviewer) or trust-based.

## 2026-07-06 — Workers deploy prepped; publish blocked on owner login (TASK-024)

Deploy tooling landed: `wrangler` pinned in apps/web, `bun run deploy` (= `astro build && wrangler deploy`) exposed from the codebase root. Discovery: no `main`/`assets` belong in `wrangler.jsonc` — the adapter emits the resolved config to `dist/server/wrangler.json` and `.wrangler/deploy/config.json` redirects wrangler there; `wrangler deploy --dry-run` validates the whole thing without auth. Local Workers-runtime preview is just `astro preview` (the adapter serves the built worker in workerd) — verified `/` SSR, `/trpc/health` JSON, `/app/*` deep links there. INS-020/021 folded in: health chip is dev-only; tRPC error stacks stripped outside dev via an explicit `errorFormatter` (workerd sets no `NODE_ENV`, so tRPC's dev/prod heuristic never flips — verified: prod build returned full stacks before, none after). **Gotchas:** the adapter force-enables KV sessions (unused `SESSION` binding will want a namespace provisioned at first deploy — no off switch); tRPC still returns internal error *messages* verbatim in prod, fine while health-only, must be masked when the first throwing procedure lands. The publish itself is blocked: Cloudflare OAuth token expired, refresh needs an interactive `wrangler login`.

## 2026-07-06 — tRPC scaffold: typed /trpc/health end to end (TASK-023)

First server code in the app: `appRouter` under `apps/web/src/server/trpc/` (Zod at procedure boundaries), served by the Astro catch-all `src/pages/trpc/[trpc].ts` via tRPC's fetch adapter — that server shape from RES-002 verified exact on tRPC 11.18. The client shape moved, though: tRPC now recommends `@trpc/tanstack-react-query` (`createTRPCContext`/`useTRPC` + `queryOptions` on plain React Query hooks) over the classic `@trpc/react-query` provider RES-002 cited — staleness note recorded in RES-002. One `QueryClient` shared by React Query and tRPC (`src/app/providers.tsx`). Test pattern worth keeping: `src/test/trpcTestFetch.ts` serves the SPA's batch link through the real `fetchRequestHandler` + router in-process, so jsdom component tests exercise the actual wire path (link → adapter → router → Zod) with no mocked API shapes. For TASK-024: tRPC error responses include stack traces unless `NODE_ENV=production` — verify workerd sets it (INS-021), and the health chip renders in production builds unless gated (INS-020).

## 2026-07-06 — SPA routing migrated to TanStack Router (TASK-022)

react-router v8 removed; the `/app/*` island now uses TanStack Router with file-based routes in `src/app/routes/` and `basepath: '/app'` (`src/app/router.tsx` factory so tests inject memory history). The RES-002 risk didn't materialize: `@tanstack/router-plugin` runs fine in Astro's `vite.plugins` — codegen works under both `astro dev` and `astro build` (user vite plugins run before integration-injected ones, satisfying the before-React ordering rule). `routeTree.gen.ts` is committed because `bun run build` runs `tsc -b` before Astro regenerates it. **Gotchas:** `HistoryState` augmentation must target `@tanstack/history`, which bun stores unresolvably in `.bun/` — it's now an explicit dep pinned to react-router's exact version; jsdom logs "Not implemented: scrollTo" on every TanStack navigation, stubbed in `src/test/setup.ts`. Page tests now render the real route tree (`src/test/renderRoute.tsx`), so they must seed a profile past the onboarding gate.

## 2026-07-06 — Astro shell landed: React app is now an island under /app/* (TASK-021)

First EPIC-013 migration slice: the Vite SPA became an Astro 7 app — Astro serves a barebones landing at `/`, and `src/pages/app/[...path].astro` mounts the untouched React app (`src/app/AppShell.tsx`, `BrowserRouter basename="/app"`) with `client:only="react"`. React practice pages moved `src/pages/` → `src/app/pages/` because Astro owns `src/pages/`. Build targets Workers (`@astrojs/cloudflare`, `output: 'server'`); `check` composition unchanged (apps/web build is now `astro build`; Vitest gets its own `vitest.config.ts`). **Gotcha:** the adapter runs dev-server SSR inside workerd — without `nodejs_compat` in `wrangler.jsonc` every route 500s with `process is not defined`, and Astro's logger crashes trying to report the real error. Also: Astro 7 is current — RES-002's `stale_when` (written against Astro 5 docs) has tripped; filed INS-017.

## 2026-07-06 — ADR-006 accepted; migration is next work (grill session, NOTE-005)

Owner grill resolved ADR-006's three open questions (operational commitment: yes, migrate while the app is small; Railway: deliberate; landing page: barebones) — ADR accepted, TASK-020 done, TASK-021 chain unblocked and owner-directed ahead of TASK-014/015. Same session confirmed the sweep's queued decisions: TASK-035 e2e suite sequenced after the migration as a separate `check:e2e` (the gate stays fast); claim-time epic flip stands; triage gains a confirm-then-ship accept-via-process-edit path; independent review gets standing spawn authorization with logged self-review as the degraded fallback (INS-015); dashboard trends stay gated on EPIC-010 machine scores (INS-016). Also fixed en route: `architecture/overview.md`'s current-state paragraph had missed TASK-019 (dashboard done).

## 2026-07-06 — knowledge maintenance sweep (TASK-030)

First full sweep: inbox of 8 new insights triaged (INS-009 accepted → TASK-035 Playwright e2e smoke; INS-012 accepted → dev-loop now flips a `backlog` epic to `in-progress` at claim time; the rest deferred with triggers — INS-015/016 carry recorded owner grill questions), ISSUE-002 reproduced in-browser and confirmed (focus drops to `body` on both runner and onboarding view swaps — app-wide). RES-008's tripped `stale_when` resolved with a staleness section; all other research conditions checked, none tripped. Index lint clean after removing ADR-006 from the known-ID-gaps line (TASK-020 filled it); wiki lint clean. Drift fixed: triage.md's defer wording now matches work/README's `deferred` status vocabulary; EPIC-013's "ADR-006 when written" de-staled.

## 2026-07-06 — dashboard v1 shipped; EPIC-012 complete (TASK-019)

`/` replaced the leftover fretboard-demo stub with the product's front door: today's plan (via the new shared `planner/useTodayPlan` hook, so dashboard and `/practice` render the same persisted plan), streak and minutes-this-week from the new pure `apps/web/src/dashboard/` derivation module, per-area needs-attention callouts (same latest-grade rule as the planner), and a location-state Start handoff into the runner (consumed once so refresh/back doesn't restart the lesson). The onboard → plan → practice → history → dashboard vertical slice is now closed end to end.

## 2026-07-06 — ADR-006 written: Astro/Workers hybrid platform target (TASK-020)

The EPIC-013 platform decision is now recorded: Astro on Cloudflare Workers (not Pages), the React app as a `client:only` SPA island under `/app/*`, TanStack Router scoped inside it, tRPC on an Astro catch-all route with one shared React Query client, and Hyperdrive → Railway Postgres gated behind TASK-025. Once accepted it supersedes ADR-002's "no backend" assumption while keeping its local-first UX. Status `proposed` — owner acceptance is a deferred grill (three open questions in the ADR), and TASK-021+ implementation waits on it.

## 2026-07-06 — work-status report process added (TASK-034)

Added a read-only status report process and `bun run --cwd codebase work:status` facts command. The command derives active/proposed/blocked work, inbox counts, ready backlog, shipped-since-heartbeat, cadence flags, and repo hygiene from frontmatter and git. Work lifecycle vocabulary now has structured `deferred`, `gated`, and `proposed` states for the report to query.

## 2026-07-06 — adaptive daily planner shipped; EPIC-011 complete (TASK-017)

`apps/web/src/planner/generatePlan` now turns the local profile, lesson pack, session history, and date into a deterministic daily plan with human-readable reasons. Plans persist per local date in the versioned `daily-plans` store so refreshes do not reshuffle; completion state still comes from `PracticeSession` records. `/practice` now has the thinnest zero-tension loop: see today's plan, start a planned lesson, self-grade it, and see the item tick done.

## 2026-07-06 — local practice profile and first-run onboarding shipped (TASK-016)

The EPIC-011 planner now has a local `PracticeProfile` contract: self-assessed levels per area, ordered goal areas, minutes per day, and onboarding timestamp in the typed `profile` store. No stored profile means onboarding has never run; the App gates every route behind the skippable wizard, and `/profile` edits the same fields later. Skip defaults intentionally bias toward the shipped lesson pack (`scales`, `arpeggios`, 20 min/day) so the next planner task always has schedulable inputs.

## 2026-07-06 — practice runner ships the first persisted user data; persist-in-effect gotcha (TASK-013)

The guided runner (EPIC-008 complete) writes `PracticeSession` records to the new `sessions` store — the first real user data, and the contract EPIC-011/012 build on. Gotcha caught by both review agents: persisting from the grade *handler* by re-running the reducer against closure state desyncs from committed state when two dispatches land in one batch (rapid double-click persisted one grade while the UI advanced two). Persistence belongs in a `useEffect` synced on the reducer state — localStorage is external synchronization, and the effect always sees what React actually committed.

## 2026-07-06 — AGENTS.md made canonical, CLAUDE.md now a symlink; index lint added (NOTE-003)

Grill session resolved INS-006's index drift: `AGENTS.md` is the single agent index (merged from the newer CLAUDE.md content plus the missing `testing-strategy`/`product-practices` rows) and `CLAUDE.md` is a symlink to it. `processes/knowledge-maintenance.md` step 9 became a deterministic index lint (symlink intact, process table bidirectionally complete, cited paths exist, ID sequences gap-free — known never-created gaps: ADR-006, RES-001). Enforcement is sweep-only by owner decision; inter-sweep drift is accepted.

## 2026-07-06 — first lesson pack shipped; displayAccidentals hoisted into the theory package (TASK-012)

The v1 scales & arpeggios curriculum (10 lessons / 42 exercises) landed as typed data in `apps/web/src/content/lessons.ts`, browsable on the Practice page. En route, review caught `withAccidentals` duplicating `components/notation.ts`'s `displayAccidentals`; since content may not import components, the helper moved to `@jazz-master/theory` (pure string fn, both layers already depend on theory) and `components/notation.ts` is gone — import `displayAccidentals` from the package.

## 2026-07-06 — grill loop adopted as the owner's primary interface (ADR-008, NOTE-001)

Owner-directed, designed live in a grill session about grilling itself (NOTE-001). RES-004's critique-skill concept reversed direction — the agent questions the owner, one question at a time, as a comprehension-and-ownership mechanism — and was promoted from checkpoint to primary interface: grill → agents work → feedback → grilled again. Canonical playbook `processes/grilling.md`, thin trigger `.claude/skills/grill-me/`. Supersedes RES-004 recs 1/4 and its auto-triggering caution (location; non-mutating — grill decisions now write back to the live artifact in-session, a recorded exception to the notes pipeline). Judgment-carrying artifact creation (epics, product tasks, ADRs, strategy proposals, triage promotions) now always grills, inline or deferred into confirmation batches. Exam grill ~monthly is the built-in success metric and kill criterion.

## 2026-07-06 — wiki/ derived-knowledge layer added (ADR-007, TASK-032)

Owner-directed adoption of Karpathy's LLM-Wiki pattern from RES-003, overriding its "no parallel wiki/" recommendation with a derived-only design: `wiki/` pages synthesize and cite canonical docs (canonical wins conflicts), `index.md`/`log.md` navigate and audit it, and the ops live in `processes/wiki-maintenance.md`. Triggers wired into dev-loop Record, deep-research feed-forward, the heartbeat cadence table, and the knowledge-maintenance sweep (new wiki-lint step). Seeded with product overview, project overview, and lifecycle-of-a-change pages. RES-003's `stale_when` tripped by this adoption; resolved via its Outcome addendum. ADR-006 remains reserved for the Astro/Workers decision (TASK-020) — the wiki ADR is ADR-007.

## 2026-07-06 - QA/testing strategy research distilled (TASK-006)

Added RES-012 and `processes/testing-strategy.md`, defining the repo's unit/component/page/e2e/manual QA coverage rules. QA product review now uses explicit charters plus console/network, responsive, accessibility, persistence, and edge-state sweeps. Playwright e2e and automated axe checks were deferred into INS-009/INS-010 with concrete triggers instead of added before a real practice workflow exists.

## 2026-07-06 — development practices research distilled (TASK-005)

Added RES-010 and `processes/development-practices.md`, grounding React 19/TypeScript/Vite/Tailwind/Bun conventions in cited sources plus RES-005. Code review now runs explicit Spec and Standards passes; CLAUDE.md routes implementation work to the new practices doc. No app code changed.

## 2026-07-09 — session history moved to Clerk/Postgres (TASK-067)

Practice sessions, exercise grades, machine score summaries, and per-note score
details now persist through protected tRPC and normalized Postgres tables keyed
by Clerk user ID. The runner upserts progress after each committed grade;
History, Dashboard, and the current planner read session history through
`sessions.list`; browser backup/import no longer carries session history. Gotcha:
the Playwright smoke pack still targets the pre-Clerk local onboarding flow and
needs a follow-up before it can verify signed-in practice flows end to end.

## 2026-07-06 — persistence layer shipped (TASK-008); EPIC-001 (foundation) complete

`defineStore<T>` typed localStorage stores in `apps/web/src/storage/` — versioned `{ version, data }` envelope, migration hook, never-throw reads (corrupt/missing/version-ahead → default + warn). Convention set: no direct `localStorage` outside `src/storage/`. Review gotcha: after an `'x' in value` narrowing, strict TS rejects casting to an unrelated shape — narrow on each key (`'version' in value`) instead of `value as { version: unknown }`. Foundation epic is done; the guided-practice slice (TASK-011/016) and EPIC-013 platform track are unblocked.

## 2026-07-05 — monorepo restructure shipped (TASK-027); no root package.json

Code moved to `codebase/` (apps/web + packages/theory as `@jazz-master/theory`, project references, single Vitest `projects` config). All 37 files moved with `git mv`; 210 tests unchanged. Owner overrode ADR-005's root-shim: the repo root has **no** `package.json` — commands run via `bun run --cwd codebase <script>` (ADR-005 amended in place). Gotchas: Bun's `--filter` needs a `./`-prefixed path glob (`--filter './apps/*'`), and `bun --cwd codebase run x` parses wrong — it's `bun run --cwd codebase x`. Bun 1.3 installs workspaces isolated (per-workspace `node_modules` symlinks), so `@types/node` is only visible where declared.

## 2026-07-05 — ADR-005 accepted: codebase/ split + Bun workspaces (EPIC-013 created)

Owner decided the product grows into multiple apps (doc creation, presentations, CLIs). ADR-005 records the target: knowledge stays at the repo root, all code moves under `codebase/` as a Bun-workspaces monorepo (`apps/web`, `packages/theory`), root `package.json` becomes a delegating shim so `bun run check` at the root stays THE gate. Package extraction gated on a second consumer or purity (`ui`/`storage`/`config` deferred with triggers). EPIC-013 created and adopted the orphaned platform tasks TASK-020–025; the Astro/Workers ADR (TASK-020) renumbered to ADR-006; the physical restructure is TASK-027, sequenced after TASK-004 completes and before the Astro shell (TASK-021).

## 2026-07-05 — RES-008/RES-009 fed forward into processes

Owner-directed research incorporation. From RES-008: problem-framing gate in triage, `## Problem brief` in the task template, measurable-aim preference in prioritization, baseline/target capture in QA review filing, and measurable-aim restatement in the dev-loop Plan step; remaining scope (product-practices.md, further research decision) stays with TASK-007. From RES-009: artifact-creation gained concrete design defaults, a mandatory rendered-QA verification loop, framework-avoidance and reveal.js boundaries, and a deferred trigger to extract a `visual-artifacts` skill at the next artifact request.

## 2026-07-05 — product direction expanded: guided-practice flow

Owner-directed strategy update (VIS-001, goals.md): the product's core promise is now a zero-tension guided flow — daily plan → guided lesson with notation/tabs → optional recording + scoring → history/dashboard. Recording/mic analysis moved from non-goal to staged riskiest bet; notation *rendering* is in scope (editing still out); "login" stays a local profile (ADR-002 unchanged). Added EPIC-008..012 (curriculum/lessons, notation & tabs, recording & scoring, adaptive planner, dashboard & history) and TASK-008..019, including research-first tasks for the two risky areas (notation rendering, audio scoring).

## 2026-07-05 — knowledge maintenance cleaned research links

Processed the current maintenance inbox: deferred INS-001 and INS-002 with revisit triggers, accepted/resolved INS-003, removed future research-ID reservations from backlog tasks, linked `RES-008` into TASK-007, and updated the relevant epic status notes. Future backlog research tasks now assign `RES-###` only when the research file is created.

## 2026-07-05 — artifact process and process-map presentation added

Added `processes/artifact-creation.md`, `artifacts/README.md`, and a standalone HTML/CSS/JS process-map presentation under `artifacts/process-map/`. `AGENTS.md` and `architecture/overview.md` now route human-facing rendered outputs to `artifacts/` while keeping Markdown docs canonical.

## 2026-07-05 — closed-loop process docs added

Added feedback intake, prioritization, security/privacy review, and knowledge-maintenance processes. Added `notes/` for raw source material and ADR-004 to record the closed-loop product process.

## 2026-07-05 — app shell shipped (TASK-001); react-router is v8, not v7

`bun add react-router` resolved to v8.1.0 (task text assumed v7); library-mode API is unchanged, so we're on v8 — docs referencing v7 remain applicable. Gotcha fixed en route: vitest runs without `globals`, so Testing Library's auto-cleanup never registered and test renders leaked into each other's DOM; `src/test/setup.ts` now calls `afterEach(cleanup)` explicitly.

## 2026-07-05 — project bootstrapped

Vite react-ts template scaffolded with Bun; Tailwind v4 (via `@tailwindcss/vite`, no config file) and Vitest/Testing Library added; `bun run check` established as the verification gate. Knowledge system (strategy/processes/architecture/work/research) created. Note: the current Vite template ships oxlint, not ESLint.
