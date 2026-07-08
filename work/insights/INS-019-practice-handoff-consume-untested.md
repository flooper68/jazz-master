---
id: INS-019
title: Practice page's handoff-consume effect (refresh/back must not restart a lesson) has no test
status: deferred
revisit_when: next PracticePage/dashboard handoff task or TASK-052 QA review findings
created: 2026-07-06
source: TASK-022
---

`PracticePage` consumes the dashboard's Start handoff by replacing history
state after mount (`startLessonId` → cleared), so a refresh or back-navigation
does not restart the lesson. That behavior predates TASK-022 and was untested
before it; the TASK-022 review flagged that the migration rewrote the effect
(react-router `location.state`/`navigate` → TanStack typed history state +
updater) and it is still only covered indirectly — no test asserts the state
is actually cleared after the handoff.

Why it might matter: the effect is the one piece of TASK-022 that is a rewrite
rather than a mechanical swap. A regression (e.g. the effect loops, or clears
too early/late) would surface as a confusing "lesson restarted itself" bug
that jsdom suites currently cannot catch. A small test — render via the
dashboard Start handoff, assert the run started, then assert
`router.state.location.state.startLessonId` is cleared — would pin it at the
page/integration layer.

## Triage note

2026-07-08 heartbeat - Deferred. This is a good small regression test, but not
worth a standalone task ahead of the owner-reported runner problems. Revisit
when PracticePage/handoff code is touched or when TASK-052 reviews the flow.
