---
id: TASK-037
title: Notation component — staff + TAB via VexFlow
epic: EPIC-009
status: done
depends_on: []
source: TASK-014
research: RES-013
created: 2026-07-07
---

# TASK-037 — Notation component: staff + TAB via VexFlow

## Goal

A reusable `<Notation>` component that renders an exercise's resolved notes as an
aligned staff + tablature pair, with enharmonic spelling identical to the theory
core's — the ADR-010 seam made real.

## Context

Implements ADR-010 decisions 1–4 (read it first; RES-013 has the evidence).
Shape of the work:

- `bun add vexflow` in `apps/web` (v5.x, MIT). **Start with a spike**: the
  formatter/font documentation RES-013 cites is partly VexFlow-4-era — verify in a
  scratch test that `Stave` + `TabStave` + `Formatter.joinVoices/formatToStave`
  and explicit `Accidental` modifiers work as described in v5 before committing
  component structure. If the spike hits a wall, the recorded fallback is custom
  SVG (RES-013) — stop and re-scope rather than fight the library.
- A pure rhythm-derivation helper beside the content model
  (`apps/web/src/content/`): resolved exercise notes → duration events
  (straight-eighths default, beam groups of four, bars split by material length).
  No change to the `Exercise` type.
- `<Notation>` in `apps/web/src/components/`: props are theory-core
  spelled notes + positions (+ derived durations), renders SVG into a ref'd
  container via effect (external-synchronization exception). Only this component
  imports VexFlow; export it lazily (dynamic `import()` boundary) so VexFlow stays
  out of the initial `/app` chunk (ADR-010 decision 5).
- Enharmonic verbatim rule: keys come straight from theory-core spellings with
  explicit accidental glyphs; never `applyAccidentals`/key-signature derivation.

## Acceptance criteria

- [x] VexFlow 5 spike confirmed (or fallback triggered and task re-scoped): staff +
      TAB aligned via one Formatter pass in our stack
- [x] `<Notation>` renders a scale and an arpeggio exercise as staff + TAB, aligned
- [x] Component tests assert rendered output carries theory-core spellings verbatim
      across flat keys (Db arpeggio content shows Db/flat glyphs, never C#)
- [x] TAB numbers match the theory core's positioned notes for the exercise's fret
      window (no auto-refingering)
- [x] Rhythm helper unit-tested (eighths default, beaming, bar split)
- [x] VexFlow appears only behind the component's dynamic-import boundary (verify
      chunking in the build output)
- [x] `bun run check` passes

## Verification

`bun run --cwd codebase check`; component tests green; `bun run --cwd codebase dev`
and view a flat-key exercise's staff+TAB manually; inspect `astro build` output for
a separate VexFlow-bearing chunk.

## Log

### 2026-07-07 — claimed (agent)

Plan, after reading ADR-010, RES-013, and the content/theory code:

1. **Spike first** (per criteria): `bun add vexflow` in `apps/web`, then a scratch
   vitest file proving in our stack (jsdom) that `Stave` + `TabStave` + one
   `Formatter.joinVoices(...).formatToStave(...)` pass + explicit `Accidental`
   modifiers work in v5. Fallback if it walls: stop, re-scope to custom SVG.
2. **Rhythm helper** `apps/web/src/content/rhythm.ts`: pure
   `deriveRhythm(positions)` → measures of eighth-note events (8 per 4/4 bar),
   beam groups of four (≥2 to beam), no `Exercise` type change. Unit-tested.
3. **`<Notation>`** in `apps/web/src/components/`: takes derived measures
   (theory-core spellings + string/fret verbatim); renders via ref + effect that
   dynamically imports a `notationRenderer` module — the only file importing
   VexFlow, keeping it out of the initial `/app` chunk. Staff octaves derived
   from string+fret MIDI (theory `Note` is octave-less); TAB numbers passed
   through verbatim, no refingering.
4. **Tests**: rhythm unit tests; renderer/component tests asserting flat-key
   spellings land verbatim in the SVG (Db shows flat glyph on D line, never C#)
   and TAB frets match theory positions. Component layer per testing-strategy.
5. Verify chunk split in `astro build` output; `bun run check`; review; manual
   dev-server look at a flat-key exercise; ship.

The runner integration ('notation' display hint) is TASK-038 — out of scope here.

### 2026-07-07 — done

Shipped as planned; VexFlow 5 survived its spike on the first run, so the
custom-SVG fallback stayed on the shelf. What landed:

- `deriveRhythm` (`apps/web/src/content/rhythm.ts`): straight eighths, 4/4 bars
  of eight, beam groups of four (trailing group beams from two notes up).
- `stavePitch` (`apps/web/src/components/notationPitch.ts`): positioned note →
  VexFlow key; octave derived from string+fret MIDI, spelling verbatim from the
  theory core (Cb/B#/Bbb covered); throws when spelling and position disagree.
- `notationRender.ts`: the only VexFlow importer. One Stave+TabStave pair per
  measure, aligned via a single `Formatter.joinVoices(...).formatToStave(...)`
  pass (alignment asserted <1px in tests). Explicit accidental glyphs with
  measure-local bookkeeping — a letter+octave that changes accidental within a
  bar gets its glyph, so C blues shows G♭ then G♮; never key-derived.
- `<Notation>`: dynamic-imports the renderer in an effect; `role="img"` with
  spelled-sequence aria-label; compares `measures` by content so unmemoized
  callers can't thrash VexFlow re-layouts (review finding, fixed in-task).

**Spike/manual-verification findings** (live browser via temporarily patched
PracticePage, since no product page consumes the component until TASK-038):
VexFlow 5 works in jsdom (canvas warnings are benign); glyphs render as SMuFL
`<text>` codepoints (flat U+E260 / natural U+E261 / sharp U+E262 — what the
enharmonic tests count). Three dark-theme gotchas fixed after visual
inspection: TAB fret digits default to the *Bravura* font stack (blocky
time-signature digits — routed `TabNote.text` to Academico via
`MetricsDefaults`); VexFlow blanks the TAB line behind digits with an opaque
white rect (`setBackgroundFillStyle('transparent')`); `renderer.resize()` pins
inline pixel style that beats the responsive `width=100%` attribute (inline
style stripped, viewBox added). Screenshot-verified: Db major scale open
position, 3 bars staff+TAB, all five flats verbatim, legible digits, no
console errors.

**Chunk verification**: with a temporary consumer, `astro build` splits a
`notationRender.*.js` chunk (1.1 MB min / 692 KB gzip — matches RES-013's
estimate) referenced only via dynamic `import()` from the practice chunk;
AppShell stays at 132 KB. Without a consumer VexFlow is tree-shaken entirely.
Re-confirm at TASK-038's real integration (noted in INS-029).

**Review**: code-reviewer + ui-code-reviewer, no must-fix findings. Fixed
in-task: `.catch` on the import chain (a stavePitch throw was an unhandled
rejection), content-keyed re-render guard, rerender/equal-content tests.
Kept with rationale: component tests assert VexFlow DOM glyphs (the task's
acceptance criterion demands component-layer verbatim-spelling proof; the
renderer tests carry the same assertions where the coupling is legitimate).
Deferred to TASK-038 via INS-029: runner-supplied aria-label, loading
placeholder/CLS, narrow-viewport legibility floor, accidental crowding.
Deviation from ADR-010 wording: none of substance — "explicit accidental
glyphs" is implemented with standard measure-local carry (repeat of the same
accidental in a bar isn't re-glyphed; a change is), which is engraving-correct
and still never key-derived.

554 tests green, `bun run check` green, e2e not triggered (no product path
touched — component unconsumed until TASK-038).
