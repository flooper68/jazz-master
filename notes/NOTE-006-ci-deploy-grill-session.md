---
id: NOTE-006
title: CI-only deploys, no local wrangler credentials (grill session)
created: 2026-07-06
source_type: grill-session
participants: [owner, agent]
processed: true
---

# NOTE-006 — CI-only deploys, no local wrangler credentials (grill session)

## Context

TASK-024 (Workers deploy) shipped fully prepped but blocked on an interactive `wrangler login` (expired OAuth token). Reporting that blocker, the agent asked the owner to log in; the owner instead made a decision-shaped call — "I want to setup just CI deploy without local wrangler, it is not secure to have the login here" — which triggered the implicit grill. Agenda proposed (trust trade, deploy-trigger semantics, token scope, first-publish bootstrap) and accepted. Three questions asked, one at a time.

## Discussion and decisions

1. **The threat model (Q1).** Asked to name the attacker — agents reading `~/.wrangler`'s near-account-wide OAuth token, or secrets-on-disk generally — the owner cut deeper than either option: **"AI agents should not have access to production."** No deploy credential may be readable from this machine; a locally-held scoped token was thereby rejected too, not just the OAuth login.
2. **Trigger semantics (Q2).** Agent pointed out that CI-on-push only removes *credential* access: in a trunk-based repo where agents push to `main` freely, auto-deploy means agents still effectively ship to the deployed URL. Owner chose **(a) auto-deploy on push to `main` — but reframed that deployment as the dev environment**; shipping to production will be a separate manual trigger via UI.
3. **Prod-trigger enforcement (Q3).** Agent surfaced the hole: agents operate the owner's `gh` CLI, so a plain `workflow_dispatch` prod workflow is agent-triggerable — the invariant would be trust-based unless a GitHub environment with a required-reviewer rule makes it mechanical. Owner: **"for now let's not deal with production"** — dev only; the question is recorded, not decided.

Close-out confirmed by the owner, who took the credential setup: create the scoped Cloudflare API token and add it (plus account id) as GitHub Actions secrets. Agent implements the workflow without ever handling the secret.

## Routed questions

| Question | Route | Landed |
|---|---|---|
| Prod-trigger enforcement: environment + required reviewer vs trust-based `workflow_dispatch` | Blocker (for prod only — deliberately undecided) | `TASK-036` Open questions |
| Prod naming/domain, promote-artifact semantics | Record | `TASK-036` Open questions |

## Write-backs and extracted work

- `architecture/decisions/ADR-009-deploy-credential-boundary.md` — the decision (accepted in-session).
- `work/tasks/TASK-024` reshaped: manual local deploy → CI dev deploy on push to `main`; wrangler-login blocker replaced by "owner adds GitHub secrets".
- `work/tasks/TASK-036` filed (gated): production environment + manual UI trigger, carrying the open questions.
- `work/insights/INS-022` outcome extended to ADR-009/TASK-036 — the insight became the decision within hours of being filed.
- Owner to-do: Cloudflare API token (Account / Workers Scripts / Edit; KV scope only if implementation can't eliminate the session binding) → GitHub secret `CLOUDFLARE_API_TOKEN`, plus `CLOUDFLARE_ACCOUNT_ID`.
