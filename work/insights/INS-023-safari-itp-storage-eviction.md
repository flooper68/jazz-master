---
id: INS-023
title: Safari ITP 7-day eviction threatens ALL local-first practice data, not just future audio
status: accepted
outcome: [TASK-053]
created: 2026-07-07
source: TASK-015
---

RES-014 Q6 (verified against MDN and WebKit sources during TASK-015 review): Safari's
ITP evicts *all* script-writable storage — localStorage included — after 7 days without
user interaction with the site. That applies to the existing typed stores (profile,
sessions, plans) today, independent of any future audio work: a guitarist who practices
via the app but doesn't open it for a week on Safari loses their entire history.

Worth a knowledge-maintenance check: does ADR-002 document this risk, and should the app
request `navigator.storage.persist()` (and/or surface an export path) to mitigate it?
Related: [[INS-009]] (an e2e persistence spec wouldn't catch a browser-policy eviction).

## Product framing
Current condition: no eviction mitigation; ADR-002's local-first posture assumes localStorage is durable.
Desired condition: practice history survives Safari's 7-day ITP window, or the risk is a documented, owner-accepted trade-off.
Affected user/workflow: any Safari/iOS user with gaps between practice sessions.
Evidence: RES-014 Q6 citations (MDN storage quotas and eviction criteria; WebKit storage-policy posts).
Validation need: research/spike | direct task candidate

## Triage note

2026-07-08 heartbeat - Accepted into TASK-053. This should be decided in a
knowledge-maintenance pass that can update ADR-002/wiki or file a focused
mitigation task (`navigator.storage.persist()`, export, or owner-accepted
risk) with the citations in front of it.
