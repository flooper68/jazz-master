---
id: INS-013
title: Wire validateLessons into a dev-time assertion when the practice runner lands
status: deferred
revisit_when: next content-model, lesson-pack, or JSON-pack task
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

## Triage note

2026-07-06 (TASK-030 sweep) — Deferred. The runtime consumer now exists
(TASK-013 shipped), so the assertion is buildable — but it is a two-line
hardening with no current failure mode (the pack is CI-validated and static).
Not worth a standalone task; fold into the next task that touches the runner
or content layer, together with INS-014's error-boundary polish (the two guard
the same failure).

2026-07-08 TASK-053 sweep - Several runner tasks shipped without touching the
lesson-pack contract, and no malformed-pack problem surfaced. Narrowed the
trigger to content/model work, especially the future JSON-pack redesign, where a
runtime assertion or load-time schema validation will matter.
