---
id: EPIC-013
title: Platform & multi-app architecture
vision: VIS-001
status: in-progress
created: 2026-07-05
---

# EPIC-013 — Platform & multi-app architecture

## Goal

A repository and runtime platform that supports multiple apps sharing the domain core: knowledge at the repo root, code as a Bun-workspaces monorepo under `codebase/` (ADR-005), and the web app migrated to Astro on Cloudflare Workers with a typed tRPC surface (RES-002, ADR-006 when written).

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

In progress. ADR-005 is written and the codebase restructure has shipped. The platform track now runs TASK-020 → TASK-021, then TASK-022 and TASK-023 independently, and TASK-024 once TASK-021 + TASK-023 are done. The database tasks remain `gated` in task frontmatter until a feature needs server-side persistence.

## Last reviewed

2026-07-05 — created; adopted the six orphaned platform tasks (TASK-020–025) that were awaiting an epic.
