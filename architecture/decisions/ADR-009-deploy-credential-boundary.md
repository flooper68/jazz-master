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

1. **No local wrangler credentials, ever.** `wrangler login` is not used on the development machine. The only deploy credential is a Cloudflare API token scoped as narrowly as Workers deploys allow, stored as a GitHub Actions secret, readable only by CI. The owner creates and rotates it; agents never see it.
2. **Dev deploys are automatic and agent-reachable by design.** Every push to `main` runs a GitHub Actions workflow: install → `bun run check` → `wrangler deploy` to the `jazz-master-web` worker. That deployment is the **dev environment** — agents pushing to `main` are expected to update it; what they cannot do is hold or misuse the credential that does it.
3. **Production is a separate, deferred concern** (gated TASK-036): its own environment, deployed only by a manual trigger via UI. Not designed further in this decision; TASK-036 carries the open enforcement question (a naked `workflow_dispatch` is agent-triggerable through the owner's `gh` CLI — a GitHub environment with a required-reviewer rule would make the boundary mechanical rather than trust-based).

*Rejected: local scoped API token in the owner's env* — narrows blast radius but still leaves the credential readable by every agent process on the machine, violating the stated invariant. *Rejected (superseded): TASK-024's manual local deploy* — see Context.

## Consequences

- `bun run deploy` remains the deploy command but is executed by CI; run locally it fails for lack of credentials, which is now correct behavior, not a gap.
- The deploy path gains a dependency on GitHub Actions availability and on the repo's secrets configuration; a missing/expired token surfaces as a red deploy workflow, and only the owner can fix it.
- Every push to `main` becomes a dev deploy: `bun run check` in CI is the last automated gate before code is publicly reachable on the dev URL. The e2e smoke suite (TASK-035) will strengthen exactly this edge.
- The Astro adapter's auto-enabled KV sessions would force the CI token to carry KV provisioning rights; implementation should eliminate that need (the app uses no sessions) or, failing that, the token scope widens by exactly `Workers KV Storage:Edit` — recorded in TASK-024.

## Provenance

Grill session NOTE-006 (2026-07-06); supersedes the deployment-trigger part of RES-002 recommendation 1 as recorded in TASK-024. Related: ADR-006 (platform), INS-022 (the CI-deploy insight filed hours earlier off the same blocker).
