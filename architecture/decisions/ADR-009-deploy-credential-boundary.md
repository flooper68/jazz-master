---
id: ADR-009
title: Agents never hold deploy credentials — CI-only deploys, dev auto-deploy on main
status: accepted
date: 2026-07-06
accepted: 2026-07-06
---

# ADR-009 — Agents never hold deploy credentials: CI-only deploys, dev auto-deploy on main

## Context

TASK-024 prepared the Workers deploy with the RES-002 design: manual, owner-triggered, `wrangler deploy` from the local machine. Its first publish immediately hit the weak point — the local Cloudflare OAuth token had expired and needed an interactive `wrangler login`. When the agent asked the owner to log in, the owner refused the whole model (grill session, NOTE-006): AI agents work on this machine with full filesystem and shell access, and a local wrangler login hands every one of them a near-account-wide Cloudflare credential (`~/.wrangler` OAuth token: Workers, KV, D1, DNS, email routing, …).

## Decision

**AI agents must not have access to production, and no deploy credential may be readable from this machine.**

1. **No local wrangler credentials, ever.** `wrangler login` is not used on the development machine. The deploy credential lives entirely inside Cloudflare's build platform (see amendment); the owner controls it, agents never see it.
2. **Dev deploys are automatic and agent-reachable by design.** Every push to `main` triggers a CI pipeline that runs the full `bun run check` gate and then deploys the `jazz-master-web` worker. That deployment is the **dev environment** — agents pushing to `main` are expected to update it; what they cannot do is hold or misuse the credential that does it.
3. **Production is a separate, deferred concern** (gated TASK-036): its own environment, deployed only by a manual trigger via UI. Not designed further in this decision; TASK-036 carries the open enforcement question (a naked `workflow_dispatch` is agent-triggerable through the owner's `gh` CLI — a GitHub environment with a required-reviewer rule would make the boundary mechanical rather than trust-based).

*Rejected: local scoped API token in the owner's env* — narrows blast radius but still leaves the credential readable by every agent process on the machine, violating the stated invariant. *Rejected (superseded): TASK-024's manual local deploy* — see Context.

## Amendment (2026-07-06, same day — NOTE-007): Cloudflare Workers Builds, not GitHub Actions

The first mechanism (GitHub Actions workflow + `CLOUDFLARE_API_TOKEN` repo secret) shipped and verified its gate on a real runner, then the owner redirected before any secret was created: **use Cloudflare Workers Builds** — the repo is connected to the worker in the Cloudflare dashboard, and Cloudflare's own build platform runs `bun run check` (owner kept the full gate in the build command, question (a) in NOTE-007) and deploys on every push to `main`. This strengthens the invariant: **no deploy token exists anywhere** — not in GitHub secrets, not on disk — the credential is implicit in the Cloudflare↔GitHub connection the owner authorizes in Cloudflare's UI. The GitHub Actions workflow was removed. Consequence shift: deploy status now lives in the Cloudflare dashboard (View build in Workers & Pages) plus the GitHub commit status Cloudflare posts, rather than in the repo's Actions tab.

## Consequences

- Nothing on the development machine can deploy; `bun run deploy` (kept for reference and possible TASK-036 reuse) fails locally for lack of credentials, which is correct behavior, not a gap.
- The deploy path depends on the Cloudflare↔GitHub connection the owner manages; a broken build surfaces in the Cloudflare dashboard and as a failed GitHub commit status, and only the owner can touch the connection.
- Every push to `main` becomes a dev deploy: `bun run check` in the Workers Builds build command is the last automated gate before code is publicly reachable on the dev URL. The e2e smoke suite (TASK-035) will strengthen exactly this edge.
- The Astro adapter's auto-enabled KV sessions were eliminated (`sessionDrivers.memory()`) so the build deploys a binding-free worker and provisions nothing.

## Provenance

Grill sessions NOTE-006 and NOTE-007 (both 2026-07-06); supersedes the deployment-trigger part of RES-002 recommendation 1 as recorded in TASK-024. Related: ADR-006 (platform), INS-022 (the CI-deploy insight filed hours earlier off the same blocker).
