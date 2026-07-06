---
id: INS-009
title: Add a minimal Playwright e2e smoke suite when the first real practice workflow exists
status: accepted
outcome: [TASK-035]
created: 2026-07-06
source: TASK-006
---

RES-012 recommends not adding Playwright before a high-value browser workflow
exists, but the first guided practice or planner/history workflow should get a
tiny e2e suite. Candidate scope: one happy path, one refresh/persistence path,
phone-width smoke, console/network assertions, and Playwright traces only on
failure or local debugging.

## Product framing

Current condition: QA reviews use manual Playwright MCP, but the automated gate
has no real-browser coverage.
Desired condition: once a real practice loop exists, a minimal browser suite
catches broken routing, persistence, keyboard/responsive behavior, and console
errors on the most valuable path.
Affected user/workflow: practicing guitarist starting and resuming a guided
practice session.
Evidence: RES-012 findings 3 and 7.
Validation need: direct task candidate when TASK-013 or an equivalent real
practice workflow lands.

## Triage note

2026-07-06 (TASK-030 sweep) — Accepted (owner confirmation pending, batched in
the sweep report). The insight's own trigger has fired: the guided-practice
vertical slice (onboard → plan → practice → history → dashboard) is complete,
which is exactly the "first real practice workflow" this was waiting on. And
the automated gate is now the only thing standing behind that slice — QA
coverage is manual-only. Outcome: TASK-035 (proposed), scoped to the candidate
scope above.

2026-07-06 (grill session, NOTE-005) — acceptance **confirmed by the owner**;
TASK-035 sequenced after the EPIC-013 migration (depends_on TASK-024) and its
gate-placement question decided (separate `check:e2e`; `bun run check` stays
fast).
