---
id: RES-013
title: Notation + tablature rendering approach for exercise display
status: complete
task: TASK-014
created: 2026-07-07
stale_when: >
  VexFlow 6 or a VexFlow maintenance stall (>18 months without release);
  alphaTab 2.x with a pitch-first authoring model; EPIC-009 scope growing
  beyond short exercises (full lead sheets, MusicXML import, playback of
  notation); the exercise model gaining per-note rhythm that a renderer must
  ingest from a serialized format.
---

# RES-013 — Notation + tablature rendering approach for exercise display

Consumed by TASK-014 → ADR-010. Candidates per the task: **VexFlow**, **alphaTab**,
**OpenSheetMusicDisplay (OSMD)**, and **custom SVG over `@jazz-master/theory`**. Our
needs are deliberately narrow: short exercises (a few bars), staff + TAB aligned,
rendered client-side in a `client:only` React island, offline-capable, spelling
dictated by the theory core.

## Research questions

1. **Enharmonic control** — does each candidate render our exact note spellings
   verbatim (the seventh of Eb7 is Db, never C#), or does it respell/derive
   accidentals itself?
2. **Staff + TAB** — can each render a standard-notation stave and a tablature
   stave for the same material, vertically aligned/in sync?
3. **Bundle size + local-first fit** — how heavy is each option, what runtime
   assets (fonts, soundfonts, workers) does it need, and does anything prevent
   fully offline operation?
4. **React 19 + Vite integration** — how much friction inside our Astro-hosted
   `client:only="react"` island with Vite underneath?
5. **Maintenance health and licensing** — activity through 2025–2026, bus
   factor, license compatibility?
6. **Rhythm representation** — given TASK-011's exercise model has *no per-note
   rhythm* (material + tempo + duration; display hints only), what does each
   option force us to invent?

## Findings

### 1. Enharmonic control

**VexFlow: full verbatim control — its input *is* spelled pitches.** Notes are
constructed as `StaveNote({ keys: ['db/4'], duration: '8' })`; the letter+accidental
in the key string is exactly what lands on the staff line, and accidental glyphs are
attached explicitly (`Accidental` modifier) or batch-derived only if you opt into
`Accidental.applyAccidentals` [1][3]. Nothing respells. Our theory core's output maps
1:1 onto VexFlow keys (`Db` → `db/4` + explicit `b` glyph). Cross-checked: tutorial
[3] and accidental docs [4] agree; the React guide [6] uses the same spelled-key API.

**alphaTab: inverted model — TAB-first, spelling is derived.** alphaTab's `Note` is
defined by *fret + string*, not pitch letter [11]; display spelling is computed from
key signature and diatonic placement. That computation was historically wrong enough
to need fixing ("place note heads according to diatonic scale", v1.8 release notes
[14]). A per-note `accidentalMode` override exists (`ForceFlat`, `ForceSharp`,
`ForceNatural`, double variants) [12], so our spelling is *reachable*, but only by
fighting the derivation on every note — we would encode "Db" as fret 11 string 4 plus
`ForceFlat` and trust the renderer's placement logic. Control is indirect, not
verbatim.

**OSMD: verbatim, but only via MusicXML.** MusicXML pitch elements carry explicit
`step`/`alter` (Db is `<step>D</step><alter>-1</alter>`), and OSMD renders what the
file says [16]. Full spelling control — at the price of writing and maintaining a
MusicXML serializer for our exercise model, since OSMD has no programmatic
score-building API ("a renderer, not an editor"; MusicXML is the only input) [16].

**Custom SVG: total control by construction** — we draw what the theory core says.
No third-party opinion exists to fight.

### 2. Staff + TAB aligned

**VexFlow: documented first-class pattern.** A `Stave` and a `TabStave` stacked, one
`Voice` of `StaveNote`s and one of `TabNote`s, and a single
`Formatter().joinVoices([noteVoice]).joinVoices([tabVoice]).formatToStave([noteVoice, tabVoice], stave)`
gives identical x-positions for corresponding notes on both staves [5]. VexTab (the
markup layer) exposes the same thing as `notation=true` on a tab stave [2], which
confirms the engine supports it natively. Two sources [2][5].

**alphaTab: automatic.** Staff + TAB together is alphaTab's core use case (Guitar
Pro-style rendering); nothing to build [10].

