---
id: INS-033
title: Exercise packs as JSON data — agent-generated, schema-validated at load
status: deferred
revisit_when: promote together with INS-032 when the next product-feature task is the moving-exercise/content-model redesign
created: 2026-07-07
source: NOTE-009
---

Owner testing feedback (grilled, NOTE-009): "it isn't easy to define new
exercises — they should be just data in JSON format." The grill found the real
friction: not the owner hand-editing files, and not in-app authoring — the
point is **scale via agents**. Agents (or scripts) should be able to emit new
exercise packs as pure data, validated against a schema at load, without a
TypeScript change going through code review. Today packs are typed TS in
`codebase/apps/web/src/content/lessons.ts`, built with helper functions, so
every new exercise is a code change through the dev loop.

**Sequencing decision (owner):** one redesign, later. Nothing blocks on this
today; fold the JSON pack format into the exercise-model redesign that the
moving-exercise work already forces ([[INS-032]], which itself waited on
play-along [[INS-036]]) — avoid designing a pack format twice.

When it lands it is architecture-shaped: JSON pack format + schema validation
(the `validate.ts` groundwork and the deferred edge cases in [[INS-011]] are
directly relevant), and where packs live (bundled vs. fetched). Likely an ADR
at design time.

## Triage note

2026-07-08 heartbeat - Deferred. Still valid, but it should ride with the
moving-exercise model redesign after the current runner usability fixes ship.

2026-07-08 TASK-053 sweep - TASK-048/049/050 shipped, so this is now eligible to
pair with INS-032. Keep it deferred rather than filing a standalone JSON-pack
task; the point is one model redesign that covers moving exercises and data-pack
authoring together.
