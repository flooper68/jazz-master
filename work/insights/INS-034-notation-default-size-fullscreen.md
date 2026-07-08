---
id: INS-034
title: Notation renders too small — grow the default, add a fullscreen focus mode
status: accepted
outcome: [TASK-048]
created: 2026-07-07
source: NOTE-009
---

Owner testing feedback (grilled, NOTE-009): the tabs/notation in the practice
runner are "quite small", and a fullscreen mode to focus on the score would
help. The grill established that the score is **too small even sitting close
to the laptop** — so the inline default rendering itself must grow; a
fullscreen/focus mode (score fills the viewport, minimal controls — useful at
music-stand distance with guitar in hand) comes on top of that, not instead
of it.

Why it matters to the practice loop: the score is the thing being practiced
from; if it can't be read comfortably, the notation work (TASK-037/038) isn't
paying off in actual sessions.

Related open items to batch with: [[INS-029]] §3 (narrow-viewport legibility —
fit-to-width vs. min-width + scroll) and [[INS-030]] §1 (first-draw layout
shift — reserved height needs a design pass). Growing the default size and
adding a focus mode touch the same sizing decisions; resolve them together in
one notation-sizing pass rather than three patches. Also adjacent:
[[INS-035]] (staff/TAB toggle) frees vertical space that a bigger default
rendering will want.

## Triage note

2026-07-08 heartbeat - Accepted into TASK-048. NOTE-011 upgraded this from
polish to an ASAP practice-loop problem.
