---
id: RES-002
title: Astro on Cloudflare Workers with SPA app shell, TanStack Router, tRPC, React Query, and Hyperdrive
status: complete
task: TASK-020          # requested directly by owner; consumed by TASK-020–TASK-025 (migration slice)
created: 2026-07-05
stale_when: >
  Astro 7, TanStack Router v2, tRPC v12, or major Cloudflare Workers/Hyperdrive
  deployment changes; any decision to host the app somewhere other than
  Cloudflare Workers with Railway PostgreSQL.
---

# RES-002 — Astro on Cloudflare Workers with SPA app shell, TanStack Router, tRPC, React Query, and Hyperdrive

> **Staleness notes** (per INS-017 — verify before consuming, don't re-run the research):
>
> - **2026-07-06 (TASK-021):** the `stale_when` Astro-7 trigger has tripped — see INS-017 for what held and what didn't (`nodejs_compat` in `wrangler.jsonc` is required for dev SSR; `astro dev` daemonizes).
> - **2026-07-06 (TASK-023):** tRPC recommendations re-verified against tRPC 11.18 docs. The **fetch-adapter server shape (finding 3, rec 4) is still exact** — Astro `src/pages/trpc/[trpc].ts`, `fetchRequestHandler`, `ALL` handler. The **client-side shape in finding 3/rec 5 is superseded**: tRPC now recommends `@trpc/tanstack-react-query` (`createTRPCContext` → `TRPCProvider`/`useTRPC`, procedures consumed as `trpc.x.queryOptions()` on plain `useQuery`) over the classic `@trpc/react-query` `trpc.Provider`/`createTRPCReact` setup cited here [10]. The one-shared-`QueryClient` rule stands unchanged. TASK-023 shipped on the modern integration.
> - Still unverified against current docs: the Hyperdrive path (finding 4) — re-check when the gated TASK-025 is pulled.

## Research questions

1. Can Jazz Master use Astro for server-rendered landing/account routes while keeping the core practice app as a client-side SPA?
2. How should TanStack Router fit inside an Astro-hosted app, and what route boundary avoids framework conflict?
3. Can Astro API routes host tRPC on Cloudflare Workers, and can the React SPA consume them through React Query?
4. How should Cloudflare Workers connect to a Railway PostgreSQL database?
5. What should this project adopt, adapt, or avoid in the first migration slice?

## Findings

### 1. Hybrid Astro SSR + SPA is viable

Astro supports React through `@astrojs/react`, configured as an Astro integration, while preserving React/React DOM as normal dependencies [1]. Astro's client directives let a React component either hydrate immediately (`client:load`) or skip server rendering entirely with `client:only="react"` [2]. For the core practice app, `client:only="react"` is the best fit because the goal is an SPA rather than SSR for every practice route.

Astro's Cloudflare adapter enables on-demand rendered routes and server features on Cloudflare [3]. Current Astro Cloudflare docs also state that the adapter no longer supports Cloudflare Pages and should target Cloudflare Workers instead [4]. This matters because the desired "worker functions" model should be designed as a Workers deployment, not Pages Functions.

For this project, the clean split is:

- Astro owns public/server routes: `/`, `/sign-in`, `/pricing` if needed, auth callbacks, legal/static pages, and API endpoints.
- React SPA owns app routes under one prefix: `/app/*`.
- The SPA is rendered by an Astro catch-all page such as `src/pages/app/[...path].astro` that mounts a React `AppShell` with `client:only="react"`.

This avoids a routing collision where Astro and TanStack Router both try to own the same URL space.

### 2. TanStack Router should own only the `/app/*` route tree

TanStack Router is designed for type-safe React routing, including type-safe navigation, search params, nested/layout routes, route loaders, prefetching, and integration with external data caches like TanStack Query [5]. Its file-based route generation is normally wired through the `@tanstack/router-plugin` Vite plugin; the docs show it configured before React's Vite plugin and with `autoCodeSplitting: true` [6].

Astro exposes a `vite` config option that can add custom Vite plugins directly to an Astro project [7]. That suggests the TanStack Router Vite plugin can be installed in `astro.config.mjs` via `vite.plugins`, but this is a single-source integration inference: TanStack's docs show Vite, and Astro's docs show Vite plugin passthrough, but neither source specifically documents TanStack Router inside Astro.

The safer implementation plan is:

- Put TanStack Router routes under `src/app/routes`, not `src/pages`, so Astro file routing and TanStack file routing stay separate.
- Configure TanStack Router with a base path or route tree rooted at `/app`.
- Keep public pages in Astro's `src/pages`.
- Prototype the router-codegen step early, because Astro + TanStack Router plugin ordering is the riskiest mechanical part of the migration.

### 3. tRPC fits Astro API routes on Workers

Astro endpoints can be static or server endpoints. In SSR/on-demand mode, endpoint files can export HTTP method handlers and return `Response` objects at request time [8]. tRPC's fetch adapter docs include an Astro-specific setup using `src/pages/trpc/[trpc].ts`, `fetchRequestHandler`, and an `ALL` Astro API route handler [9].

tRPC's React setup wraps the app with a tRPC provider and a `QueryClientProvider`; the docs explicitly say that if React Query is already used, the same `QueryClient` should be reused [10]. This aligns well with a TanStack Router app because TanStack Router is designed to integrate with client-side data caches such as TanStack Query [5].

Recommended API shape:

- `src/server/trpc/context.ts`: request context, auth/session, Hyperdrive database client access.
- `src/server/trpc/router.ts`: root `appRouter`.
- `src/server/trpc/routers/*.ts`: subrouters by domain, e.g. `practice`, `repertoire`, `user`.
- `src/pages/trpc/[trpc].ts`: Astro API route using tRPC fetch adapter.
- `src/app/trpc.ts`: typed tRPC React client utilities.
- `src/app/providers.tsx`: `QueryClientProvider` + `trpc.Provider`.

### 4. Railway PostgreSQL should be reached through Cloudflare Hyperdrive

Railway PostgreSQL can be provisioned as its own service and exposes standard connection variables including `DATABASE_URL` [11]. Railway also supports external PostgreSQL connections through its TCP Proxy, which is enabled by default, with network egress billing caveats [11]. Because Cloudflare Workers run outside Railway's private network, Cloudflare-to-Railway is an external database connection.

Cloudflare Workers can connect to traditional hosted PostgreSQL databases using TCP-capable drivers, and Cloudflare recommends Hyperdrive for traditional hosted Postgres/MySQL because Worker invocations otherwise pay repeated connection setup latency [12]. Hyperdrive provides a binding whose `connectionString` is passed to `pg` or `postgres.js`; Cloudflare's examples require `nodejs_compat`, a `compatibility_date`, and a `hyperdrive` binding in `wrangler.jsonc` [13].

Important implications:

- Do not expose the Railway database URL to browser code.
- Do not connect directly from React. All database access goes through Worker-side tRPC procedures.
- Use Hyperdrive as the Cloudflare-side connection pool in front of Railway Postgres.
- Keep `wrangler.jsonc` because this project needs custom bindings; Astro can omit Wrangler config only for simple projects without bindings [4].

### 5. Local-first architecture changes

This moves the project away from the current "no backend, localStorage only" architecture. It does not require abandoning local-first behavior immediately, but it does create a server boundary. The most conservative path is:

- Keep current practice UI/client state local in the first Astro migration.
- Add tRPC endpoints as a thin backend surface, starting with health/session/user scaffolding.
- Move durable cross-device state to Postgres only when a specific task requires it.
- Keep `src/theory/` pure and framework-agnostic; both client components and server procedures can import pure theory functions, but `src/theory/` must not import Astro, React, tRPC, database code, or Workers APIs.

This should trigger an ADR when implemented because it changes the architecture from local-only SPA to hybrid SSR + Worker API + external database.

## Recommendations

1. Adopt Astro on Cloudflare Workers as the host runtime.
   Use `@astrojs/cloudflare` with `output: 'server'` and deploy to Workers, not Pages. This follows current Astro adapter guidance and supports SSR/API routes [3][4].

2. Keep the core app as an SPA under `/app/*`.
   Mount the React app through an Astro page with `client:only="react"` so Astro owns public/server-rendered pages and the React SPA owns practice workflows [1][2].

3. Replace React Router with TanStack Router only inside the SPA.
   Scope TanStack routes to `/app/*` and keep route files outside Astro's `src/pages` tree. Start with a mechanical migration from the current route table to TanStack Router before changing product behavior [5][6].

4. Use tRPC on an Astro catch-all API route.
   Implement `src/pages/trpc/[trpc].ts` with tRPC's fetch adapter and split procedures into server-side routers. Use Zod inputs at procedure boundaries [9].

5. Use one shared React Query client for tRPC and any future TanStack Router data preloading.
   Put `QueryClientProvider` and `trpc.Provider` in the SPA provider layer, and reuse the same client rather than creating multiple data caches [10].

6. Use Cloudflare Hyperdrive for Railway Postgres.
   Configure Railway Postgres external connection, create a Cloudflare Hyperdrive binding, and use the Hyperdrive connection string from Worker-side context only [11][12][13].

7. Create an ADR before implementation.
   The decision changes the system shape: Astro SSR routes, React SPA island, tRPC API, Cloudflare Workers deployment, Hyperdrive, and Railway Postgres. It supersedes parts of the local-only assumption in ADR-002 without necessarily discarding local-first UX.

8. First migration slice should be infrastructure-only.
   Target: Astro renders landing and `/app/*`; the current app still works as SPA; `/trpc/health` returns typed data; `bun run check` remains the gate. Do not introduce auth or persistence in the same slice.

## Considered and rejected

- Full Astro rewrite of app features: rejected for now. The existing app is React, and Astro can host React islands; rewriting practice UI into `.astro` components would spend effort without enabling Worker APIs.
- Global SPA catch-all at `/*`: rejected. It would make SSR landing/sign-in pages harder and blur ownership between Astro routing and TanStack Router.
- Direct browser-to-Railway database access: rejected. It leaks credentials and bypasses server authorization.
- Direct Worker-to-Railway Postgres without Hyperdrive: not rejected permanently, but not recommended. Hyperdrive is the Cloudflare-recommended pooling/latency layer for traditional hosted SQL from Workers.
- Cloudflare Pages deployment: rejected for this target. Current Astro Cloudflare adapter docs direct Cloudflare deployments to Workers, not Pages.

## Sources

[1] Astro React integration — https://docs.astro.build/en/guides/integrations-guide/react/ (accessed 2026-07-05)

[2] Astro template directives, client hydration and `client:only` — https://docs.astro.build/en/reference/directives-reference/ (accessed 2026-07-05)

[3] Astro Cloudflare adapter overview — https://docs.astro.build/en/guides/integrations-guide/cloudflare/ (accessed 2026-07-05)

[4] Astro Cloudflare adapter upgrade notes: Workers target, Wrangler config, preview — https://docs.astro.build/en/guides/integrations-guide/cloudflare/ (accessed 2026-07-05)

[5] TanStack Router overview — https://tanstack.com/router/latest/docs/overview (accessed 2026-07-05)

[6] TanStack Router installation with Vite — https://tanstack.com/router/latest/docs/installation/with-vite (accessed 2026-07-05)

[7] Astro configuration reference, Vite passthrough — https://docs.astro.build/en/reference/configuration-reference/#vite (accessed 2026-07-05)

[8] Astro endpoints/API routes — https://docs.astro.build/en/guides/endpoints/ (accessed 2026-07-05)

[9] tRPC fetch/edge runtime adapter, Astro example — https://trpc.io/docs/server/adapters/fetch (accessed 2026-07-05)

[10] tRPC React Query integration setup — https://trpc.io/docs/client/react/setup (accessed 2026-07-05)

[11] Railway PostgreSQL docs — https://docs.railway.com/databases/postgresql (updated 2026-05-29, accessed 2026-07-05)

[12] Cloudflare Workers database connections — https://developers.cloudflare.com/workers/databases/connecting-to-databases/ (updated 2026-04-23, accessed 2026-07-05)

[13] Cloudflare Hyperdrive PostgreSQL example — https://developers.cloudflare.com/hyperdrive/examples/connect-to-postgres/ (accessed 2026-07-05)
