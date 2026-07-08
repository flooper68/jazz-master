---
id: TASK-048
title: Make runner notation readable with focus mode and display toggles
epic: EPIC-009
status: done
depends_on: []
source: NOTE-011
created: 2026-07-08
---

# TASK-048 - Make runner notation readable with focus mode and display toggles

## Goal

The practice runner's notation is comfortably readable in normal use and has a
full-screen focus mode plus staff/TAB/both display controls.

## Problem brief

Current condition: runner notation can be too small, always renders staff and
TAB together, still shifts layout on first draw, and has no full-screen/focus
mode.
Desired condition: a guitarist can read the exercise from laptop distance or
music-stand distance, choose staff, TAB, or both, and keep the score usable at
phone and desktop widths.
Affected user/workflow: playing any notation-bearing guided exercise.
Evidence: NOTE-009 first raised notation size and toggles; NOTE-011 upgraded it
to a "really big problem" that should be solved ASAP.
Baseline: fixed inline staff+TAB pair only; no persisted display preference;
first notation draw can move the grading controls.
Target: readable default score, focus mode, display mode control, no distracting
first-draw jump, and e2e coverage that proves a real score rendered.
How we will know it improved: owner can run a notation exercise and read it
without squinting; automated tests cover the visible modes and rendered SVG.

## Context

Promotes INS-034 and INS-035. Fold in the still-relevant runner notation polish
from INS-030 and the e2e render-assertion gap from INS-031
(`work/insights/INS-031-e2e-notation-render-assertion.md`). Keep preference
persistence inside `apps/web/src/storage/` if persisted. The focus mode should
stay inside the runner flow; do not create a separate route unless the
implementation needs one.

## Acceptance criteria

- [x] Runner notation default rendering is larger and remains legible on desktop
      and phone-width viewports
- [x] A focus/full-screen mode shows the score as the primary surface with only
      the controls needed to continue practice
- [x] The user can switch between staff only, TAB only, and staff+TAB, with the
      mode reflected in accessible names
- [x] The first notation load reserves enough space or otherwise avoids pushing
      core runner controls down unexpectedly
- [x] Keyboard and screen-reader behavior for the score/focus controls is
      deliberate and tested
- [x] The Playwright smoke path asserts that a notation SVG with score content
      actually rendered
- [x] `bun run --cwd codebase check` passes
- [x] `bun run --cwd codebase check:e2e` passes

## Verification

- `bun run --cwd codebase check`
- `bun run --cwd codebase check:e2e`
- Manual browser pass at desktop and 375px: start a notation-bearing lesson,
  switch staff/TAB/both, enter/exit focus mode, verify no console errors and no
  incoherent overlap.

## Log

### 2026-07-08 - claimed (agent)

Plan: keep VexFlow behind the existing `<Notation>` seam while adding
staff/TAB/both rendering modes; add a small typed storage store for the runner's
display preference; wire an inline segmented display control and a focus-mode
score surface in `PracticeRunner`; reserve score height and make the overflow
region intentionally keyboard-scrollable; cover modes/focus/accessibility with
component tests and add the Playwright SVG-content assertion.

### 2026-07-08 - done

Implemented mode-aware notation rendering (`both`/`staff`/`tab`), larger inline
and focus scaling, a reserved keyboard-scrollable score viewport, display-mode
controls with accessible names, an in-run focus dialog with grading controls and
focus trapping, plus a versioned `notation-preferences` localStorage store.
Added unit/component coverage for render modes, persisted preference,
keyboard/focus behavior, and focus grading; the Playwright smoke happy path now
asserts SVG score glyphs render. Review: independent review subagents were not
available under the active tool policy, so the code-review and security/privacy
checklists were completed as a degraded self-review; one keyboard focus issue was
fixed before ship. Security/privacy checklist: no concerns — the new store keeps
only a non-sensitive display preference, is typed/versioned, and fails closed to
the default. Verification: focused tests passed; `bun run --cwd codebase check`
passed; `bun run --cwd codebase check:e2e` passed; final Chromium manual pass at
1280px and 375px switched staff/TAB/both, opened/exited focus mode, verified
inline/focus SVG glyphs rendered, confirmed focus wraps inside the dialog, and
found no console errors or page-level horizontal overflow.