**OSMD: supported from MusicXML** — tab staves combined with treble clef render,
including bends/glissandi [16][17]. Alignment quality depends on the MusicXML we
generate.

**Custom SVG: we implement alignment ourselves.** For evenly spaced short exercises
this is trivial (same x-scale for both systems); it only gets hard once proportional
rhythm spacing matters.

### 3. Bundle size + local-first fit

Measured/primary numbers:

- **vexflow@5.0.0**: 1.12 MB minified / ~677 KB gzip (Bundlephobia API, includes the
  three embedded music fonts) [7]; npm unpacked 21.3 MB [8]. VexFlow also publishes a
  zero-font `vexflow-core` entry with lazy `fetchMusicFont()` loading and per-font npm
  packages, designed exactly to shrink this [9] — flagged **needs-spike**: the
  wiki/docs describing it are VexFlow-4-era; verify the v5 shape when we build.
  Fonts are bundled or npm-installed → fully offline either way.
- **@coderline/alphatab@1.8.4**: npm unpacked 13.7 MB; single `dist/alphaTab.mjs`
  main bundle [15]. Exact min+gzip not measured (Bundlephobia timed out —
  **single-source gap**), but the runtime additionally *requires* copied assets: the
  Bravura font served under `/font` and (if audio is enabled) a SONiVOX soundfont
  under `/soundfont`, plus background WebWorkers and AudioWorklets [13]. All
  self-hosted → offline works, but the deploy artifact and moving parts are the
  largest of the four.
- **opensheetmusicdisplay@2.0.0**: 1.25 MB minified / 318 KB gzip [18] — but it
  embeds VexFlow internally as its rendering engine [16], so we'd ship a VexFlow
  superset plus an XML parser, and still have to *generate* MusicXML ourselves.
- **Custom SVG**: near-zero dependency weight; the real cost is our code plus a
  SMuFL glyph subset (clefs, accidentals, noteheads, flags) we'd have to embed.

None of the options phones home; all are compatible with the local-first constraint
(ADR-002) and Workers static hosting (ADR-006). Whatever we pick, the notation
module should be lazy-loaded so ~300–700 KB gzip never rides in the initial `/app`
bundle.

### 4. React 19 + Vite integration

No candidate has an official React 19 binding; all are imperative canvas/SVG engines
driven from `useRef` + `useEffect` (render on mount/prop change, clear on cleanup) —
the standard documented pattern for VexFlow 5 with React [6] and equally applicable
to OSMD. This matches our convention "Effects only for external synchronization".

Friction differences:

- **VexFlow**: plain ESM import, no plugins, no workers, no asset copying. Lowest
  friction; SSR-safety is already guaranteed by our `client:only` island.
- **alphaTab**: needs `@coderline/alphatab-vite` in the Vite plugin chain to rewire
  worker discovery and copy font/soundfont assets [13]. Our Vite config lives inside
  Astro's `vite.plugins` passthrough — the same single-source integration seam that
  ADR-006 flagged for TanStack Router. Workers + worklets inside an Astro-managed
  Vite build is untested territory for us.
- **OSMD**: import + `useEffect` like VexFlow, but every render goes through
  serialize-to-MusicXML first.
- **Custom SVG**: pure React components — zero integration friction, highest
  build cost.

### 5. Maintenance health and licensing

- **VexFlow** — MIT [1]. v5.0.0 released 2025-03-05; TypeScript; maintainers Ron Yeh
  and Rodrigo Vilar (original author Mohit Muthanna Cheppudira, 2010) [1]. Latest npm
  is still 5.0.0 as of 2026-07 [8] — release cadence is *slow* (stable, widely
  depended on — OSMD builds on it — but not fast-moving). Oldest, most battle-tested
  engine of the three libraries.
