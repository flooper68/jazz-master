# Count-in

Count-in (count-in.ai) is frictionless music practice, powered by AI: describe your goal, get a practice plan made for you, and play along a few minutes at a time. Guitar first, any style, any level; built around practice loops rather than reference material. The repository, the chaos-house project and the package scope still carry the working name `jazz-master`.

## Getting started

Requires [Bun](https://bun.sh).

```sh
cd codebase      # all code lives here (Bun-workspaces monorepo)
bun install
bun run dev      # start the dev server
bun run check    # typecheck + lint + test + build
```

## Signing in locally

`bun run --cwd codebase dev` runs the real Clerk test instance, so the app asks
you to sign in like production does. Copy
`codebase/apps/web/.env.development.example` to
`codebase/apps/web/.env.development` and fill in the Clerk keys; the same file
carries the shared test account (`CLERK_TEST_USER_EMAIL` /
`CLERK_TEST_USER_PASSWORD`) — a Clerk *test* user on a development instance,
deliberately public. Clerk's breach protection may refuse the password and ask
for an emailed code instead; either way you land on `/app`.

The e2e suite does not sign in at all: `PLAYWRIGHT_TEST_AUTH=1` lets a request
name its own user through the `x-jazz-master-e2e-user` header, which the
Playwright fixture adds to every same-origin request. That path is for tests —
a browser without the header is still sent to sign-in — and it is refused
outright in a production runtime.

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
example `55432`. The web runtime uses Hyperdrive's local connection, which takes
precedence over `DATABASE_URL`. For an alternate port/database also set
`CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE` to that connection
string. `wrangler.jsonc` defaults this local-only binding to the Compose database
on port 5432; migrations still use `DATABASE_URL`.

## Storybook

`bun run --cwd codebase storybook` starts the UI catalog on port 6006 and its
companion Astro preview server on 4321. The normal app build/deployment includes
it at `/_storybook/`. See [the Storybook guide](codebase/apps/web/.storybook/README.md)
for component/page coverage, isolated fixtures, controls and mobile previews.

## Stack

Astro 7 (Cloudflare Workers) · React 19 · TypeScript · Tailwind CSS v4 · tRPC · Drizzle/Postgres · Clerk · Vitest · Bun

## Repository layout

The repo holds the code and little else — since ADR-014 (2026-09-01) the
project is operated through the owner's chaos-house instance (project
`jazz-master`), where processes, work tracking, decision records, research,
and documentation live in the project wiki.

| Where | What |
|---|---|
| `codebase/` | The code — Bun workspaces: `apps/web` (the app) · `packages/theory` (pure domain core) |
| `AGENTS.md` | Contributor/agent index — start here (`CLAUDE.md` is a symlink to it) |

The pre-migration knowledge system (`processes/`, `work/`, `strategy/`, and
friends) is preserved in git history. The vision lives in the chaos-house
project's `problem` and `strategy` declarations.
