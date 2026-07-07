---
id: ADR-010
title: VexFlow 5 renders staff + TAB, wrapped in our own Notation component
status: accepted
date: 2026-07-07
research: RES-013
---

# ADR-010 — VexFlow 5 renders staff + TAB, wrapped in our own `<Notation>` component

## Context

EPIC-009 needs every melodic exercise readable as standard notation and guitar
tablature at once, rendered in the practice runner. The hard constraint is
enharmonic fidelity: `@jazz-master/theory` owns spelling (the seventh of Eb7 is Db,
never C#), and the renderer must display that spelling verbatim. The platform
constraints come from ADR-002/ADR-006: local-first, offline-capable, client-only
React island under `/app/*`, no server rendering of scores. RES-013 (TASK-014)
compared VexFlow, alphaTab, OpenSheetMusicDisplay, and custom SVG against the
task's five criteria.

## Decision

**Render notation with VexFlow 5 (MIT), using its low-level native API, behind a
project-owned `<Notation>` React component.** The load-bearing choices:

1. **VexFlow's spelled-key input is the enharmonic guarantee.** Notes are built as
   `StaveNote` keys straight from theory-core spellings (`Db` → `db/4` plus an
   explicit `Accidental`); no auto-derivation (`applyAccidentals`, key-signature
   respelling) is ever used for exercise notes. *Rejected: alphaTab* — its note
   model is fret/string-first with derived spelling; our spelling is only reachable
   via per-note `ForceFlat/ForceSharp` overrides against the library's grain, and it
   drags in workers, worklets, font/soundfont assets, and a synth we don't want
   (audio belongs to EPIC-004/006). *Rejected: OSMD* — MusicXML is its only input,
   so we would maintain an exercise→MusicXML serializer to feed a wrapper around
   the very engine (VexFlow) we can drive directly.
2. **Staff + TAB come from one Formatter pass.** A `Stave` above a `TabStave`, one
   voice of `StaveNote`s and one of `TabNote`s, aligned with
   `Formatter.joinVoices(...).formatToStave(...)` — the documented VexFlow pattern.
   Fret/string data comes from the theory core's positioned notes, so staff and TAB
   are two projections of the same resolved exercise, never independently computed.
3. **The renderer stays behind our component seam.** Only `<Notation>` (in
   `apps/web/src/components/`) imports VexFlow; it takes resolved theory-core data
   as props and renders SVG via ref + effect (external-synchronization exception to
   our pure-render rule). Pages and the practice runner never see VexFlow types —
   if VexFlow disappoints, the fallback recorded in RES-013 (custom SVG, the
   pattern our fretboard/chord diagrams already use) replaces the component's
   internals, not its callers.
4. **Rhythm is derived, not stored.** The exercise model (TASK-011) has no per-note
   rhythm; a pure helper beside the content model maps resolved notes to duration
   events (straight-eighths default, beamed in fours) that `<Notation>` consumes.
   The `Exercise` type grows an optional rhythm field only when a real exercise
   needs one — the helper is the seam.
5. **VexFlow is lazy-loaded.** ~677 KB gzip (fonts included) must not ride in the
   initial `/app` bundle; the notation module loads via dynamic `import()` where it
   is used. A `vexflow-core` + single-font build is a possible later trim
   (needs-spike per RES-013 — its docs are v4-era).
   *Rejected: VexTab/EasyScore markup layers* — a second stringly-typed format
   between typed theory data and the renderer, with its own parsing/spelling
   opinions.

## Consequences

- New runtime dependency in `apps/web` (MIT; v5.0.0 of 2025-03; slow but stable
  release cadence — an upstream stall is tolerable because the component seam
  bounds the blast radius). `packages/theory` stays pure — VexFlow never appears
  there.
- Enharmonic fidelity becomes testable at the component layer: tests assert
  rendered output contains theory-core spellings verbatim across flat keys.
- `ExerciseDisplay` gains a `'notation'` hint when the runner integration lands;
  the content layer needs no other change until per-note rhythm arrives.
- Bundle-size discipline becomes part of `check`-adjacent review for the practice
  routes: notation stays behind a dynamic import; regressions are a QA-review item.
- We accept re-verifying VexFlow-4-era documentation against v5 during
  implementation (formatter/font APIs) — first implementation task starts with
  that spike before committing component structure.

## Considered and rejected

- **alphaTab** — enharmonic control indirect (fret-first model); heaviest
  integration (Vite plugin, WebWorkers, AudioWorklets, copied font/soundfont
  assets); MPL-2.0 fine but features (GP import, synth) are out of scope.
- **OpenSheetMusicDisplay** — MusicXML-only input forces a serializer we'd own;
  ships VexFlow inside anyway; right tool only if MusicXML import becomes product
  scope (explicitly out of EPIC-009).
- **Custom SVG over the theory core** — perfect control, but re-implements staff
  layout, SMuFL glyphs, stems/beams/accidental spacing for worse output; kept as
  the documented fallback behind the component seam, not the primary path.
- **VexTab / EasyScore** — markup indirection over the same engine; the low-level
  API keeps typed data typed.

## Open questions (deferred grill)

Written without the owner present (autonomous dev-loop run); per
`processes/grilling.md` these surface at the next owner-confirmation point.

1. **Is straight-eighths-by-default the right rhythm floor for jazz pedagogy?**
   Decision 4 renders scale/arpeggio exercises as uniform eighths with no swing
   marking. Alternative: annotate "swing 8ths" as text, or hold notation back
   until the model carries real rhythm. Which failure hurts more: students reading
   straight notation for swung material, or notation arriving a milestone later?
2. **How much is ~677 KB gzip worth to you?** Lazy-loading keeps it off first
   paint, but every notation-bearing lesson pays it once per session on the dev
   URL. If that budget offends, the `vexflow-core` + single-font trim (or the
   custom-SVG fallback) moves up the queue — it's a scope call, not a technical
   one.
3. **Does TAB need position-window fidelity from day one?** The theory core
   already emits positioned notes per fret window; decision 2 renders those
   positions verbatim. Confirm that showing *the* position the exercise prescribes
   (not an auto-optimized fingering) is the product intent — alphaTab-style
   auto-fingering was implicitly rejected with the library.

## Provenance

RES-013 (TASK-014, 2026-07-07). Related: ADR-002 (local-first UX kept), ADR-006
(client-only island — notation is never SSR'd), TASK-011 (exercise model this
renders).