- **alphaTab** — MPL-2.0 (file-level copyleft; fine for us — we would not modify its
  sources) [10]. Most active project: v1.8.4 released 2026-07-05, steady commits,
  but effectively a single-maintainer org (CoderLine) [10].
- **OSMD** — BSD-3-Clause (relicensed from MIT) [19]. Company-backed (PhonicScore);
  v2.0.0 released 2026-06-15 with active development [16].
- **Custom SVG** — maintenance is entirely ours; no license risk, no upstream, and
  no upstream help either.

### 6. Rhythm representation vs. our exercise model

TASK-011's `Exercise` has **no per-note rhythm**: material (scale/arpeggio reference)
+ fret window + `tempoBpm` + duration + display hints. Every candidate is a *notation*
renderer and therefore demands explicit per-note durations:

- **VexFlow** wants a duration string per note (`'8'`, `'q'`) and a beam grouping
  [3][5]. For our exercises a **derived uniform rhythm** (default: straight eighths,
  beamed in fours, bars split by the material length) is a ~20-line pure function —
  and it can live beside the content model, not in the renderer. When a future
  exercise needs swing figures or mixed rhythms, the model grows an optional
  `rhythm` field and the same function passes it through.
- **alphaTab** would force the same information into `alphaTex`/model form, plus
  fret-first note encoding — two derivations instead of one.
- **OSMD** needs full MusicXML `<divisions>`/`<duration>`/`<type>` bookkeeping —
  the heaviest encoding of an implicit rhythm.
- **Custom SVG** could *dodge* rhythm entirely (evenly spaced noteheads, no stems)
  — but that stops being real notation, and EPIC-009's "why" includes reading
  practice; fake notation undercuts it.

Conclusion: the model's rhythm silence is cheap to bridge for VexFlow (one derived
default), moderately awkward for alphaTab, expensive for OSMD.

## Recommendations

1. **Adopt VexFlow 5 (native low-level API, not VexTab/EasyScore) wrapped in our own
   `<Notation>` React component.** It is the only library candidate whose input model
   *is* spelled pitches (criterion 1, the hard constraint — finding 1), has a
   documented Stave+TabStave alignment pattern (finding 2), needs zero build-config
   or runtime assets beyond its bundle (findings 3–4), and is MIT (finding 5). Use
   the spelled-key + explicit `Accidental` path; do not use `applyAccidentals` or
   key-signature auto-derivation for exercise notes.
2. **Derive rhythm, don't store it (yet).** A pure helper maps resolved exercise
   notes → `{ key, fret, string, duration }` events with a straight-eighths default
   and beam groups; it lives with the content model so the renderer stays dumb
   (finding 6). Extend the `Exercise` model with optional rhythm only when a real
   exercise needs it.
3. **Lazy-load the notation module.** Import VexFlow via dynamic `import()` at the
   component/route level so its ~677 KB gzip [7] stays out of the initial `/app`
   bundle (finding 3). Evaluate `vexflow-core` + a single font package as a follow-up
   size trim — verify the v5 API first (flagged needs-spike, finding 3).
4. **Verify enharmonics in tests the same way the theory core does**: component tests
   assert the rendered SVG contains the theory core's spellings verbatim (Db as a D
   notehead position + flat glyph, never C#) across flat keys.

### Considered and rejected

- **alphaTab** — rejected on criterion 1: fret-first note model with derived
  spelling; our verbatim requirement means per-note `ForceFlat/ForceSharp` overrides
  against the grain of the library [11][12][14]. Also the heaviest integration
  (Vite plugin, workers, worklets, font/soundfont asset copying [13]) buying features
  we don't want yet (Guitar Pro import, built-in synth — audio is EPIC-004/006
  territory and out of EPIC-009 scope). Revisit if we ever want full-score playback
  of imported files.
- **OpenSheetMusicDisplay** — rejected: MusicXML is its only input [16], so we'd
  write and maintain an exercise→MusicXML serializer to feed a library that wraps
  the engine (VexFlow) we can drive directly. Right choice only if MusicXML import
  ever becomes a product feature (explicitly out of EPIC-009 scope).
