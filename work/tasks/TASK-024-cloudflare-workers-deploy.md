---
id: TASK-024
title: Deploy the Astro app to Cloudflare Workers
epic: EPIC-013
status: blocked
blocked_reason: everything agent-side is done; the owner connects the GitHub repo to the worker via Cloudflare Workers Builds (dashboard — settings recorded in the Log). No token or secret to create anywhere (ADR-009 as amended, NOTE-007).
depends_on: [TASK-021, TASK-023]
research: RES-002
created: 2026-07-05
---

# TASK-024 — Deploy the Astro app to Cloudflare Workers

## Goal

The app runs on Cloudflare Workers as the **dev environment**: SSR landing page, `/app/*` SPA, and `/trpc/health` all working on a real `workers.dev` URL, deployed **automatically by CI on every push to `main`** — no deploy credential ever readable from the development machine (ADR-009).

## Context

RES-002 recommendation 1: target Workers, **not Pages** — the current Astro Cloudflare adapter no longer supports Pages. Keep an explicit `wrangler.jsonc` (this project will need custom bindings later — Hyperdrive in TASK-025) with `nodejs_compat` and a `compatibility_date`. Add a `bun run deploy` script wrapping `wrangler deploy`, and document a local Workers-runtime preview (`wrangler dev` / the adapter's preview) so Workers-specific breakage is catchable before deploying. Deployment stays manual/owner-triggered in this slice — no CI deploy pipeline (file an insight if that seems worth doing). Secrets note: nothing secret exists yet in this slice; the task must not introduce any. Completes the RES-002 first-slice target: landing SSR + working SPA + typed health endpoint on Workers, `bun run check` still the gate.

**ADR-005 note (2026-07-05):** after the TASK-027 restructure, `wrangler.jsonc` lives in `codebase/apps/web/`; the `deploy` script is defined there and exposed through the workspace root (and root shim) so `bun run deploy` works from the repo root.

**ADR-009 redesign (2026-07-06, grill NOTE-006):** the "manual/owner-triggered, no CI" sentence above is superseded. The owner rejected local wrangler credentials outright — agents must not have access to production, and no deploy credential may be readable from this machine. This task now delivers the **dev** deployment: a GitHub Actions workflow deploying to Cloudflare on every push to `main`, authenticated by a `CLOUDFLARE_API_TOKEN` repo secret the owner creates (agents never handle it). Production is split out to gated TASK-036 (manual UI trigger). *(Further amended same day — the mechanism is Cloudflare Workers Builds, no GitHub Action and no token at all; see NOTE-007 and the Log.)*

## Acceptance criteria

- [x] `wrangler.jsonc` present with `nodejs_compat`, a pinned `compatibility_date`, and the Astro Workers entry (entry/assets come from the adapter-emitted `dist/server/wrangler.json` via the `.wrangler/deploy/config.json` redirect — see Log)
- [ ] Cloudflare Workers Builds deploys on every push to `main` (ADR-009 as amended): the repo is connected to the `jazz-master-web` worker in the Cloudflare dashboard, build command runs `bun install --frozen-lockfile` + the full `bun run check` gate (owner decision, NOTE-007), then `wrangler deploy`
- [ ] No deploy credential exists anywhere agent-readable — no `wrangler login`, no API token on disk or in repo secrets
- [ ] On the deployed dev URL: `/` renders server-side, `/app/*` runs the SPA including deep-link reloads, `/trpc/health` returns typed JSON *(all three verified in the local workerd preview; live URL pending first green CI deploy)*
- [x] A documented local preview command runs the app in the Workers runtime
- [ ] Deployment steps and the live dev URL recorded in `architecture/overview.md` *(steps recorded; URL pending publish)*
- [x] `bun run check` passes

## Verification

`bun run check` green locally; push to `main` and watch the Workers Builds run go green (Cloudflare dashboard → the worker → Builds, or the commit status on GitHub). On the live dev URL: `curl` `/` (expect HTML), `curl` `/trpc/health` (expect JSON), open `/app`, exercise one practice module, hard-reload a nested `/app/...` route. Confirm no local credential: `bunx wrangler whoami` on the dev machine stays logged out while CI deploys succeed.

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

### 2026-07-06 — redesigned to CI-only deploy (grill NOTE-006, ADR-009)

The login blocker report triggered an owner decision: no local wrangler credentials at all — agents must not have access to production. Task reshaped (see the ADR-009 note in Context): the criteria about a local publish are replaced by a GitHub Actions workflow that deploys to the dev worker on every push to `main`; the two prior unticked criteria (publish + live-URL checks) carry over in CI form. Prod split to TASK-036 (gated). Owner handles the credential side: scoped Cloudflare API token + `CLOUDFLARE_API_TOKEN`/`CLOUDFLARE_ACCOUNT_ID` repo secrets. Implementation plan: (1) try to eliminate the adapter's auto-injected `SESSION` KV binding (set a non-KV Astro session driver — the app uses no sessions) so the token needs no KV scope and the first deploy provisions nothing; (2) add `.github/workflows/deploy-dev.yml` (push to `main` + `workflow_dispatch`, concurrency-guarded: setup-bun → `bun install --frozen-lockfile` → `bun run check` → `bun run deploy`); (3) the first workflow run will fail red until the owner adds the secrets — that is the intended loud signal, re-runnable from the Actions UI without a new push.

### 2026-07-06 — CI deploy implemented; blocked on owner-created secrets (agent)

- **`SESSION` KV binding eliminated:** `session: { driver: sessionDrivers.memory() }` in `astro.config.mjs` (the string form is deprecated in Astro 7). Dry-run confirms the worker now carries only `ASSETS` + `IMAGES` — the CI token needs Workers Scripts edit rights only, and the first deploy provisions nothing.
- **Workflow landed:** `.github/workflows/deploy-dev.yml` — push to `main` + `workflow_dispatch`, `concurrency: deploy-dev` (latest push wins), Bun pinned to the local 1.3.14, `bun install --frozen-lockfile` → `bun run check` → `bun run deploy` with the two secrets injected only into the deploy step. YAML parse-validated.
- Overview Deployment section rewritten for ADR-009; wiki `product/overview` + `project/lifecycle-of-a-change` updated (push to `main` now also deploys dev); wiki log lines added.
- Reviewed: independent `code-reviewer` pass — clean, no must-fix findings; its hardening suggestions applied in the same commit (`permissions: contents: read`, `timeout-minutes: 15`, `setup-bun` SHA-pinned to v2.2.0, session-driver comment corrected to name the per-isolate/non-persistent caveat). Its double-build nit (check builds, deploy rebuilds) left as-is deliberately — CI-minutes cost only.
- **Expected red:** the `deploy-dev` run triggered by this very commit will fail at the deploy step until the secrets exist. Owner: Cloudflare dashboard — create token, add repo secrets, re-run. Remaining criteria (green CI deploy, live-URL checks, URL into overview.md) close after that. *(Superseded hours later — see next entry.)*

### 2026-07-06 — switched to Cloudflare Workers Builds (grill NOTE-007, ADR-009 amendment)

The GitHub Actions run had just proven the design (install ✓, full check gate ✓ on the runner, deploy ✗ exactly on the missing token) when the owner redirected: no GitHub Action — Cloudflare Workers Builds deploys the app itself. Grilled one question (gate placement); owner chose **(a) keep `bun run check` in Cloudflare's build command**. Changes: `deploy-dev.yml` deleted; ADR-009 amended (invariant strengthened — no deploy token exists anywhere, the credential is implicit in the Cloudflare↔GitHub connection); overview + wiki updated. The `deploy` script and the `sessionDrivers.memory()` binding-elimination both stay — Workers Builds needs the binding-free worker just the same.

**Owner runbook (replaces the secrets to-do):** Cloudflare dashboard → Workers & Pages → `jazz-master-web` (create it via the connect flow if it doesn't exist) → Settings → Build → connect GitHub repo `flooper68/jazz-master`, branch `main`, then:
- **Root directory:** `codebase/apps/web` (where `wrangler.jsonc` lives)
- **Build command:** `cd ../.. && bun install --frozen-lockfile && bun run check`
- **Deploy command:** `bunx wrangler deploy`

After the first green build: tell an agent the `workers.dev` URL (or paste it), and the remaining criteria close — live-URL checks (`/`, `/trpc/health`, `/app` module + nested-route hard reload) and the URL recorded in overview.md.
