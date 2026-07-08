---
id: ISSUE-003
title: Focus lands on <main>, not the lesson heading, when the runner mounts in a real browser
status: fixed
severity: minor
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

## Triage note

2026-07-08 heartbeat - Confirmed from the original real-browser observation and
kept as minor: focus lands on the named `<main>` landmark, not `body`, so this
is an accessibility polish defect rather than a blocker. Fold diagnostic
coverage into TASK-052 unless it becomes user-visible friction sooner.

## Log

### 2026-07-08 - claimed (agent)

Plan: reproduce the runner-start focus path locally, inspect the view-focus
hooks around PracticePage and PracticeRunner, then make the runner heading win
the real-browser focus order. Verification target: a real browser reports the
runner lesson heading as `document.activeElement` after clicking Start, and
`bun run --cwd codebase check` passes.

### 2026-07-08 - fixed

Local Chromium did not reproduce the deployed observation on the current tree:
both planned-lesson Start and lesson-list Start leave focus on the runner `<h2>`.
Added Playwright smoke assertions for those browser-only focus contracts so a
future effect-order regression fails at the layer where this was found.
Independent subagent review was unavailable under the current tool policy, so
degraded self-review covered scope, focus contract, test layer, and security
surface; no findings. Verification: `bun run --cwd codebase check` green after
rerun outside the sandbox for Wrangler log access; `bun run --cwd codebase check:e2e`
green.
