---
id: TASK-023
title: tRPC scaffold with typed /trpc/health endpoint and shared React Query client
epic: none            # platform migration — candidate new epic, owner to decide
status: backlog
depends_on: [TASK-021]
research: RES-002
created: 2026-07-05
---

# TASK-023 — tRPC scaffold with typed /trpc/health endpoint and shared React Query client

## Goal

A working end-to-end typed API surface: a tRPC `health` procedure served from an Astro API route, consumed in the SPA through React Query, proving the client↔server type contract before any real backend features exist.

## Context

RES-002 recommendations 4 and 5. Server shape from the research: `src/server/trpc/context.ts` (request context; no database yet), `src/server/trpc/router.ts` (root `appRouter`), `src/server/trpc/routers/` (empty or `system.ts` for health), and `src/pages/trpc/[trpc].ts` using tRPC's fetch adapter with an `ALL` Astro handler. Client side: `src/app/trpc.ts` typed client utilities and `src/app/providers.tsx` wrapping the SPA with **one** `QueryClientProvider` reused by the tRPC provider — never two query caches. Use a Zod input/output on the health procedure so the validation pattern is established. Scope guard (RES-002 rec 8): no auth, no persistence, no database — health/scaffolding only; the SPA keeps localStorage for all practice state.

## Acceptance criteria

- [ ] `GET`-able `/trpc/health` responds with typed data (e.g. `{ status: 'ok', time }`) via the fetch adapter
- [ ] A visible SPA element (e.g. footer or dev-only panel) renders the health response through the tRPC React Query hooks
- [ ] Exactly one `QueryClient` instance shared between React Query and tRPC
- [ ] Procedure uses Zod at its boundary
- [ ] Breaking the router's output type breaks the consuming component's typecheck (type contract is real)
- [ ] No database or auth code anywhere in the slice
- [ ] `bun run check` passes

## Verification

`bun run check` green. `bun run dev`, `curl` the `/trpc/health` URL and see valid JSON; load the SPA and see the health status rendered. Change the health procedure's return shape, confirm `bun run check` typecheck fails in the consuming component, revert.
