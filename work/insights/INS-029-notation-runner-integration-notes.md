---
id: INS-029
title: Notation polish items for the runner integration (TASK-038)
status: accepted
outcome: [TASK-038]
created: 2026-07-07
source: TASK-037
---

TASK-037's review passes (code-reviewer + ui-code-reviewer, no must-fix findings)
surfaced polish items that only become decidable or observable once `<Notation>`
is consumed by the practice runner. Fold them into TASK-038:

1. **Accessible label**: the default aria-label enumerates every spelled note —
   fine for a 4-note arpeggio, noisy for a 17-note scale path. The runner should
   pass a summary label ("D♭ major scale, open position — staff and tablature")
   via the existing `aria-label` prop.
2. **Loading shift**: the score pops in after the lazy VexFlow chunk (~692 KB
   gzip) resolves — a blank flash and layout shift on the first notation-bearing
   exercise of a session. Reserve container height (viewBox aspect is
   width-dependent, so decide at integration) or show a lightweight placeholder.
3. **Narrow-viewport legibility**: the SVG scales to container width without a
   floor; a long exercise on a phone shrinks staff and fret digits indefinitely.
   Product call at integration: fit-to-width vs. min-width + horizontal scroll.
4. **Accidental crowding**: `NOTE_WIDTH` is constant, so bars dense with
   explicit accidentals (blues content) get tight. Cosmetic; eyeball flat-key
   and blues exercises in the real runner layout and widen if needed.
5. **Chunk split re-check**: TASK-037 verified the separate VexFlow chunk with a
   temporary consumer build; once the runner imports `<Notation>` for real,
   confirm the split again in the shipped build (and that only notation-bearing
   views pay the load). Bundle-trim follow-up is already [[TASK-039]].

Redraw-thrash from unmemoized props — the review's main latent-footgun finding —
was fixed in TASK-037 itself (`<Notation>` compares measures by content, not
identity), so the runner may derive measures inline per render.
