---
id: EPIC-013
title: Platform & multi-app architecture
vision: VIS-001
status: in-progress
created: 2026-07-05
---

# EPIC-013 — Platform & multi-app architecture

## Goal

A repository and runtime platform that supports multiple apps sharing the domain core: knowledge at the repo root, code as a Bun-workspaces monorepo under `codebase/` (ADR-005), and the web app migrated to Astro on Cloudflare Workers with a typed tRPC surface (RES-002, ADR-006 — written, `proposed`).

## Why this matters now

The owner has decided the product grows beyond one web app — document creation, presentations, and CLIs are planned. The current single-package layout has no home for a second app or a shared package. Restructuring is cheapest now, before the Astro shell (TASK-021) and the persistence layer (TASK-008) land; the RES-002 platform tasks were filed without an epic ("owner to decide") and belong here.

## Scope

- Monorepo restructure: `codebase/` split, Bun workspaces, `@jazz-master/theory` extraction, root shim (ADR-005 / TASK-026–027)
- Platform migration per RES-002: Astro shell + SPA island, TanStack Router, tRPC scaffold, Workers deploy (TASK-020–024)
- Gated database path: Hyperdrive → Railway Postgres (TASK-025, pulled only when a feature needs server persistence)
- Local dev database: Postgres via Docker Compose mirroring the future Railway instance (TASK-028, pulled alongside TASK-025)

## Out of scope

- Building the actual future apps (CLI, docs, presentations) — each gets its own epic when concrete
- Extracting `packages/ui`, `packages/storage`, `packages/config` — deferred with explicit triggers in ADR-005
- Auth, accounts, or moving practice state server-side (ADR-002's local-first UX stands)

## Tasks

- TASK-026 — Write ADR-005: codebase/ split + Bun workspaces monorepo
- TASK-027 — Restructure the repo to ADR-005
- TASK-020 — Write ADR-006: hybrid Astro SSR + SPA on Cloudflare Workers with tRPC and Hyperdrive
- TASK-021 — Host the existing React SPA inside Astro under /app/*
- TASK-022 — Migrate SPA routing from React Router to TanStack Router
- TASK-023 — tRPC scaffold with typed /trpc/health endpoint
- TASK-024 — Deploy the Astro app to Cloudflare Workers
- TASK-025 — Hyperdrive → Railway Postgres
- TASK-028 — Local Postgres for development via Docker Compose

## Done when

`codebase/` holds `apps/web` and `packages/theory` with `bun run check` green from the repo root; the web app runs on Cloudflare Workers with a typed `/trpc/health` endpoint; adding a new app is a one-directory operation requiring no refactoring of existing code.

## Current status

In progress. ADR-005 is written and the codebase restructure has shipped. ADR-006 is **accepted** (owner grill 2026-07-06, NOTE-005; TASK-020 done): operational commitment confirmed, Railway confirmed as a deliberate choice, slice-one landing page pinned to barebones (name + sentence + link into `/app`, nothing marketing-shaped). **TASK-021 shipped 2026-07-06**: Astro 7 shell with the barebones landing at `/` and the React app as a client-only island under `/app/*`, Workers-target build via `@astrojs/cloudflare` (`wrangler.jsonc` with `nodejs_compat` arrived early — dev SSR needs it). **TASK-022 shipped 2026-07-06**: SPA routing migrated to TanStack Router (file-based routes in `src/app/routes/`, `basepath: '/app'`, react-router removed) — the RES-002 plugin-in-Astro risk flagged by INS-017 didn't materialize; codegen works under dev and build. Next: TASK-023 (tRPC scaffold), unblocked, then TASK-024 (deploy) — still **owner-directed ahead of TASK-014/015**. Note INS-017: re-verify RES-002's tRPC adapter shape as TASK-023 consumes it. The database tasks remain `gated` in task frontmatter until a feature needs server-side persistence.

## Last reviewed

2026-07-06 — TASK-022 shipped (TanStack Router migration); status updated, INS-018/019 filed from review. Earlier same day: TASK-021 shipped (Astro shell + SPA island); status updated, INS-017 noted. Earlier same day: grill session (NOTE-005): ADR-006 accepted, chain unblocked, migration made next work. Earlier: TASK-030 sweep: goal wording de-staled (ADR-006 is written, `proposed`); status and task list verified current. Earlier same day — Current status updated for ADR-006 written/proposed (TASK-020). 2026-07-05 — created; adopted the six orphaned platform tasks (TASK-020–025) that were awaiting an epic.
