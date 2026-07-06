---
id: INS-010
title: Add automated axe accessibility checks after a browser test harness exists
status: deferred
revisit_when: TASK-035 (Playwright e2e smoke suite) ships — axe runs inside that harness
created: 2026-07-06
source: TASK-006
---

RES-012 recommends manual accessibility review immediately and automated axe
checks after the project has a browser/e2e harness. Candidate scope: run axe on
the app shell and any interactive practice flow, fail on violations, and keep
manual keyboard/focus/semantic review in QA because automated checks are partial.

## Product framing

Current condition: accessibility is reviewed manually during QA, with no
automated regression check.
Desired condition: common WCAG violations are caught by the automated browser
suite while manual review covers focus, keyboard flow, semantics, and product
judgment.
Affected user/workflow: keyboard and assistive-technology users navigating
practice modules.
Evidence: RES-012 finding 4.
Validation need: direct task candidate after INS-009 or any browser harness
task is accepted.

## Triage note

2026-07-06 (TASK-030 sweep) — Deferred, not accepted alongside INS-009: axe
needs the harness that TASK-035 builds, and stacking a second browser-infra
task before the first ships would just inflate the queue. When TASK-035 lands,
this becomes a direct task candidate (likely a small follow-up inside the same
suite). ISSUE-002 is a reminder of the limits: axe would not catch that focus
bug — manual review keeps that job either way.
