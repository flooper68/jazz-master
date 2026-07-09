---
id: RES-019
title: Cloudflare options for running deployment database migrations
status: complete
created: 2026-07-09
stale_when: "Cloudflare releases a first-party one-shot job runner tied to Workers deployments, Containers becomes the project's standard runtime, Drizzle changes its migration runner materially, or Jazz Master switches from external PostgreSQL to D1."
---

# RES-019 - Cloudflare options for running deployment database migrations

## Research questions

1. Can Cloudflare Workers Builds run the existing Drizzle/PostgreSQL migration
   command before deploying the Worker?
2. Can a Worker itself run migrations against Railway Postgres through
   Hyperdrive?
3. Do Cron Triggers, Queues, or Workflows provide a safer migration job runner?
4. Are Cloudflare Containers a practical replacement for the current Railway
   migration service?
5. Should Jazz Master move deployment migrations from Railway to Cloudflare now?

## Findings

### 1. Workers Builds can run migrations, but only by reintroducing a Cloudflare build secret

Cloudflare Workers Builds runs an optional build command followed by a deploy
command on each pushed commit to the connected Git repository [1]. The build
settings support build-only variables and secrets: they are available to the
build, not to Worker runtime code [1]. That means Jazz Master could put
`DATABASE_URL` in Workers Builds as a build secret and change the build command
back to something like:

```sh
cd ../.. && bun install --frozen-lockfile && bun run db:migrate && bun run check
```

This is technically viable and probably the least code. It is also the exact
credential-boundary trade-off TASK-060 moved away from: Cloudflare would again
hold the deployment database URL, and build failure would block deploys.

Workers Deploy Hooks can trigger a build manually or from another system, but
the hook URL itself is a credential: Cloudflare documents that no
Authorization header is needed and anyone with the URL can trigger builds [2].
Deploy Hooks are therefore useful for triggering the build pipeline, not for
adding a safer migration primitive.

### 2. Workers can talk to Postgres through Hyperdrive, but runtime migrations are a custom app

Cloudflare's Hyperdrive Drizzle example supports PostgreSQL from Workers using
`nodejs_compat`, a Hyperdrive binding, `pg`, and `drizzle-orm/node-postgres`
[3]. The same example's Drizzle Kit migration section still uses a direct
`DATABASE_URL` in a local `.env` for `drizzle-kit migrate` [3]. In other words,
Hyperdrive is a runtime database connection layer; it is not a first-party
deployment migration runner for external Postgres.

Running migrations from a Worker is possible only as custom code: bundle the
committed SQL migrations or a Drizzle migrator into a Worker, expose a protected
admin endpoint or service binding, connect through Hyperdrive, acquire a
database-level lock, apply unapplied migrations, and report status. That keeps
the database credential in Cloudflare runtime bindings instead of build
secrets, but it adds an operational surface that the product app does not
otherwise need.

This path must not run on ordinary request paths. Workers HTTP invocations have
no hard wall-clock limit while the client stays connected, but work may be
canceled after the response completes or the client disconnects unless it fits
inside `ctx.waitUntil()`, which extends execution only up to 30 seconds [4].
Cron, Queue, and Durable Object alarm handlers have a 15-minute wall-time limit
[4]. That is enough for small migrations, but it is the wrong failure mode for
schema changes unless the trigger, lock, retry, and observability story is
deliberately designed.

### 3. Cron Triggers and Queues are wrappers, not deploy-time migration orchestration

Cron Triggers run Workers on a schedule using a `scheduled()` handler [5].
They are good for periodic maintenance jobs, and Cloudflare records recent
Cron events in the dashboard [5]. They do not naturally mean "run exactly once
after this deploy." Using cron for migrations would either poll for unapplied
migrations or run a migration check periodically, which is unnecessary drift
from the current one-shot deployment model.

Queues provide guaranteed delivery, batching, retries, and delayed messages
[6]. A Queue could carry a "run migration" message to a consumer, but that only
moves the trigger problem: some trusted producer still has to enqueue exactly
one message at the right time, and the consumer still needs migration code,
locking, credentials, and observability.

Workflows are stronger than Cron or Queues for orchestration. They provide
durable multi-step execution, retries, persisted state, status inspection, and
can be triggered from Workers, schedules, REST API, or Wrangler [7][8]. Worker
platform limits also state Workflow steps have unlimited wall time, subject to
CPU limits [4]. This makes Workflows the best Cloudflare-native fit if Jazz
Master ever needs an audited, retryable, multi-step migration flow with manual
approval or status polling. For today's simple Drizzle SQL migrations, it is
more machinery than the problem requires.

### 4. Containers can run the existing migration app shape, but they are paid-plan orchestration

Cloudflare Containers run container images as part of Workers apps and are
available on Workers Paid plans [9]. They are designed for code that needs a
full filesystem, specific runtime, Linux-like environment, or existing
container image [9]. Containers can execute commands inside a running container
via `exec()` [10], and Cloudflare documents a Cron Container pattern where a
scheduled Worker starts a container [11].

