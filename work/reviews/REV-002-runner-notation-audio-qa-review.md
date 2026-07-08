---
id: REV-002
date: 2026-07-08
scope: [TASK-013, TASK-016, TASK-017, TASK-018, TASK-019, TASK-023, TASK-024, TASK-035, TASK-037, TASK-038, TASK-041, TASK-042, TASK-046, TASK-047, TASK-048, TASK-049, TASK-050, TASK-051, ISSUE-003]
filed: [ISSUE-004]
---

# REV-002 - QA/product review

## Inspected

Charters run:

- Practice-loop value: dashboard → planned lesson → runner → play → grade →
  history/dashboard evidence.
- Runner usability: play-gated timing, grading, recording panel visibility, and
  current exercise advancement.
- Notation readability: staff/TAB/both display modes, score SVG rendering,
  reserved score viewport, and focus mode.
- Audio controls: play/stop state, tempo range, guitar/click volume controls,
  console cleanliness, and observed asset inventory.
- Navigation/responsiveness/accessibility: dashboard, practice, history,
  profile, not-found, desktop width and 375px phone width, with focus behavior
  including the known `ISSUE-003` area.

Evidence captured:

- `bun run --cwd codebase check:e2e` passed: 5 Playwright smoke tests.
- Desktop dashboard and landing rendered one clear `h1`, no horizontal page
  overflow, and no browser warnings/errors.
- Dashboard `Start practicing` opened the planned notation lesson; focus landed
  on the runner lesson heading in the local desktop browser pass.
- Before play, `Next` was disabled; after pressing `Play`, `Stop` appeared and
  `Next` became enabled. Tempo exposed `40` to `200` BPM, with guitar and click
  volume sliders at `0` to `100`.
- Grading opened after `Next` and moved focus to `Got it`; grading advanced to
  the next exercise.
- Notation modes switched in-run: Staff selected `aria-pressed="true"` and
  rendered staff notation; TAB selected `aria-pressed="true"` and rendered a
  smaller TAB-only SVG; Both remained available.
- Focus mode opened as a full-viewport dialog on phone width and rendered score
  SVG content without page-level horizontal overflow.
- At 375px, dashboard, practice list, runner, history, profile, and not-found
  all measured `documentElement.scrollWidth === innerWidth` and logged no
  browser warnings/errors.
- Page asset inventory after the audio surface loaded showed local dev assets
  only; no unexpected external resources appeared.
- The recording control was inspected but the microphone permission prompt was
  not accepted during this review.

## Health

The current product is a credible local-first guided-practice slice. A guitarist
can open the dashboard, start a planned lesson, hear the exercise, control tempo
and mix, read notation/TAB, self-grade, and later find the session in history.
The app now behaves like a practice loop rather than a static reference surface.

The recent runner work is holding up under desktop and phone-width review:
play-gated grading works, notation has readable modes, phone layouts avoid page
overflow, and the app shell now exposes only the real product routes. The
remaining fragility is accessibility polish around focus restoration. Recording
is visibly staged: the panel clearly says audio stays on device, but credible
score feedback is still future `TASK-043` work.

## Findings

- `ISSUE-004` - minor defect: closing notation focus mode with `Escape` drops
  focus to `<body>` instead of restoring focus to the opener or another runner
  control. Evidence: desktop browser pass opened focus mode, `Exit focus` held
  focus, `Escape` closed the dialog, and `document.activeElement` became
  `<body>`. Baseline observation: focus restoration is lost after modal close.
  Candidate target: focus returns to the Focus button or a deliberate score
  control. Validation need: direct task candidate.
- `ISSUE-003` - existing minor defect remains relevant but did not reproduce in
  the same way locally during this review. Evidence: the local dashboard →
  runner path focused the lesson heading; the original live-URL report still
  says a real deployed click landed on `<main>`. Baseline observation: focus
  behavior differs between environments and should stay tracked. Candidate
  target: browser e2e coverage for runner-start focus on the deployed-style
  flow. Validation need: direct task candidate.

## Recommended next

1. `TASK-054` - run the scheduled security/privacy review before more storage,
   server, sample-loading, and microphone-permission work builds on the current
   surfaces.
2. `ISSUE-004` - fix focus restoration from notation focus mode; this is narrow,
   user-facing, and easy to regression-test.
3. `TASK-053` - run the knowledge maintenance sweep after the security review so
   the duplicate insight ID, stale research, and deferred-insight aging are
   cleaned up with the latest QA findings in hand.

Owner confirmation needed: none blocking. The recording/scoring usefulness
question remains the already-planned `TASK-043` path, not a new review finding.
