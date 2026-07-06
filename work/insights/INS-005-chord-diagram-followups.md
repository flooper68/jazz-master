---
id: INS-005
title: ChordDiagram follow-ups deferred from TASK-004 review
status: new
created: 2026-07-05
---

Review findings from TASK-004 (code-reviewer + ui-code-reviewer agents) filed
rather than fixed because EPIC-002's real voicing library should drive the
requirements:

1. **Barre indicator** — the component renders one dot per string; a true
   barre (one finger across strings, e.g. Fmaj7 barre grip) shows as repeated
   finger numbers instead of a connecting bar. Fine for shell/drop voicings;
   decide when the EPIC-002 voicing library defines its grip data.
2. **Fret-window cap** — a grip spanning more than 4 frets grows the window
   without limit (acceptance criterion says 4–5). Real voicings never span
   that far, but consider clamping to 5 or asserting the span when
   programmatic voicing data starts feeding the component.
3. **Aria accidentals** — the default `aria-label` uses Unicode ♭/♯
   (`E♭m7 chord diagram`); some screen readers skip these glyphs. Revisit
   with a proper a11y pass ("E flat" spelled out would be ideal).

Matters to the practice loop because EPIC-002's drills show grids of these
diagrams; grip-data-model decisions there should settle 1 and 2.

## Triage note

2026-07-06 (heartbeat) — Deferred. All three findings hinge on grip-data-model
decisions the EPIC-002 voicing library will make, and EPIC-002 is backlog, not
in the current goals' "Now" list. Revisit when EPIC-002 starts; item 3 (aria
accidentals) can alternatively ride any earlier app-wide a11y pass.
