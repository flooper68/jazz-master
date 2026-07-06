---
id: INS-011
title: Content-model authoring polish — display/duration edge cases the validator allows
status: new
created: 2026-07-06
---

TASK-011's review (code-reviewer agent pass) surfaced three low-impact gaps in
`apps/web/src/content/validate.ts` that were deliberately deferred to keep the model
minimal until TASK-012 (lesson pack authoring) and TASK-013 (practice runner) reveal
the real contract:

1. **Empty `display` arrays pass validation.** If the runner assumes at least one
   display hint per exercise, `display: []` should be a validation problem.
2. **Fractional repetition counts pass.** `duration: { kind: 'repetitions', count: 2.5 }`
   is accepted; repetitions should probably require a positive integer (minutes can
   stay fractional).
3. **Display hints aren't checked against material kind.** A `scale` exercise can
   declare `display: ['chordDiagram']` — nonsensical but allowed. Whether to constrain
   this (validator rule vs. narrowing the type per material kind) is an authoring-time
   design call.

Revisit when TASK-012 authors the first pack or TASK-013 consumes `display` — whichever
lands first will show which of these are real constraints vs. imagined ones.
