---
id: INS-004
title: Fretboard hardening deferred from TASK-003 review
status: new
created: 2026-07-05
---

Low-severity review findings from TASK-003 (code-reviewer + ui-code-reviewer agents) filed rather than fixed:

1. **Runtime guard for partial custom `Tuning`** — `noteAt`/`positionsOf` index `tuning[string]` without validation; a partial `Tuning` (only reachable via unsound casts — the type is a total `Record<GuitarString, Note>`) would crash opaquely in `pitchClass(undefined)`. Add a clear guard when alternate tunings get real UI.
2. **Duplicate highlight key collision** — `<Fretboard>` keys highlight groups by `string-fret`; two highlights on the same position would warn/misrender. Acceptable for real fretboard data (one note per position); revisit if a caller ever layers overlapping highlight sets.
3. **Exact line-count assertion in `Fretboard.test.tsx`** — the `19 lines` count breaks on cosmetic additions (decorative lines). Markers now assert via `data-marker`; the line count stays as intent documentation and is cheap to update.

## Triage note

2026-07-05 — Deferred at review time. All three are unreachable or acceptable under current callers; revisit when alternate tunings, overlapping highlight layers, or fretboard visual redesign become real work.
