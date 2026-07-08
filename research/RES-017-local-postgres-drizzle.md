---
id: RES-017
title: Local PostgreSQL, psql, Drizzle ORM, and migrations
status: complete
created: 2026-07-08
stale_when: "Drizzle reaches a stable 1.0 with migration workflow changes, Cloudflare Workers database driver guidance changes materially, or this project chooses a non-PostgreSQL server store."
---

# RES-017 - Local PostgreSQL, psql, Drizzle ORM, and migrations

## Research questions

1. What local PostgreSQL setup should Jazz Master use for development?
2. How should `psql` fit into verification and developer ergonomics?
3. How should Drizzle ORM and Drizzle Kit be introduced in the Bun workspace?
4. Should this work include production database, Railway, or Hyperdrive setup?
5. What work items should replace the old gated database tasks?

## Findings

### 1. Local PostgreSQL should be a repo-owned Compose service

The official Postgres image supports Docker Compose usage directly and creates
the default database/user via its entrypoint on first initialization [1]. The
image requires `POSTGRES_PASSWORD`; `POSTGRES_USER` optionally creates the named
superuser and same-named database [2].

Docker Compose named volumes are the right persistence primitive: Compose
documents volumes as persistent data stores and creates top-level named volumes
when they do not already exist [3]. The service should mount the volume at
Postgres' data directory so `docker compose down` preserves local data; the
reset path should be explicit (`docker compose down --volumes`).

Bind the port to localhost, not every network interface. Docker's Compose
reference says short port syntax defaults to all interfaces when no host IP is
given and explicitly warns that omitting `127.0.0.1` can expose the container
directly to the internet on a public host [4]. Use a mapping such as
`"127.0.0.1:5432:5432"`.

### 2. `psql` is the smoke-test and inspection tool

PostgreSQL's `psql` accepts a connection string via `-d`, and connection-string
parameters override conflicting command-line options [5]. It also supports
`-c`/`--command` for one-shot SQL execution, which is enough for repeatable
smoke checks like `SELECT 1` [6].

For this repo, verification should use a direct local connection string, for
example:

```sh
psql "postgres://jazz_master:jazz_master@127.0.0.1:5432/jazz_master" -c 'select 1;'
```

This keeps the database check independent from the app and avoids requiring any
production credentials.

### 3. Drizzle should be introduced as schema/migration infrastructure before product tables

Drizzle's PostgreSQL guide supports the `node-postgres` and `postgres.js`
drivers and shows `drizzle-orm/node-postgres` with a `DATABASE_URL` connection
string [7]. Cloudflare's Hyperdrive example for Workers also shows Drizzle with
the `pg` driver, `nodejs_compat`, and an eventual Hyperdrive connection string;
it notes that both `node-postgres` and `Postgres.js` are supported [8].

Use `pg` first. The project already has a Workers target with `nodejs_compat`,
and Cloudflare's current Drizzle example uses `pg`. The app should still keep
database access behind server-side tRPC/context code. React and shared theory
code must not import Drizzle or database clients.

Drizzle Kit's config file is a TypeScript/JavaScript file that declares
`dialect`, `schema`, and `out` [9]. For this monorepo, place the config under
`codebase/apps/web/drizzle.config.ts`, with schema under
`codebase/apps/web/src/server/db/schema.ts` and migrations under
`codebase/apps/web/drizzle/`.

Use migration files, not `push`, as the project default. Drizzle Kit `generate`
creates SQL migrations by diffing schema snapshots against previous migrations
[10]. `migrate` reads SQL migration files, checks the Drizzle migrations log
table, runs unapplied migrations, and logs them [11]. `push` skips SQL-file
generation and applies diffs directly to the database [12], which is convenient
for throwaway local iteration but a worse default for an agent-maintained repo
that needs auditable commits.

### 4. Production infrastructure should leave EPIC-013 scope

The owner now owns production infrastructure setup. The repo still needs code
that can consume a future server-side database binding, but tasks should not ask
agents to provision Railway, create Hyperdrive configs, manage Cloudflare
dashboard state, or verify live production database health.

This supersedes the old shape of TASK-025. Keep any future production binding
work as an owner-provided input or a small integration task after credentials
and binding names exist.

## Recommendations

1. Replace TASK-028 with an ungated local database task:
   `docker-compose.yaml` at the repository root, one `postgres` service pinned
   to PostgreSQL 18 or the owner-confirmed production major, named volume,
   localhost-only port, healthcheck using `pg_isready`, `.env.example`, and
   docs with `psql` smoke/reset commands.
2. Abandon or rewrite TASK-025 so agents no longer own Railway/Hyperdrive
   provisioning. The future agent-owned scope should be "wire the app to an
   already-provided database binding/connection string", not "set up production
   infra".
3. Add a Drizzle foundation task for `drizzle-orm`, `drizzle-kit`, `pg`,
   `@types/pg`, `drizzle.config.ts`, schema/migration directories, and scripts
   such as `db:generate`, `db:migrate`, `db:studio` if useful.
4. Add a tiny server DB smoke task after the foundation: a server-only tRPC
   procedure can run `select 1` through Drizzle against local Postgres during
   development. It must not affect the local-first practice stores or require
   Docker for `bun run check`.
5. Keep product persistence as a separate future task. Do not move profile,
   sessions, score metadata, or planner state to Postgres as part of the
   infrastructure setup.

## Sources

[1] Postgres Official Image, Docker Hub - https://hub.docker.com/_/postgres
(accessed 2026-07-08).

[2] Postgres Official Image: Environment Variables, Docker Hub -
https://hub.docker.com/_/postgres (accessed 2026-07-08).

[3] Docker Compose file reference: Volumes -
https://docs.docker.com/reference/compose-file/volumes/ (accessed 2026-07-08).

[4] Docker Compose file reference: `ports` -
https://docs.docker.com/reference/compose-file/services/#ports (accessed
2026-07-08).

[5] PostgreSQL 18 Manual: `psql`, `-d`/connection string -
https://www.postgresql.org/docs/current/app-psql.html (accessed 2026-07-08).

[6] PostgreSQL 18 Manual: `psql`, `-c`/`--command` -
https://www.postgresql.org/docs/current/app-psql.html (accessed 2026-07-08).

[7] Drizzle ORM PostgreSQL guide -
https://orm.drizzle.team/docs/get-started/postgresql-new (accessed
2026-07-08).

[8] Cloudflare Hyperdrive Drizzle ORM example -
https://developers.cloudflare.com/hyperdrive/examples/connect-to-postgres/postgres-drivers-and-libraries/drizzle-orm/
(updated 2026-04-21, accessed 2026-07-08).

[9] Drizzle Kit configuration file -
https://orm.drizzle.team/docs/drizzle-config-file (accessed 2026-07-08).

[10] Drizzle Kit `generate` -
https://orm.drizzle.team/docs/drizzle-kit-generate (accessed 2026-07-08).

[11] Drizzle Kit `migrate` -
https://orm.drizzle.team/docs/drizzle-kit-migrate (accessed 2026-07-08).

[12] Drizzle Kit `push` - https://orm.drizzle.team/docs/drizzle-kit-push
(accessed 2026-07-08).
