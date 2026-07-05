# Jazz Master

Web app that helps guitarists practice jazz: chord voicings, ii–V–I drills, repertoire tracking, ear training. Built by a solo owner + AI agents through the processes indexed below.

## Knowledge map — where everything lives

| Layer | Path | What / rule |
|---|---|---|
| Strategy | `strategy/` | Vision (`VIS-001`) and current goals. **Read-only for agents.** |
| Processes | `processes/` | Executable playbooks — how we work (index below) |
| Architecture | `architecture/` | `overview.md` (living map), `decisions/ADR-*` (decision records), `LOG.md` (engineering log) |
| Work | `work/` | Flow items: epics, tasks, insights, issues, reviews — formats in `work/README.md` |
| Research | `research/` | Persisted deep-research results (`RES-*`) — check before re-researching anything |

## Which process, when

| Situation | Process |
|---|---|
| "Do the next task" / implement anything | `processes/dev-loop.md` |
| Before any push | `processes/code-review.md` + `bun run check` |
| Committing / pushing | `processes/git-workflow.md` (trunk-based, push to main) |
| Inspect the product, find problems | `processes/qa-product-review.md` |
| Process the insights/issues inbox | `processes/triage.md` |
| A task needs research first | `processes/deep-research.md` → result in `research/` |

## Hard rules

1. **Do not invent work.** Implement what a work item specifies; discoveries become `work/insights/` or `work/issues/` files, not scope creep.
2. **Never edit `strategy/`** — propose changes to the user instead.
3. **Never push a red `bun run check`.** It is THE gate: typecheck + lint + test + build.
4. Code and its tracker updates (task status, Log, criteria) ship **in the same commit**.
5. Every work item is **reviewed** (independent agent pass) and **tested** (check + the item's Verification steps) before it is **pushed**.
6. Update `architecture/` when the shape of the system changes: ADR for decisions, LOG.md for notable events.

## Commands

```
bun run dev          # dev server
bun run check        # typecheck + lint + test + build — THE verification gate
bun run test         # vitest run (test:watch for watch mode)
```

Bun only — never npm/yarn/pnpm; use `bun add`, `bunx`.

## Stack & architecture (detail: architecture/overview.md)

- Vite 8 · React 19 · TypeScript · Tailwind v4 (`@theme` in `src/index.css`, no config file) · Vitest + Testing Library · oxlint
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
