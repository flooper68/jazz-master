---
id: INS-028
title: Onboarding wizard's phone-width behavior is unverified
status: deferred
revisit_when: next QA pass that explicitly clears storage and walks onboarding at phone width
created: 2026-07-07
source: ISSUE-001
---

ISSUE-001's fix was browser-verified at 375px on all eight routed pages, but the
onboarding wizard never rendered in that session (a stored profile skipped it), so its
mobile-width behavior remains unchecked — it renders outside the fixed shell that was
fixed. Candidate check for the next QA review at phone width: clear storage, walk the
wizard at 375px, watch for horizontal overflow. Related: [[INS-009]] (the planned
Playwright phone-width smoke starts from a clean profile and would cover this).

## Triage note

2026-07-08 heartbeat - Deferred into TASK-052. This is a QA charter, not a
standalone implementation task unless the review reproduces a defect.

2026-07-08 TASK-053 sweep - TASK-052 covered phone-width routed pages and found
no page-level overflow, but its evidence list does not explicitly clear storage
and walk the onboarding wizard. Keep deferred with that sharper verification
trigger rather than pretending the exact concern was closed.
