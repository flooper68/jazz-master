---
id: INS-010
title: Add automated axe accessibility checks after a browser test harness exists
status: new
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
