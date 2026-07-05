---
id: TASK-020
title: Write ADR-005 — hybrid Astro SSR + SPA on Cloudflare Workers with tRPC and Hyperdrive
epic: none            # platform migration — candidate new epic, owner to decide
status: backlog
depends_on: []
research: RES-002
created: 2026-07-05
---

# TASK-020 — Write ADR-005: hybrid Astro SSR + SPA on Cloudflare Workers with tRPC and Hyperdrive

## Goal

An accepted ADR that records the platform decision from RES-002 — Astro on Cloudflare Workers hosting the React app as an SPA island, tRPC API routes, and Hyperdrive in front of Railway Postgres — before any implementation starts.

## Context

RES-002 recommendation 7 requires an ADR because this changes the system shape: from a local-only Vite SPA (ADR-001 stack, ADR-002 local-first) to hybrid SSR + Worker API + external database. The ADR must state what it supersedes and what it keeps: ADR-002's local-first UX is retained for now (practice state stays in localStorage; server state arrives only when a task requires it), but the "no backend" assumption is superseded. Cover the five load-bearing choices and their rejected alternatives from RES-002: Workers not Pages, `/app/*` SPA boundary via `client:only="react"`, TanStack Router scoped inside the SPA, tRPC on an Astro catch-all API route with one shared React Query client, and Hyperdrive (never direct browser→database access). Update `architecture/overview.md` and the stack notes in `CLAUDE.md` in the same change, per hard rule 6.

## Acceptance criteria

- [ ] `architecture/decisions/ADR-005-*.md` exists, following the format of existing ADRs
- [ ] States context, decision, consequences, and considered-and-rejected alternatives (full Astro rewrite, global `/*` SPA catch-all, direct DB access, Pages deployment)
- [ ] Explicitly records the relationship to ADR-002 (what is superseded, what is kept)
- [ ] Defines the migration slicing: infrastructure-only first slice; no auth or persistence in it
- [ ] `architecture/overview.md` and `CLAUDE.md` stack section reference the new target architecture (marked as in-migration)
- [ ] Backlog items citing ADR-002's "no backend" as fact (TASK-016, EPIC-010, EPIC-011) get their justification wording updated to the ADR-005 framing — decisions in them are unchanged
- [ ] Owner has reviewed and accepted the ADR

## Verification

Read ADR-005 against RES-002 recommendations 1–8 — every recommendation is either adopted, adapted, or explicitly deferred with a reason. Owner confirms acceptance.