- **Custom SVG over the theory core** — rejected *as the primary path*: control is
  perfect but we would re-implement staff layout, SMuFL glyph handling, stems, beams
  and accidental spacing — weeks of effort for output worse than VexFlow's, in a
  solo-owner project. Kept as the recorded fallback if the VexFlow spike hits a
  wall, and as the pattern we already use successfully for fretboard/chord diagrams.
- **VexTab / EasyScore (VexFlow's markup layers)** — rejected: another string format
  between typed theory data and the renderer, with its own spelling/parsing
  opinions; the low-level API is the point.

## Sources

[1] VexFlow repository — https://github.com/vexflow/vexflow (v5.0.0 released 2025-03-05; accessed 2026-07-06)
[2] VexTab tutorial (`notation=true` on tab staves) — https://vexflow.com/vextab/tutorial.html (accessed 2026-07-06)
[3] VexFlow Tutorial wiki (StaveNote keys/durations/accidentals) — https://github.com/0xfe/vexflow/wiki/Tutorial (VexFlow-4 era; accessed 2026-07-06)
[4] VexFlow accidental docs — http://www.vexflow.com/build/docs/accidental.html (accessed 2026-07-06)
[5] VexFlow formatting docs/wiki (Formatter.joinVoices + formatToStave across Stave/TabStave) — https://github.com/0xfe/vexflow/wiki/How-Formatting-Works and http://www.vexflow.com/build/docs/formatter.html (accessed 2026-07-06)
[6] Michael Fares — Rendering Music With VexFlow 5 and React (useRef/useEffect pattern) — https://michael-fares.medium.com/rendering-music-with-vexflow-5-and-react-8de44830d09f (accessed 2026-07-06)
[7] Bundlephobia API, vexflow@5.0.0 — https://bundlephobia.com/api/size?package=vexflow@5.0.0 (accessed 2026-07-06)
[8] npm registry, vexflow latest — https://registry.npmjs.org/vexflow/latest (5.0.0; accessed 2026-07-07)
[9] VexFlow font architecture: vexflow-fonts per-font npm packages + zero-font core entry with `fetchMusicFont` — https://github.com/vexflow/vexflow-fonts and https://github.com/0xfe/vexflow/wiki/VexFlow-Font-Rendering (v4-era docs; accessed 2026-07-06; **needs-spike for v5**)
[10] alphaTab repository — https://github.com/CoderLine/alphaTab (MPL-2.0; v1.8.4 released 2026-07-05; accessed 2026-07-06)
[11] alphaTab Note model reference (fret/string-defined notes) — https://alphatab.net/docs/reference/types/model/note/ (accessed 2026-07-06)
[12] alphaTab NoteAccidentalMode reference — https://alphatab.net/docs/reference/types/model/noteaccidentalmode/ (accessed 2026-07-06)
[13] alphaTab Vite installation (plugin, workers/worklets, font + soundfont asset copying) — https://alphatab.net/docs/getting-started/installation-vite (accessed 2026-07-06)
[14] alphaTab v1.8 release notes (diatonic note-head placement fix) — https://alphatab.net/docs/releases/release1_8 (accessed 2026-07-06)
[15] npm registry, @coderline/alphatab latest — https://registry.npmjs.org/@coderline/alphatab/latest (1.8.4; accessed 2026-07-07)
[16] OSMD repository/README (MusicXML-only input, renderer-not-editor, built on VexFlow, tab support; v2.0.0 released 2026-06-15) — https://github.com/opensheetmusicdisplay/opensheetmusicdisplay (accessed 2026-07-06)
[17] OSMD blog — sheet music display libraries for browsers — https://opensheetmusicdisplay.org/blog/sheet-music-display-libraries-browsers/ (accessed 2026-07-06)
[18] Bundlephobia API, opensheetmusicdisplay — https://bundlephobia.com/api/size?package=opensheetmusicdisplay (accessed 2026-07-06)
[19] OSMD blog — relicense to BSD-3-Clause — https://opensheetmusicdisplay.org/blog/osmd-now-comes-with-bsd-license/ (accessed 2026-07-06)
