---
id: TASK-039
title: Trim the notation bundle — evaluate vexflow-core + single font
epic: EPIC-009
status: done
depends_on: [TASK-037]
source: TASK-014
research: RES-013
created: 2026-07-07
---

# TASK-039 — Trim the notation bundle: evaluate `vexflow-core` + single font

## Goal

The lazy notation chunk shrinks from the full-fat VexFlow build (~677 KB gzip,
three embedded fonts) to a core-plus-one-font build — or we record with numbers
why the trim isn't worth it.

## Context

RES-013 finding 3 / ADR-010 decision 5: VexFlow publishes a zero-font
`vexflow-core` entry with lazy font loading and per-font npm packages
(https://github.com/vexflow/vexflow-fonts), but the documentation describing the
mechanism is VexFlow-4-era — flagged **needs-spike**. This task is that spike plus
adoption if it pays:

Reviewer note (2026-07-07, TASK-014 review): `vexflow@5.0.0` on npm already declares
`./core` and `./bravura` subpath exports — the v5 trim path is likely `vexflow/core`
(a subpath of the main package) rather than the separate `vexflow-core` package the
v4-era docs describe. Start the spike there.

- Measure the current notation chunk size (baseline from TASK-037's build).
- Swap to `vexflow-core` + one music font (Bravura or Petaluma), keeping offline
  operation — the font must be bundled/self-hosted, never fetched from a CDN at
  runtime (ADR-002/ADR-006 local-first + Workers hosting).
- Confirm staff+TAB rendering and the enharmonic tests still pass unchanged.
- If the v5 core-entry API is broken/undocumented, stop and record the finding in
  this task's Log and a staleness note on RES-013 — do not fight it.

## Acceptance criteria

- [x] Before/after chunk sizes measured and recorded in the Log
- [x] Either: notation chunk reduced with all TASK-037 tests green and offline
      rendering intact — or a recorded no-go with the v5-specific reason and a
      staleness note added to RES-013
- [x] No runtime CDN fetches introduced
- [x] `bun run check` passes

## Verification

`bun run --cwd codebase check`; compare `astro build` chunk sizes before/after;
load a notation exercise with the network offline (devtools) and confirm it
renders.

## Log

### 2026-07-07 — claimed (agent)

Plan: the reviewer note held — `vexflow@5.0.0` exposes `.` (all five fonts),
`./core` (zero fonts), and `./bravura` (Bravura + Academico + Academico Bold)
subpath entries; the separate v4-era `vexflow-core` package is obsolete for v5.
`./bravura` is the exact fit: `notationRender.ts` needs Bravura for glyphs
*and* Academico for TAB fret digits (the `MetricsDefaults.TabNote.text` route),
and the entry is identical to the main one minus Gonville/Petaluma/
PetalumaScript — same `export * from '../src/index.js'`, same eager
data-URI `Font.load` calls, so no lazy-font machinery needed and no test
changes. Measure baseline → swap the one import → re-measure → verify offline.

### 2026-07-07 — done

Swapped `notationRender.ts`'s import from `vexflow` to `vexflow/bravura` — a
one-line change (plus comment) since the entry re-exports the same API surface.

**Chunk sizes (`astro build`, `_astro/notationRender.*.js`):**

| Build | Raw | Gzip |
|---|---|---|
| Before (`vexflow`) | 1,122,005 B | 692,129 B (~676 KB) |
| After (`vexflow/bravura`) | 721,764 B | 389,283 B (~380 KB) |

−44% gzip (~296 KB saved); the drop is the embedded Petaluma (300 KB),
PetalumaScript (69 KB), and Gonville (30 KB) data-URI font modules.

**Offline / no-CDN:** fonts stay embedded as `data:font/woff2` URIs inside the
chunk. VexFlow's `Font.HOST_URL` (cdn.jsdelivr.net) string remains in the
bundle but is dead code on our path — `Font.load` only builds a CDN URL when
called *without* font data, and the bravura entry always passes the embedded
data (the same constant sat in the full build before, so nothing new). Verified
in a real browser: Playwright with **all non-localhost requests blocked**
rendered the Cmaj7 arpeggio staff+TAB in the practice runner with zero external
request attempts; screenshot confirmed legible Academico fret digits.

`bun run check` green (558 tests, TASK-037 notation/enharmonic tests
unchanged). The `vexflow/core` + per-font lazy-loading route wasn't needed —
`./bravura` gets the win without giving up eager offline fonts. Independent
review pass (code-reviewer agent): ship as-is; sole finding was a tracker
status/Log mismatch (frontmatter still `in-progress` alongside a "done" Log
entry), fixed before commit.
