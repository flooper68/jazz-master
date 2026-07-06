---
id: NOTE-005
title: ADR-006 acceptance + knowledge-sweep confirmations (grill session)
created: 2026-07-06
source_type: grill-session
participants: [owner, agent]
processed: true
---

# NOTE-005 — ADR-006 acceptance + knowledge-sweep confirmations (grill session)

## Context

Owner-requested grill ("grill me for the decision") immediately after the first knowledge-maintenance sweep (TASK-030) shipped. Agenda proposed by the agent and confirmed as-is by the owner: (1) ADR-006 acceptance with its three deferred-grill questions, (2) TASK-035 e2e suite confirmation + its two open questions, (3) the INS-012 process edit + its meta-question, (4) INS-015 review-fallback policy, (5) INS-016 trend gating. Twelve questions, one at a time.

## Discussion and decisions

1. **Platform timing (ADR-006 Q1).** Agent framed the trade-off: weeks of agent capacity on plumbing while the practice hypothesis sits untested, vs migrating a bigger app later. Owner: the riskier later migration is the worse failure. Agent pushed back that only the router migration scales with app size (the island move is wholesale) and that dogfooding continues during migration — the honest version is "do it while the app is small", not "urgent". Owner held, and additionally directed the **migration chain as next work**, ahead of the notation/scoring research (TASK-014/015).
2. **Railway (ADR-006 Q2).** Told explicitly that Neon/Supabase/D1 were never compared and offered demote-to-TBD or a comparison task, owner chose: **go with Railway** — now a deliberate choice, still gated behind TASK-025.
3. **Landing page (ADR-006 Q3).** Owner: **barebones** — app name, one sentence, one link into `/app`; anything marketing-shaped needs its own future epic.
   → ADR-006 `accepted`; Open-questions section replaced by an Acceptance record; TASK-020 `done`; TASK-021 unblocked.
4. **E2e suite sequencing (TASK-035).** Agent surfaced the new interplay: the suite guards exactly the risk class the migration creates — before-migration means a safety net but a route-prefix rework; after means the migration is verified manually. Owner: **after** — TASK-035 gets `depends_on: [TASK-024]`, acceptance of INS-009 confirmed in the same answer.
5. **Gate placement (TASK-035).** Owner: **keep the gate fast** — separate `check:e2e` with named trigger points (QA reviews, deploys, practice-flow tasks) in the process docs, not inside `bun run check`. Remaining ceiling question routed as *record*: ~5 specs, a11y via INS-010's trigger (owner did not object).
6. **Epic status flip (INS-012).** Owner confirmed **claim-time** as shipped.
7. **Process-edit acceptances (INS-012 meta).** Owner: "small tweaks after confirmation are fine" — ambiguity called out and pinned: **(b) confirm-then-ship**. Sanctioned in `processes/triage.md` as a new accept path; the INS-012 edit that shipped pre-confirmation stands (confirmed live) and is the last to ship in that order.
8. **Review fallback (INS-015).** Owner chose **(a) standing authorization** to spawn review subagents; follow-up pinned the residual case: **logged self-review as sanctioned degraded mode** when spawning still fails. Written into `processes/code-review.md` step 2.
9. **Trend visuals (INS-016).** Owner: **use machine scores** — trend work strictly gated on EPIC-010; insight stays deferred with that single trigger.

## Routed questions

- TASK-035 spec ceiling → record (kept ~5; a11y flows via INS-010's own trigger).

## Write-backs (this session's commits)

ADR-006 (accepted + Acceptance section), TASK-020 (done), EPIC-013 (status, goal already de-staled by sweep), TASK-035 (backlog, depends_on TASK-024, questions resolved), INS-009/012/015/016 (confirmations/resolutions), `processes/triage.md` (accept-via-process-edit, confirm-then-ship), `processes/code-review.md` (standing authorization + degraded mode), AGENTS.md + `architecture/overview.md` + `wiki/product/overview.md` + `wiki/log.md` (ADR-006 accepted; overview's current-state paragraph also gained the missed TASK-019 dashboard entry), `architecture/LOG.md`.

## For the owner (strategy — agents never edit it)

- `strategy/goals.md` "Later" still lists "Deployed publicly as a static site"; ADR-006 (accepted) supersedes that with a Cloudflare Workers deploy. Proposal: reword that bullet to "Deployed publicly (Cloudflare Workers, ADR-006)" at the next goals revisit.
- The migration-first ordering sits alongside goal 4 (de-risk notation/scoring); goals don't order work, so no conflict — but if the migration stretches, goal 4 is what it's displacing.

## Still open after this session

- TASK-031 (commit-isolation guardrails) remains `proposed` — not on this agenda, awaiting confirmation at a future session.
