---
id: INS-022
title: CI/API-token deploys would remove the interactive-login failure mode
status: accepted
outcome: [TASK-024, TASK-036]
created: 2026-07-06
source: TASK-024
---

TASK-024 kept deployment manual/owner-triggered by design, and its first run was
blocked by exactly the weak point of that design: the stored Cloudflare OAuth
token had expired and could not refresh in a non-interactive session, so an
otherwise-finished deploy sat waiting on a human `wrangler login`.

A `CLOUDFLARE_API_TOKEN` (scoped to Workers deploy) — used either by CI on push
to main or just exported for local agent runs — would make `bun run deploy`
runnable unattended and immune to OAuth expiry. Cost: a secret now exists and
needs a home (repo CI secret or owner env), which TASK-024 deliberately avoided.
Revisit once the first publish is done and deploys become routine; pairs
naturally with the "later" CI upgrade path in `processes/git-workflow.md`.

**Resolution (same day):** the owner made the call unprompted on reading the
blocker report — grilled and decided in NOTE-006, recorded as ADR-009. Stronger
than proposed here: no locally-readable deploy credential at all, CI-only; dev
auto-deploys on push to `main` (TASK-024 reshaped), production deferred to a
manual UI trigger (TASK-036, gated).
