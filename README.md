# Jazz Master

A web app that helps guitarists practice jazz — chord voicings, ii–V–I drills in all twelve keys, repertoire tracking, and ear training. Guitar-first, local-first, built around practice loops rather than reference charts.

## Getting started

Requires [Bun](https://bun.sh).

```sh
cd codebase      # all code lives here (Bun-workspaces monorepo)
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
| `processes/` | Playbooks: dev loop, code review, git workflow, QA/product review, feedback intake, triage, prioritization, security review, knowledge maintenance, deep research, artifact creation |
| `architecture/` | System overview, ADRs, engineering log |
| `work/` | Epics, tasks, insights inbox, issues, QA reports ([formats](work/README.md)) |
| `notes/` | Raw feedback, meetings, observations, and owner notes before they are processed into work |
| `research/` | Persisted deep-research results feeding the docs above |
| `artifacts/` | Human-facing rendered companions such as presentations, visual reports, and exports |
| `codebase/` | The code — Bun workspaces: `apps/web` (the app) · `packages/theory` (pure domain core) |
| `CLAUDE.md` / `AGENTS.md` | Agent indexes — start here |

## How inputs become work

The canonical workflow is in [`work/README.md`](work/README.md): feedback, QA findings, notes, and research become actionable `TASK-*` or `ISSUE-*` items only through the repo processes. The short version:

| Input | Process path | Output |
|---|---|---|
| Raw feedback, owner notes, observations | `feedback-intake` | `NOTE-*`, `INS-*`, `ISSUE-*`, or already-agreed `TASK-*` |
| New insights and open issues | `triage` | accepted/rejected/deferred insights, confirmed issues, and useful `TASK-*` follow-ups |
| Completed research | `deep-research` then consuming task or `knowledge-maintenance` | code/docs/process changes, `TASK-*`, ADR, defer/reject/no-action |
| Running-product review | `qa-product-review` then `triage`/`prioritization` | `REV-*` plus filed issues/insights ordered for action |
| Multiple ready candidates | `prioritization` | next actionable task or issue |
| Approved task or confirmed issue | `dev-loop` | implemented, reviewed, tested, recorded, shipped work |

Start with the vision: [`strategy/VIS-001-jazz-master.md`](strategy/VIS-001-jazz-master.md).
