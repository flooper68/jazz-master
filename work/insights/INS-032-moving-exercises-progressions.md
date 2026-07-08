---
id: INS-032
title: Moving exercises — arpeggios over chord progressions, changing every bar
status: deferred
revisit_when: TASK-048, TASK-049, and TASK-050 ship; then design the moving-exercise model with JSON packs
created: 2026-07-07
source: NOTE-009
---

Owner testing feedback (grilled, NOTE-009): "the exercises are quite boring —
arpeggios with chord progressions in different keys would be great." The grill
pinned the boredom down to **static repetition**: an exercise today holds one
material (one scale or one arpeggio in one position) repeated for N minutes.
The wanted exercise *moves* — the arpeggio changes with each chord as a
progression cycles, e.g. bar-by-bar arpeggios through a ii–V–I, then through
different keys.

Model implication: the `Exercise` content model
(`codebase/apps/web/src/content/types.ts`) carries a single `material`; a
moving exercise needs a sequence of chords over time (per-bar changes). That
is a real content-model extension, not new authoring against the current
model.

**Sequencing decision (owner):** this waits for play-along ([[INS-031]]).
Playing changes without hearing them was judged "static repetition with extra
steps" — land the play-along loop first, then author moving exercises against
it. The two form one arc: the loop, then content that moves inside it.

The pack format redesign this forces is also where "exercises as JSON"
([[INS-033]]) folds in — one model redesign, not two.

## Triage note

2026-07-08 heartbeat - Deferred. The play-along prerequisite is now satisfied,
but NOTE-011 identified more basic runner usability problems (readability,
timer/grading flow, tempo/volume controls) that should land first. Revisit once
those are fixed, then promote this together with INS-033.
