# Drizzle migrations

Generated SQL migrations for the web app live in this package so the Railway
migration service can deploy from `codebase/apps/migration` without needing the
full monorepo at runtime.

Generate migrations from the repository root with a local `DATABASE_URL`:

```sh
DATABASE_URL=postgresql://jazz_master:jazz_master@127.0.0.1:5432/jazz_master bun run --cwd codebase db:generate
```

`drizzle-kit push` is not the project default. Commit generated SQL migrations
when schema changes require them.

Applying migrations is owned by `apps/migration`:

```sh
DATABASE_URL=postgresql://jazz_master:jazz_master@127.0.0.1:5432/jazz_master bun run --cwd codebase db:migrate
```
