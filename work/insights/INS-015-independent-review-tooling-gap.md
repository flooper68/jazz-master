---
id: INS-015
title: Independent review process assumes subagent availability that current tool policy may deny
status: deferred
revisit_when: next grill session — needs an owner decision (exact question in the triage note below)
created: 2026-07-06
source: TASK-017
---

Several shipped work items now record the same deviation: `processes/code-review.md`
requires an independent review agent pass, but the available subagent tool in
some sessions allows spawning only after an explicit user delegation request.
When that happens, agents complete a local checklist review and log the
limitation, but the process still says the work must be independently reviewed.

Why it might matter: the quality gate has a repeated, predictable failure mode
that is currently resolved by ad hoc task-log caveats rather than a canonical
fallback. Triage should decide whether the process needs an owner-approved
fallback, a standing user authorization pattern, or different tooling.

## Triage note

2026-07-06 (TASK-030 sweep) — Deferred: this is an owner decision about the
quality gate, not something an agent should settle unilaterally. Exact question
for the next grill session: **when a session cannot spawn an independent review
subagent, which fallback satisfies hard rule 5 — (a) a standing owner
authorization that agents may always spawn review subagents, (b) a documented
local-checklist fallback written into `processes/code-review.md` as an accepted
degraded mode, or (c) neither — the work must not ship until an independent
pass is possible?** Evidence unchanged: multiple task logs record the same ad
hoc deviation.
