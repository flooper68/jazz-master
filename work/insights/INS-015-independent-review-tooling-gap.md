---
id: INS-015
title: Independent review process assumes subagent availability that current tool policy may deny
status: new
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
