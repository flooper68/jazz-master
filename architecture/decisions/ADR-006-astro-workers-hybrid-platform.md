---
id: ADR-006
title: Hybrid Astro SSR + SPA island on Cloudflare Workers, tRPC API, Hyperdrive to Railway Postgres
status: proposed
date: 2026-07-06
research: RES-002
---

# ADR-006 — Hybrid Astro SSR + SPA island on Cloudflare Workers, tRPC API, Hyperdrive to Railway Postgres

## Context

The app today is a local-only Vite SPA (ADR-001 stack) with no backend and no accounts (ADR-002), living in `codebase/apps/web` of the Bun-workspaces monorepo (ADR-005). The owner's direction (VIS-001, EPIC-013) grows the product beyond that: server-rendered public pages, a typed API surface, and eventually durable server-side state. RES-002 researched the target platform and recommends recording the decision as an ADR before any implementation starts, because it changes the system shape from local-only SPA to hybrid SSR + Worker API + external database.

## Decision

Migrate `apps/web` to **Astro on Cloudflare Workers**, hosting the existing React app as a client-only SPA island, with a tRPC API on Astro routes and (when a feature needs it) Hyperdrive in front of Railway Postgres. The five load-bearing choices, each with its rejected alternative:

1. **Cloudflare Workers, not Pages.** The app deploys via `@astrojs/cloudflare` with `output: 'server'` targeting Workers, with an explicit `wrangler.jsonc` (`nodejs_compat`, `compatibility_date`) because custom bindings (Hyperdrive) are coming. *Rejected: Pages* — the current Astro Cloudflare adapter no longer supports it (RES-002 [4]).
2. **The React app stays an SPA, owning exactly `/app/*`.** An Astro catch-all page (`src/pages/app/[...path].astro`) mounts the React shell with `client:only="react"`; Astro never SSRs practice routes. Astro owns everything else: `/`, future sign-in/legal/marketing pages, API endpoints. *Rejected: a global `/*` SPA catch-all* — it blurs route ownership between Astro and the SPA router and makes SSR public pages harder. *Rejected: full Astro rewrite of app features* — effort spent rewriting working React UI buys nothing the island doesn't.
3. **TanStack Router scoped inside the SPA only.** Route files live under `src/app/routes` (never Astro's `src/pages`), route tree rooted at `/app`, codegen via `@tanstack/router-plugin` through Astro's `vite.plugins` passthrough. This wiring is a single-source inference (neither TanStack nor Astro documents the combination), so the codegen is spiked before any route migrates (TASK-022); code-based routing is the fallback.
4. **tRPC on one Astro catch-all API route, one React Query client.** `src/pages/trpc/[trpc].ts` with tRPC's fetch adapter serves an `appRouter` assembled from domain subrouters; procedures validate inputs with Zod. The SPA consumes it through a single shared `QueryClient` reused by the tRPC provider — never two query caches.
5. **Database access only through Hyperdrive, only from Worker code.** When server persistence arrives (gated TASK-025), Workers reach Railway Postgres through a Hyperdrive binding; the connection string exists only in Worker-side tRPC context. *Rejected: direct browser→database access* — leaks credentials, bypasses authorization. *Not recommended: direct Worker→Railway without Hyperdrive* — pays per-invocation connection setup; Hyperdrive is Cloudflare's pooling layer for exactly this case.

Invariant kept from the current architecture: `packages/theory` stays pure — no Astro, React, tRPC, database, or Workers imports, ever.

### Relationship to ADR-002

**Superseded:** the "no backend, the app is a static bundle" assumption. A server boundary now exists: Astro SSR pages, Worker-hosted API routes, and an external-database path.

**Kept:** the local-first UX. Practice state (profile, sessions, plans) stays in localStorage behind the `defineStore` wrapper; no accounts, no auth, no telemetry. Server state arrives only when a specific task requires it, and ADR-002's seam holds — a backend replaces store implementations, not the app. ADR-002 remains accepted for what it still governs; backlog items that cited it as "no backend exists" now read "no backend features exist yet (ADR-006 keeps practice state local)".

### Migration slicing

The first slice (TASK-021–024) is **infrastructure-only**: Astro renders a landing page, the current app works unchanged under `/app/*`, `/trpc/health` returns typed data end-to-end, and the whole thing runs on a real Workers URL. **No auth, no persistence, no database in this slice** — TASK-025 (Hyperdrive/Railway) and TASK-028 (local Postgres) stay `gated` until a feature needs server-side state. `bun run check` remains THE gate throughout; TASK-021 rewires its build step to `astro build`.

RES-002 recommendation coverage: recs 1–5 and 8 are adopted as decisions 1–4 and the slicing above; rec 6 (Hyperdrive) is adopted as decision 5 but deferred behind TASK-025's gate; rec 7 is this document.

## Consequences

- The web app gains a server runtime and a deploy target: Workers-specific breakage becomes possible, so a local Workers-runtime preview (`wrangler dev`) joins the workflow (TASK-024), and deployment is a real step instead of "host the static bundle anywhere". Deploys stay manual/owner-triggered in the first slice.
- The client↔server type contract is end-to-end TypeScript (tRPC + Zod); adding an API feature is a procedure + hook, no OpenAPI/codegen layer.
- Two routing systems coexist by design; the `/app/*` boundary is the contract that keeps them from colliding. Route ownership questions have one answer: public/server = Astro, practice app = TanStack Router.
- Vitest, oxlint, and `tsc` keep covering the React code unchanged; the build step of `check` changes meaning (Vite build → `astro build`).
- ADR-001 (React/TS/Tailwind/Vitest) and ADR-005 (monorepo layout) are unchanged; all paths in this ADR live under `codebase/apps/web/`.
- Operational cost is no longer zero once a database attaches (Railway egress, Workers limits) — acceptable because it is gated until a feature pays for it.

## Considered and rejected

- **Full Astro rewrite of app features** — spends effort re-implementing working React UI; islands already give Astro hosting without a rewrite.
- **Global `/*` SPA catch-all** — makes SSR landing/sign-in pages harder and blurs ownership between Astro routing and TanStack Router.
- **Direct browser→database access** — credential leak, no server authorization; everything goes through Worker-side tRPC procedures.
- **Worker→Railway without Hyperdrive** — repeated connection-setup latency per invocation; revisit only if Hyperdrive proves problematic (would be a new ADR note, not a silent change).
- **Cloudflare Pages** — the Astro adapter has dropped Pages support; Workers is the documented target.
- **Staying local-only (no platform migration)** — rejected by the owner's multi-app/platform direction (EPIC-013); restructuring and re-platforming now is cheaper than after more features land.

## Open questions (deferred grill)

Owner absent at authoring; per `processes/grilling.md` these are the load-bearing questions this ADR rests on. Resolve at next owner session, then remove this section and set status `accepted`.

1. **Is the operational commitment wanted now?** A Workers deploy plus (eventually) Railway means bills, dashboards, and secrets where today there is a free static bundle — while the product hypothesis ADR-002 was guarding is still unproven. Is platform-readiness worth that before more practice features exist, or should TASK-021–024 wait behind EPIC-012 (dashboard/history)?
2. **Is Railway Postgres actually decided, or just researched?** Decision 5 inherits Railway from RES-002's framing. Neon/Supabase/D1 were never explicitly compared. Fine to leave gated as-is, but confirm Railway is a real choice, not an accident of the research question.
3. **How much landing page does slice one need?** TASK-021 says "a minimal landing page at `/` linking into `/app` is enough". Confirm nothing marketing-shaped is expected from this epic, so scope stays infrastructure-only.
