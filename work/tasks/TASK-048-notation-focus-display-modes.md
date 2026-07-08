---
id: TASK-048
title: Make runner notation readable with focus mode and display toggles
epic: EPIC-009
status: backlog
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

- [ ] Runner notation default rendering is larger and remains legible on desktop
      and phone-width viewports
- [ ] A focus/full-screen mode shows the score as the primary surface with only
      the controls needed to continue practice
- [ ] The user can switch between staff only, TAB only, and staff+TAB, with the
      mode reflected in accessible names
- [ ] The first notation load reserves enough space or otherwise avoids pushing
      core runner controls down unexpectedly
- [ ] Keyboard and screen-reader behavior for the score/focus controls is
      deliberate and tested
- [ ] The Playwright smoke path asserts that a notation SVG with score content
      actually rendered
- [ ] `bun run --cwd codebase check` passes
- [ ] `bun run --cwd codebase check:e2e` passes

## Verification

- `bun run --cwd codebase check`
- `bun run --cwd codebase check:e2e`
- Manual browser pass at desktop and 375px: start a notation-bearing lesson,
  switch staff/TAB/both, enter/exit focus mode, verify no console errors and no
  incoherent overlap.
