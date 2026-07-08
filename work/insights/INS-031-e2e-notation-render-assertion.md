---
id: INS-031
title: e2e smoke never asserts the notation score actually renders
status: accepted
outcome: [TASK-048]
created: 2026-07-07
source: TASK-039
---

While verifying TASK-039's offline rendering I had to hand-roll a Playwright
script — the smoke suite (TASK-035) has no assertion that the practice
runner's staff+TAB score appears, even though the happy-path test grades
through a notation-bearing lesson.

Coverage today is only indirect: the `cleanConsole` fixture would fail the
run if the lazy VexFlow chunk *errored* (`Notation.tsx` logs `console.error`
on a failed import/render). What it would not catch: an empty-but-successful
render (blank SVG, zero glyphs), or a regression where the `'notation'`
display hint stops reaching the runner at all — both ship a silent product
break in the flagship EPIC-009 surface.

A one-line assertion in the happy-path test — after starting the lesson, wait
for `role=img` with the "staff and tablature" label and assert its `<svg>`
contains `text` elements — closes the gap. Real-browser SVG rendering is
exactly what NOTE-005 scoped the smoke suite to (flows jsdom cannot prove),
so this stays within the "minimal smoke pass" owner decision rather than
expanding it.

Working reference: the throwaway verification script from TASK-039's Log
(waits for the labeled region, then for `svg text` count > 0, with the
onboarding skip first).

Touches `codebase/apps/web/e2e/smoke.spec.ts` only. Related: [[INS-030]]
(runner-notation UX polish) — could batch, but this one is a mechanical test
addition, not a product judgment.

## Triage note

2026-07-08 heartbeat - Accepted into TASK-048. The task is already changing
the runner score surface, so the e2e render assertion is the right verification
hook for that work.
