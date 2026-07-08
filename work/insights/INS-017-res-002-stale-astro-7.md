---
id: INS-017
title: RES-002 stale_when tripped — Astro 7 is current
status: accepted
outcome: [TASK-053]
created: 2026-07-06
source: TASK-021
---

RES-002's `stale_when` names "Astro 7" as a staleness trigger, and TASK-021
installed `astro@7.0.6` — the research was written against Astro 5-era docs
(accessed 2026-07-05), so the condition has tripped.

Observed in practice: the core recommendations held (adapter targets Workers,
`output: 'server'`, `client:only="react"`, catch-all page all worked as
described), but one thing the research missed bit immediately — the Astro 7
Cloudflare adapter runs dev-server SSR inside workerd, so a `wrangler.jsonc`
with `nodejs_compat` is required for `astro dev` to serve anything at all
(without it every route 500s with `process is not defined`, and Astro's own
logger crashes masking the real error). Astro 7 also daemonizes `astro dev`
(`astro dev stop/status/logs`).

Suggested handling for the next knowledge-maintenance sweep (TASK-030's
successor): re-verify RES-002's still-unconsumed recommendations (TanStack
Router integration for TASK-022, tRPC adapter shape for TASK-023, Hyperdrive
for the gated TASK-025) against Astro 7 / current docs before those tasks
consume them, and record a staleness note in RES-002 rather than re-running
the whole research.

## Triage note

2026-07-08 heartbeat - Accepted into TASK-053, the next
knowledge-maintenance sweep. This is exactly a stale-research/feed-forward
audit item, not a product implementation task.
