# Jazz Master

Web app that helps guitarists practice jazz: chord voicings, ii–V–I drills, repertoire tracking, ear training. Built by a solo owner + AI agents through the processes indexed below.

This file is the canonical agent index; `CLAUDE.md` is a symlink to it. Edit only this file.

## Knowledge map — where everything lives

| Layer | Path | What / rule |
|---|---|---|
| Strategy | `strategy/` | Vision (`VIS-001`) and current goals. **Read-only for agents.** |
| Framework | [APSS](https://github.com/flooper68/adaptive-problem-solving-systems) | External public specification for Adaptive Problem-Solving Systems; Jazz Master has not migrated to system capsules yet (ADR-013, TASK-077). |
| Processes | `processes/` | Executable playbooks — how we work (index below) |
| Architecture | `architecture/` | `overview.md` (living map), `decisions/ADR-*` (decision records), `LOG.md` (engineering log) |
| Work | `work/` | Flow items: epics, tasks, insights, issues, reviews — formats in `work/README.md` |
| Notes | `notes/` | Raw feedback, meetings, observations — processed into work, never implemented directly (one recorded exception: in-session grill write-backs, ADR-008) |
| Research | `research/` | Persisted deep-research results (`RES-*`) — check before re-researching anything |
| Wiki | `wiki/` | Derived synthesis of how the product + project work; cites canonical sources, never replaces them (ADR-007). Start at `wiki/index.md`. |
| Artifacts | `artifacts/` | Human-facing outputs: presentations, visual reports, exports. Markdown docs remain canonical. |
| Code | `codebase/` | All executable code — Bun-workspaces monorepo (`apps/*`, `packages/*`). The root has **no** `package.json`. |

`work/README.md` is the canonical map for how feedback, QA, notes, and research become actionable tasks/issues.

## Which process, when

Every file in `processes/` has a row here — that invariant is linted by `processes/knowledge-maintenance.md`.

| Situation | Process |
|---|---|
| "Do the next task" / implement anything | `processes/dev-loop.md` |
| Writing React/TypeScript/Tailwind code | `processes/development-practices.md` |
| Decide what tests a code change needs | `processes/testing-strategy.md` |
| "Do the heartbeat" — consolidate new inputs, schedule due hygiene work, recommend next | `processes/heartbeat.md` |
| "What's happening?" / status report | `processes/status-report.md` |
| "Grill me" / owner gives feedback or makes a decision-shaped call — question the owner one-at-a-time, write decisions back | `processes/grilling.md` |
| Before any push | `processes/code-review.md` + `bun run check` |
| Committing / pushing | `processes/git-workflow.md` (trunk-based, push to main) |
| Inspect the product, find problems | `processes/qa-product-review.md` |
| Compile/run the manual browser regression pack | `processes/regression-testing.md` |
| Capture raw notes, feedback, bug reports | `processes/feedback-intake.md` |
| Process the insights/issues inbox | `processes/triage.md` |
| Choose between multiple possible next items | `processes/prioritization.md` |
| Product judgment: frame problems, write product-facing tasks, choose features | `processes/product-practices.md` |
| A task needs research first | `processes/deep-research.md` → result in `research/` |
| Security/privacy-sensitive change | `processes/security-review.md` |
| Prune/lint stale knowledge and feed research forward | `processes/knowledge-maintenance.md` |
| Understand or update "how the product/project works" (`wiki/`) | `processes/wiki-maintenance.md` |
| Create a presentation, document, rendered visual, or export | `processes/artifact-creation.md` |

## Hard rules

1. **Do not invent work.** Implement what a work item specifies; discoveries become `work/insights/`, `work/issues/`, or `notes/` files, not scope creep.
2. **Never edit `strategy/`** — propose changes to the user instead.
3. **Never push a red `bun run check`.** It is THE gate: typecheck + lint + test + build.
4. Code and its tracker updates (task status, Log, criteria) ship **in the same commit**.
5. Every work item is **reviewed** (independent agent pass) and **tested** (check + the item's Verification steps) before it is **pushed**.
6. Update `architecture/` when the shape of the system changes: ADR for decisions, LOG.md for notable events.
7. **Finished work is committed and pushed — never left sitting in the working tree.** Before reporting done or ending a session, `git status --short` and `git log origin/main..HEAD` must both be empty of your entries (the shared-tree caveat in `processes/git-workflow.md` applies). Applies to knowledge-only work exactly as to code.

## Commands

All bun commands run in `codebase/` (the repo root has no `package.json`) — from the root, use `bun run --cwd codebase <script>`:

```
bun run --cwd codebase dev      # dev server
bun run --cwd codebase check    # typecheck + lint + test + build — THE verification gate
bun run --cwd codebase test     # vitest run, all workspaces (test:watch for watch mode)
```

Bun only — never npm/yarn/pnpm; use `bun add`, `bunx`. `bun install` runs in `codebase/` (single lockfile + node_modules there).

## Stack & architecture (detail: architecture/overview.md)

- Astro 7 (`@astrojs/react` + `@astrojs/cloudflare`, `output: 'server'`, Workers target; Vite underneath) · React 19 · TypeScript · Tailwind v4 (`@theme` in `apps/web/src/index.css`, wired via `vite.plugins` in `astro.config.mjs`) · Vitest + Testing Library · oxlint
- Monorepo (ADR-005): `codebase/apps/web` (this app) + `codebase/packages/theory` (`@jazz-master/theory`, consumed as `workspace:*`)
- Persistence target (ADR-012, superseding ADR-002): Clerk owns identity; `/app/*` requires sign-in; browser code talks to tRPC; server code owns Drizzle/Postgres access; Postgres is the source of truth for long-run app data. Shared client-safe contracts live in `apps/web/src/appData/`; browser product code does not persist app data locally. Existing legacy browser data is intentionally not migrated.
- Hybrid shell since TASK-021 (ADR-006, accepted 2026-07-06, EPIC-013): **Astro owns `apps/web/src/pages/`** (landing at `/`, catch-all `app/[...path].astro`); the React practice app is a client-only island under `/app/*` (`src/app/AppShell.tsx`, `client:only="react"` — never SSR practice routes). SPA routing is TanStack Router since TASK-022: file-based route files in `src/app/routes/` (never `src/pages/`), committed `routeTree.gen.ts`, `basepath: '/app'` via `src/app/router.tsx`. Typed tRPC routes live under `src/server/trpc/` and are served from `src/pages/trpc/[trpc].ts`; `dbSmoke` uses the deployed `HYPERDRIVE` binding when present and local `DATABASE_URL` only for local verification. The Clerk/Postgres migration is implemented through TASK-071; TASK-072 owns its final regression pass. Keep `nodejs_compat` in `apps/web/wrangler.jsonc` — dev SSR and database drivers run in workerd.
- `codebase/packages/theory/` — pure domain core, **zero runtime deps in its package.json, no React/DOM/Astro imports ever**, exhaustively tested (enharmonics matter: the seventh of Eb7 is Db, not C#)
- `apps/web/src/components/` (reusable UI) · `apps/web/src/app/pages/` (one per practice module) · dependency direction `app/pages → components → @jazz-master/theory`
- Tests colocated: `Foo.tsx` → `Foo.test.tsx`

## Conventions

- TypeScript everywhere; no `any` without an annotated reason
- Follow `processes/development-practices.md` for React, TypeScript, Tailwind, testing, and agent workflow standards; adopted practices there trace to `research/RES-010-development-best-practices.md` and `RES-005`
- Named exports preferred; default export only for route pages and `App`
- Music notation in code: `b`/`#` in identifiers (`Bb`, `F#`); Unicode `♭`/`♯` only in rendered UI text
- Chord qualities in code: `maj7`, `m7`, `7`, `m7b5`, `dim7` (lowercase, as guitarists write them)
- Logic lives in `codebase/packages/theory/` or plain functions/hooks; components stay thin
- React render logic stays pure/idempotent; prefer derived render data and event handlers before `useEffect`, and use Effects only for external synchronization
- Tailwind v4 tokens live in `apps/web/src/index.css` under `@theme`; keep class names complete/literal so Tailwind can detect them
- Tests verify public behavior: theory through package exports, UI through Testing Library role/label/text queries and user interactions
