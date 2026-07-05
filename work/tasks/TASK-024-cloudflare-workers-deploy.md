---
id: TASK-024
title: Deploy the Astro app to Cloudflare Workers
epic: EPIC-013
status: backlog
depends_on: [TASK-021, TASK-023]
research: RES-002
created: 2026-07-05
---

# TASK-024 — Deploy the Astro app to Cloudflare Workers

## Goal

The app runs on Cloudflare Workers: SSR landing page, `/app/*` SPA, and `/trpc/health` all working on a real `workers.dev` (or custom-domain) URL, deployable with one command.

## Context

RES-002 recommendation 1: target Workers, **not Pages** — the current Astro Cloudflare adapter no longer supports Pages. Keep an explicit `wrangler.jsonc` (this project will need custom bindings later — Hyperdrive in TASK-025) with `nodejs_compat` and a `compatibility_date`. Add a `bun run deploy` script wrapping `wrangler deploy`, and document a local Workers-runtime preview (`wrangler dev` / the adapter's preview) so Workers-specific breakage is catchable before deploying. Deployment stays manual/owner-triggered in this slice — no CI deploy pipeline (file an insight if that seems worth doing). Secrets note: nothing secret exists yet in this slice; the task must not introduce any. Completes the RES-002 first-slice target: landing SSR + working SPA + typed health endpoint on Workers, `bun run check` still the gate.

**ADR-005 note (2026-07-05):** after the TASK-027 restructure, `wrangler.jsonc` lives in `codebase/apps/web/`; the `deploy` script is defined there and exposed through the workspace root (and root shim) so `bun run deploy` works from the repo root.

## Acceptance criteria

- [ ] `wrangler.jsonc` present with `nodejs_compat`, a pinned `compatibility_date`, and the Astro Workers entry
- [ ] `bun run deploy` publishes to Cloudflare Workers
- [ ] On the deployed URL: `/` renders server-side, `/app/*` runs the SPA including deep-link reloads, `/trpc/health` returns typed JSON
- [ ] A documented local preview command runs the app in the Workers runtime
- [ ] Deployment steps and the live URL recorded in `architecture/overview.md`
- [ ] `bun run check` passes

## Verification

`bun run check` green, then `bun run deploy`. On the live URL: `curl` `/` (expect HTML), `curl` `/trpc/health` (expect JSON), open `/app`, exercise one practice module, hard-reload a nested `/app/...` route.