This is the closest Cloudflare product to the current `apps/migration`
Dockerfile model. A migration Worker could start a container built from the
existing migration app and run `bun run start`. However, the surrounding system
would be new: a Worker, a Durable Object-backed container binding, container
deployment, paid-plan limits, runtime secrets, start/exit/status handling, and
probably an admin trigger. That is not simpler than the current Railway
one-shot service.

### 5. D1 migrations are first-party, but only if the database changes to D1

Cloudflare D1 has first-party SQL migration support through Wrangler: create,
list unapplied, and apply migrations, with migrations tracked in the
`d1_migrations` table [12]. D1 also supports custom migration directories and
glob patterns for ORM layouts such as Drizzle [12].

This does not help the current Railway/PostgreSQL architecture. It becomes
relevant only if Jazz Master deliberately changes the server database from
external Postgres to Cloudflare D1/SQLite, which would be a separate
architecture decision with product and SQL-dialect consequences.

## Recommendations

1. Keep the current Railway migration service for now. It is the simplest
   deploy-time runner that matches the existing `apps/migration` Bun/Docker
   package, exits after applying committed Drizzle migrations, and preserves
   the current boundary that Cloudflare Workers Builds and the app Worker do
   not receive `DATABASE_URL`.
2. If the owner wants to eliminate the Railway migration service with minimal
   engineering, the pragmatic Cloudflare alternative is Workers Builds with a
   build-only `DATABASE_URL` secret and `bun run db:migrate` before `bun run
   check`. This is mechanically simple but reverses TASK-060's credential
   separation.
3. If the owner wants migrations entirely inside Cloudflare runtime rather than
   build secrets, choose a dedicated migration Worker or Workflow, not the
   product request path. Require: admin-only trigger, database advisory lock or
   equivalent, idempotent migration application, clear status/logging, and a
   rollback/failure policy. Prefer Workflows if durable status/retry/approval
   matters.
4. Do not use Cron Triggers as the default migration mechanism. They are useful
   for recurring maintenance; schema migrations should be tied to deploy intent.
5. Do not switch to Cloudflare Containers for this alone. Reconsider only if
   the project already adopts Containers for another reason, or if preserving a
   Dockerized migration binary inside Cloudflare becomes more valuable than
   operational simplicity.
6. Do not use D1 migrations as a drop-in replacement for Postgres migrations.
   D1 is an alternative database choice, not a way to migrate Railway Postgres.

No immediate Jazz Master task is recommended from this research. The current
architecture already documents the Railway migration service and the Cloudflare
credential boundary. Revisit only if the owner chooses "all deployment
operations must live on Cloudflare" or wants to trade that boundary for a
simpler build-step migration.

## Sources

[1] Cloudflare Workers Builds: Configuration -
https://developers.cloudflare.com/workers/ci-cd/builds/configuration/
(updated 2026-07-03, accessed 2026-07-09).

[2] Cloudflare Workers Builds: Deploy Hooks -
https://developers.cloudflare.com/workers/ci-cd/builds/deploy-hooks/
(updated 2026-04-23, accessed 2026-07-09).

[3] Cloudflare Hyperdrive Drizzle ORM example -
https://developers.cloudflare.com/hyperdrive/examples/connect-to-postgres/postgres-drivers-and-libraries/drizzle-orm/
(updated 2026-04-21, accessed 2026-07-09).

[4] Cloudflare Workers limits -
https://developers.cloudflare.com/workers/platform/limits/ (accessed
2026-07-09).

[5] Cloudflare Workers Cron Triggers -
https://developers.cloudflare.com/workers/configuration/cron-triggers/
(updated 2026-06-20, accessed 2026-07-09).

[6] Cloudflare Queues overview - https://developers.cloudflare.com/queues/
(updated 2026-04-21, accessed 2026-07-09).

[7] Cloudflare Workflows overview - https://developers.cloudflare.com/workflows/
(updated 2026-06-02, accessed 2026-07-09).

[8] Cloudflare Workflows: Trigger Workflows -
https://developers.cloudflare.com/workflows/build/trigger-workflows/ (updated
2026-06-15, accessed 2026-07-09).

[9] Cloudflare Containers overview -
https://developers.cloudflare.com/containers/ (updated 2026-06-08, accessed
2026-07-09).

[10] Cloudflare Containers: Execute commands -
https://developers.cloudflare.com/containers/execute-commands/ (updated
2026-06-26, accessed 2026-07-09).

[11] Cloudflare Containers: Cron Container -
https://developers.cloudflare.com/containers/examples/cron/ (updated
2026-04-21, accessed 2026-07-09).

[12] Cloudflare D1 migrations -
https://developers.cloudflare.com/d1/reference/migrations/ (updated
2026-06-08, accessed 2026-07-09).
