# Jazz Master Web App

## Clerk authentication

The Astro app uses `@clerk/astro` middleware for authentication. `/` is public;
`/app/*` requires a signed-in Clerk user, and protected tRPC procedures read the
Clerk user ID from Astro locals.

Required local `.env` values:

```sh
PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

The local runtime fails on startup requests when either value is missing so
Clerk keyless development mode is not used.

Required production Worker secrets/bindings:

```sh
PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
```

`dbSmoke` remains a public smoke-only database verification procedure during the
Clerk/Postgres foundation work. It should be removed once real protected
app-data procedures replace smoke-only DB verification.
