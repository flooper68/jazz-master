---
id: INS-013
title: Wire validateLessons into a dev-time assertion when the practice runner lands
status: new
created: 2026-07-06
source: TASK-012
---

The lesson pack's integrity is currently guaranteed only by tests
(`content/lessons.test.ts` asserts `validateLessons(LESSONS)` returns `[]` and
re-resolves every exercise). TASK-012's independent review suggested that once the
guided runner (TASK-013) consumes the pack, a dev-time assertion — e.g. validate on
module load in dev builds and `console.error`/throw on problems — would make a
malformed future pack fail loudly in the running app too, not just in CI. Cheap to
add inside TASK-013's scope; pointless before a runtime consumer exists.
