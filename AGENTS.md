# Count-in — contributor guide

An index. Count-in (count-in.ai; working name and repository: Jazz Master)
is frictionless music practice, powered by AI — describe your goal, get a
plan made for you, play along a few minutes at a time; guitar first, any
style, any level — built by a solo owner + AI agents. The brand (mark,
colour, type, voice) is documented in Storybook under Foundations / Brand. This file tells you how work runs and where everything
else lives; it deliberately holds no conventions, no architecture, and no
process detail, so there is a single surface to update when any of those
change. `CLAUDE.md` is a symlink to this file — edit this one, never the
link.

## How work runs here (chaos-house)

The operating model lives in **chaos-house**, the owner's self-hosted APS
orchestrator, as the project **`jazz-master`** (task key `JM`, ADR-014). The
project is declared by five wiki pages — `problem`, `strategy`,
`verification`, `process`, `current-state` — and in one breath:

- **Tasks** (`JM-n`) are bounded units of work on the board — the only things
  a development session implements.
- **Streams** (`feedback`, `insights`, `issues`) collect observations,
  faithfully captured and never implemented directly; grooming decides what
  each becomes.
- **Work happens in sessions.** `start_session` returns the process to follow,
  pinned — it carries the conventions and checks for that kind of work, which
  is why this file does not repeat them. All session types are manual for now.
- Durable knowledge lives in the **project wiki**; the timeline holds the
  operational history. Direction — the `problem`/`strategy` declarations —
  changes only with the owner in session.

**An interactive session with the owner:** read
`processes/interactive-sessions.md` in the project wiki before doing real
work — start a session first, announce its id, bind every approved action,
and close it only on the owner's go. **Editing code without a session?**
Don't, beyond a trivial fix — the conventions live in
`processes/development.md` and its reference pages.

## Where everything lives

Everything below is in the chaos-house wiki under the `jazz-master` project.
Read a page with `read_wiki_file` (`jazz-master/<path>`), or browse
`/p/jazz-master/wiki/<path>`.

| What | Where |
|---|---|
| Vision, direction, and how work runs | the five project declarations |
| One page per session type | `processes/` (index in `process.html`) |
| Dev conventions, testing, git, review gates | `processes/development-practices.md`, `testing-strategy.md`, `git-workflow.md`, `code-review.md` |
| Architecture — the living map | `docs/architecture.md` |
| Decision records (ADR numbering continues here) | `docs/decisions/` |
| Product/project synthesis | `docs/product/`, `docs/project/` |
| Persisted research — check before re-researching | `research/` |
| Engineering log | `records/engineering-log.md` |
| Manual browser regression pack | `processes/regression-pack.md` |

The repo itself keeps only this file, a `README.md` that says how to run the
app, and the code. The pre-migration knowledge system is preserved in git
history (up to `d898dd5`).

## Code

All executable code is in `codebase/` — a Bun-workspaces monorepo
(`apps/web` + `packages/theory`); the repo root has no `package.json`.
Bun only — never npm/yarn/pnpm. From the repo root:

```
bun run --cwd codebase dev      # dev server
bun run --cwd codebase check    # typecheck + lint + test + build — THE gate
bun run --cwd codebase test     # vitest run, all workspaces
```

Hard floor even outside a session: never push a red `bun run check`; pushes
are trunk-based to `main`; finished work is committed and pushed, never left
in the working tree; do not invent work — discoveries become stream records.

## Reaching chaos-house

The one thing that cannot live in the wiki is how to reach it. The server
runs over the tailnet at `http://100.121.4.25:4321` — use the chaos-house
MCP tools, or `bun chaos` from `~/dev/chaos-house` with that as `CHAOS_URL`.
