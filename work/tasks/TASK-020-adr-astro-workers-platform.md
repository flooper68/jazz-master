---
id: TASK-020
title: Write ADR-006 — hybrid Astro SSR + SPA on Cloudflare Workers with tRPC and Hyperdrive
epic: EPIC-013
status: done
depends_on: [TASK-026]
research: RES-002
created: 2026-07-05
---

# TASK-020 — Write ADR-006: hybrid Astro SSR + SPA on Cloudflare Workers with tRPC and Hyperdrive

## Goal

An accepted ADR that records the platform decision from RES-002 — Astro on Cloudflare Workers hosting the React app as an SPA island, tRPC API routes, and Hyperdrive in front of Railway Postgres — before any implementation starts.

## Context

RES-002 recommendation 7 requires an ADR because this changes the system shape: from a local-only Vite SPA (ADR-001 stack, ADR-002 local-first) to hybrid SSR + Worker API + external database. The ADR must state what it supersedes and what it keeps: ADR-002's local-first UX is retained for now (practice state stays in localStorage; server state arrives only when a task requires it), but the "no backend" assumption is superseded. Cover the five load-bearing choices and their rejected alternatives from RES-002: Workers not Pages, `/app/*` SPA boundary via `client:only="react"`, TanStack Router scoped inside the SPA, tRPC on an Astro catch-all API route with one shared React Query client, and Hyperdrive (never direct browser→database access). Update `architecture/overview.md` and the stack notes in `CLAUDE.md` in the same change, per hard rule 6.

**ADR-005 note (2026-07-05):** this deliverable was originally numbered ADR-005; that slot is now taken by the accepted monorepo/`codebase/` split ADR, so this task writes **ADR-006** and should reference ADR-005 for where the code lives. Implementation happens after the TASK-027 restructure — all `src/...` paths in TASK-021–025 read as `codebase/apps/web/src/...`.

## Acceptance criteria

- [x] `architecture/decisions/ADR-006-*.md` exists, following the format of existing ADRs
- [x] States context, decision, consequences, and considered-and-rejected alternatives (full Astro rewrite, global `/*` SPA catch-all, direct DB access, Pages deployment)
- [x] Explicitly records the relationship to ADR-002 (what is superseded, what is kept)
- [x] Defines the migration slicing: infrastructure-only first slice; no auth or persistence in it
- [x] `architecture/overview.md` and `CLAUDE.md` stack section reference the new target architecture (marked as in-migration)
- [x] Backlog items citing ADR-002's "no backend" as fact (TASK-016, EPIC-010, EPIC-011) get their justification wording updated to the ADR-006 framing — decisions in them are unchanged
- [x] Owner has reviewed and accepted the ADR — grill session 2026-07-06 (NOTE-005); all three deferred-grill questions answered, recorded in the ADR's Acceptance section

## Verification

Read ADR-006 against RES-002 recommendations 1–8 — every recommendation is either adopted, adapted, or explicitly deferred with a reason. Owner confirms acceptance.

## Log

### 2026-07-06 — claimed (agent)
Plan: write `architecture/decisions/ADR-006-astro-workers-hybrid-platform.md` (status `proposed` — owner absent, so acceptance is a deferred grill per `processes/grilling.md`; questions recorded in the ADR under "Open questions"). Cover the five load-bearing choices + rejected alternatives from RES-002, the ADR-002 supersede/keep split, and the infra-only first slice. Same change: mark the target architecture as in-migration in `architecture/overview.md` and AGENTS.md (CLAUDE.md symlink), reword the ADR-002-as-fact justifications in TASK-016 / EPIC-010 / EPIC-011 (decisions unchanged), one line in `architecture/LOG.md`. Knowledge-only change — no code, testing-strategy layer n/a; gate is `bun run check` (must stay green) + reading the ADR against RES-002 recs 1–8. Task will end `blocked: awaiting owner acceptance`, which correctly holds TASK-021+ until the owner accepts.

### 2026-07-06 — written, blocked on owner acceptance
ADR-006 written as planned; also updated `wiki/product/overview.md` (its "ADR-006 when written" sentence — same-commit rule in `processes/wiki-maintenance.md`) + `wiki/log.md`, and EPIC-013's Current status. Verification done: RES-002 recs 1–8 all covered — 1–5 and 8 adopted as decisions 1–4 + the slicing section, 6 (Hyperdrive) adopted but deferred behind TASK-025's gate, 7 is the ADR itself; the coverage line is in the ADR. `bun run --cwd codebase check` green (knowledge-only diff). All criteria ticked except owner acceptance → status `blocked`, three deferred-grill questions recorded in the ADR (operational commitment timing, Railway-vs-alternatives never compared, landing-page scope). Next owner session should open with those; on acceptance, flip ADR-006 to `accepted`, remove its Open-questions section, set this task `done`, and unblock TASK-021.

### 2026-07-06 — accepted by owner, task done

Live grill session (NOTE-005) resolved all three open questions: (1) operational
commitment confirmed — later-migration risk judged worse than deferred feature
work, and the TASK-021 chain is owner-directed next work ahead of TASK-014/015;
(2) Railway confirmed as a deliberate provider choice; (3) slice-one landing
page pinned to barebones. ADR-006 flipped to `accepted`, its Open-questions
section replaced by the Acceptance record. TASK-021 is unblocked.
