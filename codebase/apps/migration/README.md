# Migration service

This workspace app runs database migrations and then exits. It is intended to be
deployed as a Railway service so the Cloudflare Worker build does not need a
database connection string.

## Railway setup

Create a Railway service from the repository as a shared Bun monorepo service:

- Root directory: `codebase`
- Start command: `bun run --cwd apps/migration start`
- Service variable: `DATABASE_URL=<deployment Postgres connection string>`
- Restart policy: `On Failure` is acceptable; `Never` is also fine for a
  deliberate one-shot migration service.

The service uses `codebase/apps/migration/drizzle.config.ts`, which points at the
web app's committed Drizzle schema and migration directory:

- schema: `apps/web/src/server/db/schema.ts`
- migrations: `apps/web/drizzle/`

Do not put the deployment connection string in the repository, Cloudflare
Workers Builds, or local shell startup files.

## Local use

From the repository root:

```sh
DATABASE_URL=postgresql://jazz_master:jazz_master@127.0.0.1:5432/jazz_master bun run --cwd codebase db:migrate
```
