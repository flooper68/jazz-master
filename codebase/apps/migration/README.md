# Migration service

This workspace app runs database migrations and then exits. It is intended to be
deployed as a Railway service so the Cloudflare Worker build does not need a
database connection string.

## Railway setup

Create a Railway service from `codebase/apps/migration` as an isolated Bun
service:

- Root directory: `codebase/apps/migration`
- Builder: Dockerfile, using `codebase/apps/migration/Dockerfile`
- Start command: leave unset to use the Dockerfile `CMD`, or set `bun run start`
- Service variable: `DATABASE_URL=<deployment Postgres connection string>`
- Restart policy: `On Failure` is acceptable; `Never` is also fine for a
  deliberate one-shot migration service.

The service uses `codebase/apps/migration/drizzle.config.ts`, which points at the
committed migration SQL metadata inside this package:

- migrations: `drizzle/`

Do not deploy this service from `codebase` or `codebase/apps/web`. Railway pulls
only the configured root directory for an isolated monorepo service, so this
package is intentionally self-contained for deploy-time migration runs. The
Dockerfile is intentional: Railway's Railpack Bun detection is not reliable
enough for this one-shot service.

Do not put the deployment connection string in the repository, Cloudflare
Workers Builds, or local shell startup files.

## Local use

From the repository root:

```sh
DATABASE_URL=postgresql://jazz_master:jazz_master@127.0.0.1:5432/jazz_master bun run --cwd codebase db:migrate
```
