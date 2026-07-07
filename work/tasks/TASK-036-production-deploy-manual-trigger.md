---
id: TASK-036
title: Production deploy environment with owner-only manual trigger
epic: EPIC-013
status: abandoned
abandoned_reason: owner decision 2026-07-07 (NOTE-008) — production is off the table long enough that a standing placeholder is pure context cost; if production ever matters, file a fresh task
depends_on: [TASK-024]
created: 2026-07-06
abandoned: 2026-07-07
---

# TASK-036 — Production deploy environment with owner-only manual trigger

> **Abandoned 2026-07-07** (owner grill, NOTE-008). Production is far enough out that keeping this parked in the tracker costs context for no benefit. This supersedes NOTE-006's "gated until the owner asks". The content below — especially the open questions — is kept as raw material for whoever writes a fresh production task if that day comes; ADR-009's decision (production deploys are owner-only, never agent-reachable) stands regardless.

## Goal

A production Workers environment, separate from the auto-deployed dev worker, deployed **only** by a manual trigger via UI — never by agents, never automatically on push (ADR-009).

## Context

From the 2026-07-06 grill (NOTE-006): dev auto-deploys on every push to `main` (TASK-024); production was explicitly deferred — "for now let's not deal with production." When this unblocks, expect: a second worker (or wrangler environment) with its own name/URL, a `workflow_dispatch`-style promote workflow, and a decision on what artifact gets promoted (rebuild from `main` vs redeploy the exact dev build).

## Open questions (preserved for any future production task — no longer awaiting owner answers)

1. **Enforcement of "agents never touch prod" (raised in-session, deliberately left undecided):** a naked `workflow_dispatch` can be fired by an agent through the owner's `gh` CLI (`gh workflow run`), so the manual trigger alone is trust-based. A GitHub **environment** with a required-reviewer rule (the owner approves each prod run in the GitHub UI) makes it mechanical at the cost of one extra click per deploy. Which does the owner want? *(NOTE-007 wrinkle: dev has since moved to Cloudflare Workers Builds, which has no required-reviewer equivalent — if prod also uses Workers Builds, the enforcement mechanism must come from somewhere else, e.g. a protected prod branch Cloudflare watches; a prod-only GitHub Action remains a legitimate alternative.)*
2. Custom domain vs `workers.dev` for production, and the worker/environment naming scheme (the clean `jazz-master-web` name is currently the dev worker).
3. Does promotion rebuild from `main` or redeploy the exact artifact that was verified on dev?

## Acceptance criteria

- [ ] Production environment exists, separate from dev, with its own URL
- [ ] Deploy happens only via manual UI trigger; the enforcement question above is decided and implemented
- [ ] No production credential or trigger path is usable by agents on the dev machine
- [ ] Deployment steps and the production URL recorded in `architecture/overview.md`
- [ ] `bun run check` passes

## Verification

Trigger a production deploy through the chosen UI path; verify the production URL serves `/`, `/app/*`, and `/trpc/health`; demonstrate that no agent-reachable path (local shell, `gh` CLI) can produce a production deploy without the owner's UI action.
