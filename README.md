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

## Local Postgres

Server-side database work uses a local PostgreSQL service for development. It is
optional for the current app: `bun run --cwd codebase dev` and
`bun run --cwd codebase check` must pass with Docker stopped.

```sh
docker compose up -d
docker compose ps
psql "postgres://jazz_master:jazz_master@127.0.0.1:5432/jazz_master" -c 'select 1;'
docker compose down       # stop and remove the container; keep the named volume
docker compose up -d      # start again with the same data
docker compose down --volumes  # intentional reset: removes local Postgres data
```

The local connection convention is documented in `.env.example`:

```sh
JAZZ_MASTER_POSTGRES_PORT=5432
DATABASE_URL=postgresql://jazz_master:jazz_master@127.0.0.1:5432/jazz_master
```

If another local service already owns port 5432, set `JAZZ_MASTER_POSTGRES_PORT`
before running Compose and use the same port in `DATABASE_URL`/`psql`, for
example `55432`.

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
| `AGENTS.md` | Agent index — start here (`CLAUDE.md` is a symlink to it) |

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
