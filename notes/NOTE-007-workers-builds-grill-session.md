---
id: NOTE-007
title: Ditch GitHub Actions for Cloudflare Workers Builds (grill session)
created: 2026-07-06
source_type: grill-session
participants: [owner, agent]
processed: true
---

# NOTE-007 — Ditch GitHub Actions for Cloudflare Workers Builds (grill session)

## Context

Minutes after the `deploy-dev` GitHub Actions workflow shipped and its first run verified the design (install ✓, `bun run check` ✓ on a real runner, deploy ✗ exactly at the missing-token step), the owner redirected: "we should ditch the github action, the cloudflare workers will be deployed their application" — i.e. **Cloudflare Workers Builds**: connect the repo in the Cloudflare dashboard and let Cloudflare build and deploy on push. Continuation of the NOTE-006 decision; agent noted this *strengthens* ADR-009 (no deploy token exists anywhere — the credential is implicit in the Cloudflare↔GitHub connection) rather than reversing it.

## Discussion and decisions

1. **Gate placement (Q1).** The one capability lost with the Action: the full `bun run check` gate before deploy. Offered (a) put the gate in Cloudflare's build command — red tests block the dev deploy, slower builds — or (b) build-and-deploy only, trusting the local/process gate. Owner: **(a)** — the check gate runs in Workers Builds before every dev deploy.

## Write-backs and extracted work

- `.github/workflows/deploy-dev.yml` deleted (one commit after it landed; its green check-on-runner run stands as evidence the gate works in CI).
- ADR-009 amended: mechanism is Workers Builds, invariant strengthened to "no deploy token exists anywhere"; GitHub-secrets consequences replaced.
- TASK-024 criteria/blocker updated: no secrets to create — the owner connects the repo to the worker in the Cloudflare dashboard instead (settings recorded in the task).
- `architecture/overview.md` Deployment section + wiki (`product/overview`, `project/lifecycle-of-a-change`) updated.
- Owner to-do (replaces the token/secrets to-do from NOTE-006): Cloudflare dashboard → Workers & Pages → connect the GitHub repo to the `jazz-master-web` worker, branch `main`, root directory `codebase/apps/web`, build command `cd ../.. && bun install --frozen-lockfile && bun run check`, deploy command `bunx wrangler deploy`.
