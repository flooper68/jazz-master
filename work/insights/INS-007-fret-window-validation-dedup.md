---
id: INS-007
title: Fret/window validation is duplicated between fretboard.ts and positions.ts
status: new
created: 2026-07-06
---

Found in the TASK-010 review: `positions.ts#notePositions` reimplements the fret-window checks instead of sharing `fretboard.ts`'s private `assertValidFret`. Net behavior is the same today, but the two validate slightly differently (`positionsOf` rejects `max < 0` explicitly; `notePositions` only catches it via `min > max`), so error messages and edge behavior can drift as more window-taking functions are added (CAGED/3NPS layers will add them).

Related hardening note from the same review: neither module caps `window.max`, so a pathological `{min: 0, max: 1e7}` loops millions of frets. No real caller does this; worth a ceiling only if the helper gets extracted anyway.

When triaged: extract one shared `assertValidFretRange(range)` in `fretboard.ts`, use it from `positionsOf` and `notePositions`, and decide on a max-fret ceiling (physical guitars top out ~24). Small, pure-refactor task. See [[INS-004]] for the component-side fretboard hardening list.
