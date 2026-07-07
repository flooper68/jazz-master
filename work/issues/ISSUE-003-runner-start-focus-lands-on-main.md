---
id: ISSUE-003
title: Focus lands on <main>, not the lesson heading, when the runner mounts in a real browser
status: open
severity:
created: 2026-07-07
source: TASK-024
---

# ISSUE-003 — Runner-mount focus lands on `<main>` in a real browser

Observed during TASK-024's live-URL verification (deployed build including the
ISSUE-002 fix, Playwright/Chromium against https://jazz-master.premysl-ciompa.workers.dev).

## Steps to reproduce

1. Fresh profile → `/app/practice` → "Skip for now" (focus correctly lands on `<main>` — the onboarding→app swap)
2. Click a lesson's Start button (real click)
3. Inspect `document.activeElement`

## Expected

The runner's lesson heading (`<h2 tabindex="-1">Maj7 arpeggios</h2>`) has focus —
this is what `PracticeRunner.test.tsx`'s "runner mount focuses lesson heading"
asserts in jsdom (`focusOnMount: true` on the runner's `useViewFocus`).

## Actual

`document.activeElement` is the `<main>` element. The heading exists with
`tabindex="-1"` but does not hold focus. The key-change path works correctly live:
grading the last exercise moves focus to the "Lesson complete" summary `<h2>`.

## Notes

Not a regression to the original ISSUE-002 bug (focus is on a labeled landmark,
not dropped to `body`), but a real-browser/jsdom behavioral divergence worth
understanding: candidates include effect-ordering between PracticePage's
key-change hook (its ref stays attached to the still-rendered "Practice" h1),
the runner's `focusOnMount` effect, and the browser's own focus handling of the
clicked-then-unmounted Start button. First diagnostic step: reproduce locally
(`bun run dev`, real browser) and log the firing order of the `useViewFocus`
effects. Related: [[INS-027]] (route-change focus), the planned Playwright
suite (TASK-035) could pin this class of behavior in a real browser.
