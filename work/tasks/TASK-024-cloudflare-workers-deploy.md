---
id: TASK-024
title: Deploy the Astro app to Cloudflare Workers
epic: EPIC-013
status: blocked
blocked_reason: first publish needs an interactive `wrangler login` — the stored Cloudflare OAuth token is expired and cannot refresh non-interactively; all deploy tooling, prod posture, and local workerd verification are done. Owner: run `bunx wrangler login` (in codebase/apps/web or any dir), then `bun run --cwd codebase deploy` or ask an agent to finish TASK-024.
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

- [x] `wrangler.jsonc` present with `nodejs_compat`, a pinned `compatibility_date`, and the Astro Workers entry (entry/assets come from the adapter-emitted `dist/server/wrangler.json` via the `.wrangler/deploy/config.json` redirect — see Log)
- [ ] `bun run deploy` publishes to Cloudflare Workers *(script in place, `wrangler deploy --dry-run` passes; actual publish blocked on owner `wrangler login`)*
- [ ] On the deployed URL: `/` renders server-side, `/app/*` runs the SPA including deep-link reloads, `/trpc/health` returns typed JSON *(all three verified in the local workerd preview; live URL pending publish)*
- [x] A documented local preview command runs the app in the Workers runtime
- [ ] Deployment steps and the live URL recorded in `architecture/overview.md` *(steps recorded; URL pending publish)*
- [x] `bun run check` passes

## Verification

`bun run check` green, then `bun run deploy`. On the live URL: `curl` `/` (expect HTML), `curl` `/trpc/health` (expect JSON), open `/app`, exercise one practice module, hard-reload a nested `/app/...` route.

## Log

### 2026-07-06 — claimed (agent)

Plan: the adapter already emits a resolved `dist/server/wrangler.json` (main `entry.mjs`, assets `../client`) plus a `.wrangler/deploy/config.json` redirect, so deploy = `astro build && wrangler deploy` from `apps/web`. Steps: (1) pin `wrangler` as an apps/web devDependency, add `deploy` script there and expose it from the codebase root; (2) fold in the two insights that assigned themselves to this task — INS-020: gate `HealthFooter` to dev builds; INS-021: strip tRPC error stacks in production via an explicit `errorFormatter` (workerd doesn't reliably set `NODE_ENV`), and record the same-origin/no-CORS posture for `/trpc/*`; (3) verify the Workers runtime locally via the built worker under `wrangler dev` and document that preview path; (4) deploy + live-URL checks; (5) record steps + URL in `architecture/overview.md`. Known risk: local wrangler auth token is expired — the actual publish may block on an interactive `wrangler login`.

### 2026-07-06 — blocked on owner login (agent)

Everything except the publish itself is done and verified:

- **Deploy tooling:** `wrangler ^4.107.0` pinned as an `apps/web` devDependency; `deploy` script in `apps/web` (`bun run build && wrangler deploy`) exposed from the codebase root. No `main`/`assets` needed in `wrangler.jsonc` — the adapter writes the resolved config to `dist/server/wrangler.json` (entry `entry.mjs`, assets `../client`) and `.wrangler/deploy/config.json` redirects wrangler to it. `wrangler deploy --dry-run` validates and bundles cleanly (~272 KiB gzip).
- **INS-020 folded in:** `HealthFooter` is dev-only — query `enabled` gated and render short-circuited on `import.meta.env.DEV`; the JSX still compiles against the typed health output, so the type-contract pin survives. Test added for the prod gate (`vi.stubEnv('DEV', false)`).
- **INS-021 folded in:** `sanitizeErrorShape` in `src/server/trpc/init.ts` strips `data.stack` whenever the build isn't dev (workerd sets no `NODE_ENV`, so tRPC's heuristic is untrustworthy); unit-tested. Verified on the wire: production build under `astro preview` returns 404-unknown-procedure JSON with no `stack`. CORS posture recorded in overview.md: no CORS headers, same-origin consumers only, Astro's cross-site-POST origin check stays on (a cross-site `DELETE /trpc/health` is rejected with 403 before reaching tRPC).
- **Local Workers preview verified:** `bun run build && bun run preview` serves the built worker in workerd — `/` SSR HTML, `/trpc/health` typed JSON, `/app/practice` deep link 200 all confirmed.
- **Adapter gotcha for the publish:** the adapter auto-enables KV sessions (no off switch), so the deploy carries a `SESSION` KV binding with no namespace id — expect wrangler to provision/prompt for a KV namespace on first `wrangler deploy`. The app does not use sessions; the binding ships unused.

Reviewed: independent `code-reviewer` pass on the staged diff — verdict clean, no must-fix findings. Its one fix-or-file finding (internal error *messages* still ship verbatim in prod once a throwing procedure exists; only stacks are stripped) is fixed as a recorded trigger in overview.md's Deployment section rather than code — nothing throws in the health-only API today. `bun run check` green (30 files / 519 tests).

**Blocked:** stored Cloudflare OAuth token is expired and cannot refresh non-interactively; browser-extension path unavailable this session. Owner unblocks with `bunx wrangler login`, then `bun run --cwd codebase deploy`; remaining criteria are the publish, live-URL checks (`/`, `/trpc/health`, `/app` module + nested-route hard reload), and writing the URL into overview.md.
