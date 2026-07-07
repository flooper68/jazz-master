# Wiki log

Append-only, newest at the top. One line per change: date — what changed and why, with the driving item.

- 2026-07-07 — `product/overview` under-the-hood + built-today sections updated for the first live deploy (TASK-024 done): the dev environment is live on workers.dev, auto-deployed on every push to `main`.
- 2026-07-07 — `product/overview` practice-flow + built-today sections updated for the two de-risking research results: notation rendering decided (VexFlow 5, ADR-010/RES-013, TASK-014) and recording/scoring staged-go (RES-014, TASK-015); goal-4 research is done.
- 2026-07-07 — `project/lifecycle-of-a-change` ship step now cites the TASK-031 commit-isolation guardrails (pathspec commits, worktree-per-agent).
- 2026-07-06 — `product/overview` + `project/lifecycle-of-a-change` updated for the ADR-009 amendment (grill NOTE-007): the deploy mechanism is Cloudflare Workers Builds, not GitHub Actions — no deploy token exists anywhere.
- 2026-07-06 — `product/overview` + `project/lifecycle-of-a-change` updated for ADR-009 (grill NOTE-006): deploys are CI-only — push to `main` auto-deploys dev, agents never hold deploy credentials, production deferred (TASK-036).
- 2026-07-06 — `product/overview` under-the-hood section updated for the Workers-deploy prep (TASK-024): the health status chip is dev-only now; deployment is prepared but blocked on an owner `wrangler login`.
- 2026-07-06 — `product/overview` under-the-hood section updated for the tRPC scaffold landing (TASK-023): a typed `/trpc/health` API surface exists (scaffolding only — no product feature is server-backed; local-first stands).
- 2026-07-06 — `product/overview` under-the-hood section updated for the Astro shell landing (TASK-021): the practice app now lives under `/app/*` behind an Astro landing page; product URLs carry the `/app` prefix.
- 2026-07-06 — `product/overview` under-the-hood + built-today sections updated for ADR-006 acceptance and the owner-directed migration-first ordering (TASK-020 done, grill session NOTE-005).
- 2026-07-06 — `product/overview` built-today section updated for the dashboard v1 shipping and EPIC-012 completing (TASK-019): `/` is now the product's front door and the guided-practice vertical slice is finished.
- 2026-07-06 — `product/overview` built-today section updated for the practice-history page shipping and EPIC-012 opening (TASK-018): every session is now findable at `/history`.
- 2026-07-06 — `product/overview` under-the-hood section updated for ADR-006 (proposed): the EPIC-013 platform target is now a written decision, not "when written" (TASK-020).
- 2026-07-06 — `project/overview`, `project/lifecycle-of-a-change`, and `project/quality-loops` updated for the new read-only status-report process and `work:status` facts command (TASK-034).
- 2026-07-06 — `product/overview` built-today section updated for the adaptive daily planner shipping and EPIC-011 completing (TASK-017): `/practice` now shows a persisted Today's plan with reasons and runner handoff.
- 2026-07-06 — `product/overview` built-today section updated for local profile onboarding becoming the first EPIC-011 planner input (TASK-016).
- 2026-07-06 — `product/overview` built-today section updated for the guided practice runner shipping and EPIC-008 completing (TASK-013): sessions now run and persist end to end.
- 2026-07-06 — `project/overview` sources now cite `AGENTS.md` (canonical agent index; `CLAUDE.md` became a symlink to it, NOTE-003).
- 2026-07-06 — `product/overview` built-today section updated for the first lesson pack landing on the Practice page (TASK-012).
- 2026-07-06 — `project/overview` gained the grill loop (owner-facing rhythm) and `project/lifecycle-of-a-change` triage step now notes deferred-grill confirmation (ADR-008, NOTE-001).
- 2026-07-06 — `product/overview` under-the-hood + built-today sections updated for the new curriculum content layer (`apps/web/src/content/`, TASK-011).
- 2026-07-06 — Round-2 synthesis pages (TASK-033): `product/theory-engine` (compiled from the theory package source), `project/quality-loops` (from ADR-004 + RES-006/RES-011 + the loop processes), `project/how-the-wiki-works` (from RES-003 + ADR-007) — the top three gaps from the post-TASK-032 gap analysis.
- 2026-07-06 — Wiki created per ADR-007 (TASK-032): schema, index, and three seed pages (`product/overview`, `project/overview`, `project/lifecycle-of-a-change`) compiled from strategy, architecture, and process docs.
