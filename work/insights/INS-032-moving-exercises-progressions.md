---
id: INS-032
title: Moving exercises — arpeggios over chord progressions, changing every bar
status: deferred
revisit_when: after TASK-054 and the current focus issues are handled, when picking the next product feature beyond hygiene
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

**Sequencing decision (owner):** this waits for play-along ([[INS-036]]).
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

2026-07-08 TASK-053 sweep - The runner usability blockers named above have
shipped (TASK-048, TASK-049, TASK-050), so this is now the strongest next
product-feature candidate. Kept deferred for the moment because TASK-054 and the
confirmed focus defects are due hygiene/polish ahead of a content-model redesign.
Promote together with INS-033 when the owner asks for the next feature task.
