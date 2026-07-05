# Jazz Master

A web app that helps guitarists practice jazz — chord voicings, ii–V–I drills in all twelve keys, repertoire tracking, and ear training. Guitar-first, local-first, built around practice loops rather than reference charts.

## Getting started

Requires [Bun](https://bun.sh).

```sh
bun install
bun run dev      # start the dev server
bun run check    # typecheck + lint + test + build
```

## Stack

React 19 · TypeScript · Vite 8 · Tailwind CSS v4 · Vitest · Bun

## Repository layout

The repo carries its own knowledge system — the project is developed by a human owner plus AI agents, and everything they need lives in versioned markdown:

| Where | What |
|---|---|
| `strategy/` | Vision and goals — why we build |
| `processes/` | Playbooks: dev loop, code review, git workflow, QA/product review, triage, deep research |
| `architecture/` | System overview, ADRs, engineering log |
| `work/` | Epics, tasks, insights inbox, issues, QA reports ([formats](work/README.md)) |
| `research/` | Persisted deep-research results feeding the docs above |
| `src/` | The app: `theory/` (pure domain core) · `components/` · `pages/` |
| `CLAUDE.md` | The index — start here (agents do) |

Start with the vision: [`strategy/VIS-001-jazz-master.md`](strategy/VIS-001-jazz-master.md).
