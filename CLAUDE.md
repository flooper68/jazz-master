# Jazz Master

Web app that helps guitarists practice jazz: chord voicings, ii–V–I drills, repertoire tracking, ear training. Built by a solo owner + AI agents through the processes indexed below.

## Knowledge map — where everything lives

| Layer | Path | What / rule |
|---|---|---|
| Strategy | `strategy/` | Vision (`VIS-001`) and current goals. **Read-only for agents.** |
| Processes | `processes/` | Executable playbooks — how we work (index below) |
| Architecture | `architecture/` | `overview.md` (living map), `decisions/ADR-*` (decision records), `LOG.md` (engineering log) |
| Work | `work/` | Flow items: epics, tasks, insights, issues, reviews — formats in `work/README.md` |
| Notes | `notes/` | Raw feedback, meetings, observations — processed into work, never implemented directly |
| Research | `research/` | Persisted deep-research results (`RES-*`) — check before re-researching anything |
| Artifacts | `artifacts/` | Human-facing outputs: presentations, visual reports, exports. Markdown docs remain canonical. |

`work/README.md` is the canonical map for how feedback, QA, notes, and research become actionable tasks/issues.

## Which process, when

| Situation | Process |
|---|---|
| "Do the next task" / implement anything | `processes/dev-loop.md` |
| "Do the heartbeat" — consolidate new inputs, schedule due hygiene work, recommend next | `processes/heartbeat.md` |
| Before any push | `processes/code-review.md` + `bun run check` |
| Committing / pushing | `processes/git-workflow.md` (trunk-based, push to main) |
| Inspect the product, find problems | `processes/qa-product-review.md` |
| Capture raw notes, feedback, bug reports | `processes/feedback-intake.md` |
| Process the insights/issues inbox | `processes/triage.md` |
| Choose between multiple possible next items | `processes/prioritization.md` |
| A task needs research first | `processes/deep-research.md` → result in `research/` |
| Security/privacy-sensitive change | `processes/security-review.md` |
| Prune/lint stale knowledge and feed research forward | `processes/knowledge-maintenance.md` |
| Create a presentation, document, rendered visual, or export | `processes/artifact-creation.md` |

## Hard rules

1. **Do not invent work.** Implement what a work item specifies; discoveries become `work/insights/`, `work/issues/`, or `notes/` files, not scope creep.
2. **Never edit `strategy/`** — propose changes to the user instead.
3. **Never push a red `bun run check`.** It is THE gate: typecheck + lint + test + build.
4. Code and its tracker updates (task status, Log, criteria) ship **in the same commit**.
5. Every work item is **reviewed** (independent agent pass) and **tested** (check + the item's Verification steps) before it is **pushed**.
6. Update `architecture/` when the shape of the system changes: ADR for decisions, LOG.md for notable events.
7. **Finished work is committed and pushed — never left sitting in the working tree.** Before reporting done or ending a session, `git status --short` and `git log origin/main..HEAD` must both be empty (the end-of-run check in `processes/git-workflow.md`). Applies to knowledge-only work exactly as to code.

## Commands

```
bun run dev          # dev server
bun run check        # typecheck + lint + test + build — THE verification gate
bun run test         # vitest run (test:watch for watch mode)
```

Bun only — never npm/yarn/pnpm; use `bun add`, `bunx`.

## Stack & architecture (detail: architecture/overview.md)

- Vite 8 · React 19 · TypeScript · Tailwind v4 (`@theme` in `src/index.css`, no config file) · Vitest + Testing Library · oxlint
- **In migration (ADR-005, lands with TASK-027):** all code moves under `codebase/` as a Bun-workspaces monorepo — `apps/web` (this app) + `packages/theory` (`@jazz-master/theory`), root `package.json` becomes a delegating shim. Until TASK-027 ships, code lives under `src/` as described below.
- Local-first: no backend, no accounts; localStorage behind a typed wrapper (ADR-002)
- `src/theory/` — pure domain core, **no React/DOM imports ever**, exhaustively tested (enharmonics matter: the seventh of Eb7 is Db, not C#)
- `src/components/` (reusable UI) · `src/pages/` (one per practice module) · dependency direction `pages → components → theory`
- Tests colocated: `Foo.tsx` → `Foo.test.tsx`

## Conventions

- TypeScript everywhere; no `any` without an annotated reason
- Named exports preferred; default export only for route pages and `App`
- Music notation in code: `b`/`#` in identifiers (`Bb`, `F#`); Unicode `♭`/`♯` only in rendered UI text
- Chord qualities in code: `maj7`, `m7`, `7`, `m7b5`, `dim7` (lowercase, as guitarists write them)
- Logic lives in `src/theory/` or plain functions/hooks; components stay thin
