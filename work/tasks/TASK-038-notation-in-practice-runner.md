---
id: TASK-038
title: Show notation in the practice runner via a display hint
epic: EPIC-009
status: done
depends_on: [TASK-037]
source: TASK-014
research: RES-013
created: 2026-07-07
---

# TASK-038 — Show notation in the practice runner via a display hint

## Goal

A practicing guitarist sees staff + TAB for melodic exercises inside the guided
practice runner, alongside (not replacing) the fretboard view.

## Problem brief

Current condition: runner exercises display fretboard/chord-diagram hints only;
melodic material (scales, arpeggios, lines) cannot be *read*, only located.
Desired condition: exercises whose lesson wants notation render an aligned
staff + TAB pair in the runner, spelled exactly as the theory core spells.
Affected user/workflow: guided practice (EPIC-008 runner), lesson content authors.
Evidence: EPIC-009 Why — the desired practice flow shows "both notes and tabs";
reading notation is itself a jazz-guitar skill.
Baseline: 0 exercises show notation.
Target: every scale/arpeggio exercise in the shipped lesson pack can opt in via
its display hints and renders correctly.
How we will know it improved: runner shows notation for opted-in exercises in dev;
QA review reads a flat-key exercise without spotting a respelled note.

## Context

- Extend `ExerciseDisplay` in `apps/web/src/content/types.ts` with `'notation'`
  (ADR-010 consequence); update `validateLessons` only if display validation
  exists to touch.
- Runner (`TASK-013`'s practice runner) renders `<Notation>` (TASK-037) when the
  hint is present, fed from `resolveExercise` output — staff and TAB are two
  projections of the same resolved data.
- Keep the component lazy: the runner must not pull VexFlow into the initial
  `/app` chunk (React `lazy`/dynamic import + suspense fallback).
- Opt in the existing lesson pack's scale/arpeggio exercises as part of this task.

## Acceptance criteria

- [x] `'notation'` display hint exists and is honored by the runner
- [x] Lesson-pack scale/arpeggio exercises opted in and rendering in dev
- [x] Runner test: exercise with the hint renders notation; without it, none
- [x] Initial `/app` load still excludes VexFlow (build-output check)
- [x] `bun run check` passes

## Verification

`bun run --cwd codebase check`; `bun run --cwd codebase dev`, run a lesson with a
flat-key exercise and read the staff+TAB; check network/chunks that VexFlow loads
only when a notation exercise appears.

## Open questions (deferred grill)

1. Should notation *replace* the fretboard for melodic exercises or sit beside it?
   This task stacks them (both hints honored) — confirm the runner layout doesn't
   drown the primary instruction.
2. ADR-010 Q1 applies here concretely: label opted-in eighth-note exercises
   "swing 8ths" as plain text, or leave rhythm feel unstated?

## Log

### 2026-07-07 — claimed (agent)

Plan (task + EPIC-009 + INS-029 + runner/notation code read). Measurable aim:
0 → all lesson-pack scale/arpeggio exercises show staff+TAB in the runner;
signal: dev-server read of a flat-key exercise + runner tests + chunk check.

1. `ExerciseDisplay` gains `'notation'` (types.ts); `validateLessons` has no
   display validation to touch — skip, per task context.
2. Runner `ExercisePanel` renders `<Notation measures={deriveRhythm(resolved.positions)}>`
   when the hint is present, stacked below the fretboard (open Q1: both hints
   honored), wrapped in `overflow-x-auto`, with a summary `aria-label`
   (`"<exercise title> — staff and tablature"`, INS-029 §1).
3. Planned deviation from the task's Context: static import of `<Notation>`, no
   `React.lazy`/Suspense — the lazy boundary already lives *inside* the
   component (dynamic import of `notationRender`, the only VexFlow importer,
   TASK-037/ADR-010), so the actual constraint (VexFlow out of the initial
   `/app` chunk) holds; verified against build output (criterion 4).
4. INS-029 fold-ins: §2 loading placeholder inside `<Notation>` (state flips on
   first successful render); §3 legibility floor — `min-width` of half natural
   width on the SVG + horizontal scroll in the runner wrapper; §4 eyeball
   accidental crowding on a flat-key exercise in dev; §5 chunk re-check at the
   real integration.
5. Lesson pack: both exercise helpers opt in (`display: ['fretboard','notation']`).
6. Tests (component layer per testing-strategy): runner shows notation with the
   hint / none without; placeholder appears then clears; lesson-pack opt-in
   asserted in lessons.test.ts.
7. `bun run check`, e2e smoke (practice flow touched → trigger per
   testing-strategy), review, dev-server manual read, ship.

### 2026-07-07 — done

Shipped per plan; both target checkpoints verified live in the dev server via a
scripted browser (screenshots read, not assumed):

- **B♭ major, middle position** (flat-key criterion): staff shows the position's
  full tone path starting from A below the root, flats verbatim on B♭/E♭, correct
  measure-local accidental carry (bar 2 re-glyphs B♭ per octave — engraving
  standard), zero sharps; TAB frets 5–8 match the fretboard view; no accidental
  crowding at this density (INS-029 §4 eyeballed, no widening needed). C maj7
  arpeggio (open) also read: all naturals, no spurious glyphs.
- **Summary aria-label** (INS-029 §1) live: "B♭ major — middle position — staff
  and tablature".
- **Narrow viewport** (INS-029 §3, product call): min-width floor at half natural
  size + horizontal scroll inside the runner's `overflow-x-auto` wrapper; at
  375px the score scrolls in its own container and the page body does not
  overflow (no ISSUE-001 regression; e2e phone-width spec also green).
- **Chunk split re-check** (INS-029 §5, criterion 4): in the shipped build the
  1.1 MB `notationRender` chunk has **no** static importers — referenced only
  via dynamic `import()` from the practice chunk; AppShell stays 132 KB.
- **Gate**: `bun run check` green (558 tests); e2e smoke 4/4 green (practice
  flow touched → trigger per testing-strategy); no console errors/warnings in
  the manual browser pass.

Deviation from the task Context: `<Notation>` is imported statically, no
`React.lazy`/Suspense — the lazy boundary already lives inside the component
(dynamic import of `notationRender`, the only VexFlow importer, TASK-037), so
the real constraint holds; proven by the build-output check above.

Review (code-reviewer + ui-code-reviewer, no must-fix): fixed in-task — render
failure now swaps the placeholder for a terminal "Notation couldn't load."
instead of an eternal "Loading…" (three-state status + regression test via a
spelling/position mismatch); `max-width` capped at natural size so short
exercises no longer upscale ~2× on wide panels; `aria-busy` while loading;
named `MIN_WIDTH_FRACTION` constant. INS-029 §2 satisfied via the placeholder
path (the insight's either/or); residual first-draw layout shift plus two
reviewer nits (keyboard-scrollability of the overflow region, summary-vs-spelled
aria-label content) filed as INS-030 rather than fixed — each is a product
judgment, not a defect. INS-029 closed (`accepted`, outcome TASK-038); wiki
`product/overview` + `wiki/log` updated (notation now in the product).

Watch in next QA review: notation legibility on real phones (the 50% floor is a
first guess), first-notation-exercise layout shift, and whether stacked
fretboard + score drowns the primary instruction (open question 1).
