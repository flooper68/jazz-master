# Engineering log

Chronological, append-only. One short entry per notable event: migrations, dead ends, gotchas, incidents, decisions too small for an ADR. Newest at the top.

---

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
