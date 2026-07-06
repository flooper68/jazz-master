---
id: TASK-023
title: tRPC scaffold with typed /trpc/health endpoint and shared React Query client
epic: EPIC-013
status: done
depends_on: [TASK-021]
research: RES-002
created: 2026-07-05
---

# TASK-023 — tRPC scaffold with typed /trpc/health endpoint and shared React Query client

## Goal

A working end-to-end typed API surface: a tRPC `health` procedure served from an Astro API route, consumed in the SPA through React Query, proving the client↔server type contract before any real backend features exist.

## Context

RES-002 recommendations 4 and 5. Server shape from the research: `src/server/trpc/context.ts` (request context; no database yet), `src/server/trpc/router.ts` (root `appRouter`), `src/server/trpc/routers/` (empty or `system.ts` for health), and `src/pages/trpc/[trpc].ts` using tRPC's fetch adapter with an `ALL` Astro handler. Client side: `src/app/trpc.ts` typed client utilities and `src/app/providers.tsx` wrapping the SPA with **one** `QueryClientProvider` reused by the tRPC provider — never two query caches. Use a Zod input/output on the health procedure so the validation pattern is established. Scope guard (RES-002 rec 8): no auth, no persistence, no database — health/scaffolding only; the SPA keeps localStorage for all practice state.

**ADR-005 note (2026-07-05):** paths in this task predate the TASK-027 restructure — read every `src/...` path as `codebase/apps/web/src/...` (server shape under `codebase/apps/web/src/server/trpc/`, client under `codebase/apps/web/src/app/`).

## Acceptance criteria

- [x] `GET`-able `/trpc/health` responds with typed data (e.g. `{ status: 'ok', time }`) via the fetch adapter
- [x] A visible SPA element (e.g. footer or dev-only panel) renders the health response through the tRPC React Query hooks
- [x] Exactly one `QueryClient` instance shared between React Query and tRPC
- [x] Procedure uses Zod at its boundary
- [x] Breaking the router's output type breaks the consuming component's typecheck (type contract is real)
- [x] No database or auth code anywhere in the slice
- [x] `bun run check` passes

## Verification

`bun run check` green. `bun run dev`, `curl` the `/trpc/health` URL and see valid JSON; load the SPA and see the health status rendered. Change the health procedure's return shape, confirm `bun run check` typecheck fails in the consuming component, revert.

## Log

### 2026-07-06 — claimed (agent)

Plan. Per INS-017 re-verified RES-002's tRPC shape against current docs (tRPC 11.18): the fetch-adapter server shape holds exactly (Astro `src/pages/trpc/[trpc].ts`, `fetchRequestHandler`, `ALL` handler), but the client recommendation has moved — tRPC now recommends `@trpc/tanstack-react-query` (`createTRPCContext`/`useTRPC` + `queryOptions` on plain `useQuery`) over the classic `@trpc/react-query` provider. Using the modern integration; staleness note to be recorded in RES-002.

- Server (`apps/web/src/server/trpc/`): `init.ts` (initTRPC + publicProcedure), `context.ts` (empty context, no db), `routers/system.ts` (`health` procedure, Zod input/output, mounted at router root so the URL is `/trpc/health`), `router.ts` (`appRouter` + `AppRouter` type).
- Astro endpoint: `src/pages/trpc/[trpc].ts`, fetch adapter, `ALL` export.
- Client (`src/app/`): `trpc.ts` (`createTRPCContext<AppRouter>`), `providers.tsx` (one `QueryClient` shared by `QueryClientProvider` and `TRPCProvider`; optional `fetch` prop so tests inject an in-process transport), `HealthFooter.tsx` (small fixed status chip, rendered from `__root.tsx` so it's visible on every SPA view). AppShell wraps the router in the providers.
- Tests (cheapest layers per testing-strategy): unit test on the router via `createCaller`; component test on `HealthFooter` through the real wire path — a test fetch that delegates to `fetchRequestHandler` + `appRouter` in-process (`src/test/trpcTestFetch.ts`), no hand-mocked API shapes.
- Type-contract criterion verified manually (mutate output schema, watch consuming component fail typecheck, revert).
- Scope guard honored: no db, no auth, no persistence; practice state stays in localStorage.

### 2026-07-06 — done

Shipped as planned; all criteria verified for real. Server: `src/server/trpc/{init,context,router}.ts` + `routers/system.ts` (health procedure, `z.void()` input + Zod output schema, mounted at router root so the URL is literally `/trpc/health`); Astro catch-all endpoint `src/pages/trpc/[trpc].ts` via `fetchRequestHandler`. Client: `@trpc/tanstack-react-query` (the integration tRPC now recommends over the classic `@trpc/react-query` RES-002 described — staleness note recorded in RES-002), one `QueryClient` shared by `QueryClientProvider` and `TRPCProvider` in `src/app/providers.tsx`, `HealthFooter.tsx` chip rendered from `__root.tsx` on every SPA view.

Verification: `bun run check` green (516 tests). `curl /trpc/health` → `{"result":{"data":{"status":"ok","time":"…"}}}` HTTP 200. Browser (Playwright): footer renders "API: ok" + time on the dashboard, zero console errors. Type contract: renaming `status`→`state` in the output schema failed typecheck in `HealthFooter.tsx` (the consuming component), reverted. Probes: POST to the query → 405 METHOD_NOT_SUPPORTED, unknown procedure → 404, garbage input → Zod 400 — all clean tRPC JSON.

Tests added at the cheapest layers: router unit test via `createCallerFactory`, and a `HealthFooter` component test through the real wire path — `src/test/trpcTestFetch.ts` serves the batch link through the actual `fetchRequestHandler` + `appRouter` in-process (no hand-mocked API shapes). `renderRoute` now wraps the route tree in the production providers.

Independent review (code-reviewer agent): no must-fix findings; tracker/RES-002 items resolved in this commit; two file-as-insight items filed in Reflect — the health chip is visible in production builds (gate to dev or promote before TASK-024), and `/trpc` production posture (error stack traces when `NODE_ENV` isn't `production` in workerd, CORS/abuse) belongs to TASK-024.
