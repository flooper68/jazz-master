# Engineering log

Chronological, append-only. One short entry per notable event: migrations, dead ends, gotchas, incidents, decisions too small for an ADR. Newest at the top.

---

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
