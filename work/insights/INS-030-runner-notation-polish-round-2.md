---
id: INS-030
title: Runner-notation polish round 2 — items deferred from TASK-038's review
status: accepted
outcome: [TASK-048]
created: 2026-07-07
source: TASK-038
---

TASK-038's review passes (code-reviewer + ui-code-reviewer, no must-fix)
surfaced three below-the-line items, each a product judgment rather than a
defect, deferred instead of fixed in-task:

1. **First-draw layout shift**: the "Loading notation…" placeholder (`py-4
   text-sm`) is much shorter than the rendered score, so the first
   notation-bearing exercise of a session still pops the grade buttons down
   when the SVG appears. INS-029 §2 offered placeholder *or* reserved height;
   TASK-038 took the placeholder. Reserving a `min-h` on the wrapper would
   kill the shift, but the score's rendered height varies with
   width/exercise length — needs a real design pass, not a constant.
2. **Keyboard-scrollability of the score's overflow region**: the
   `overflow-x-auto` wrapper in `PracticeRunner` has no `tabindex`, so
   keyboard-only users can't scroll to the clipped right side on narrow
   viewports (WCAG 2.1.1-adjacent). Mitigation today: the full content is in
   the `aria-label` and the score is non-interactive imagery. Making the
   region focusable adds a tab stop to every notation exercise — decide
   deliberately (possibly alongside a broader focus-order pass).
3. **aria-label content — summary vs. spelled notes**: the runner overrides
   `<Notation>`'s spelled-sequence default with a summary label per INS-029
   §1 ("B♭ major — middle position — staff and tablature"). The ui-reviewer's
   counterpoint: that discards the score's musical payload for screen-reader
   users, who now get only what the heading already says. Options: append a
   short spelled sequence, or expose it via a visually-hidden description.
   Owner call on what a non-sighted practicing guitarist actually wants here.

All three touch `codebase/apps/web/src/components/Notation.tsx` /
`PracticeRunner.tsx`. Natural batching: fold into the next QA product review
of the runner ([[TASK-039]] is nearby in code but is bundle work, not UX).

## Triage note

2026-07-08 heartbeat - Accepted into TASK-048. NOTE-011 raised notation
readability/focus/toggles to the top priority, and these polish items touch the
same score layout and accessibility decisions.
