---
id: INS-027
title: Route changes could adopt useViewFocus too
status: deferred
revisit_when: next app-shell or focus-management task
created: 2026-07-07
source: ISSUE-002
---

ISSUE-002 fixed focus loss on same-route view swaps with the shared `useViewFocus`
hook, deliberately leaving route changes out: nav-link navigation keeps focus on the
still-mounted link, so focus is not dropped to `body` — a milder, different problem.
If a QA review judges that insufficient for screen-reader users (no announcement of
the new page), the same hook keyed on route id — focusing the main landmark, which
already carries `tabIndex={-1}` — is the natural extension. Related: [[INS-010]]
(axe checks wouldn't catch this), [[INS-009]] (a Playwright a11y flow could).

## Triage note

2026-07-08 heartbeat - Deferred. ISSUE-003 and TASK-052 will inspect the
current focus behavior in a real browser; promote only if that review confirms
route-change focus is hurting the practice flow.

2026-07-08 TASK-053 sweep - TASK-052 inspected navigation/focus. It found modal
focus restoration as a concrete defect (`ISSUE-004`) and kept runner-start focus
as `ISSUE-003`; route changes themselves did not produce a new defect. Keep
deferred for the next app-shell/focus-management task.
