---
id: INS-009
title: Add a minimal Playwright e2e smoke suite when the first real practice workflow exists
status: new
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
