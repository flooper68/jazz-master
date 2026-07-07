---
id: ISSUE-002
title: Focus is lost when views swap without navigation (practice list ↔ runner ↔ summary)
severity: minor
status: fixed
source: TASK-013
created: 2026-07-06
---

# ISSUE-002 — Focus is lost when views swap without navigation

Found by the TASK-013 UI review. The practice runner swaps whole views inside
one route: lesson list → runner (Start click), runner → summary (last grade),
summary/runner → list (Done / End lesson). Each transition unmounts the element
that held focus, dropping focus to `document.body` with no announcement —
keyboard and screen-reader users lose their place at every step.

## Steps to reproduce

1. `bun run dev` → `/practice`, Tab to a lesson's Start button, press Enter
2. Observe `document.activeElement` — it is `body`, not anything in the runner

## Expected

Focus moves to the new view's heading (`tabIndex={-1}` + ref focus) or the swap
region announces via `aria-live`.

## Notes

Deferred from TASK-013 rather than fixed inline because the right fix is an
app-wide pattern (any same-route view swap, and probably route changes too, have
this problem) — worth one consistent mechanism, not a one-off in the runner.
Related: [[INS-010]] automated axe checks would not catch this (focus order is
behavioral); a Playwright a11y flow ([[INS-009]]) could.

## Triage

2026-07-06 (TASK-030 sweep) — Reproduced in a real browser (Playwright,
dev build): after focusing a lesson's Start button and pressing Enter,
`document.activeElement` is `BODY`; the same drop happens on the
onboarding → list swap ("Skip for now" + Enter also lands focus on `BODY`),
confirming the app-wide nature the notes predicted. `status: confirmed`,
severity stays `minor`. Sized trivial-to-small (< 1 session): one shared
focus-on-swap mechanism (e.g. a `tabIndex={-1}` heading ref focused on view
change) applied to the runner's three swaps and onboarding — the issue itself
is the work item; the dev loop can pick it directly.

## Log

### 2026-07-07 — claimed (agent)
Plan: one shared mechanism, `useViewFocus(viewKey, { focusOnMount })` in
`apps/web/src/components/useViewFocus.ts` — returns a ref to attach to the
current view's `tabIndex={-1}` heading; focuses it when the view key changes
(optionally on mount, for components whose mounting IS the swap). Apply to:
PracticeRunner (list → runner via mount, runner → summary via key change),
PracticePage (runner/summary → list), root route (onboarding → app), and
consolidate OnboardingWizard's existing inline step-focus effect onto the same
hook. Route changes stay out of scope (see done entry). Tests per
testing-strategy: Testing Library, assert the incoming heading has focus after
each swap.

### 2026-07-07 — fixed
Shipped `useViewFocus` and applied it to all four swap sites:

- `PracticeRunner.tsx` — key `finished ? 'summary' : 'exercises'` with
  `focusOnMount: true`; ref on the lesson h2 and the "Lesson complete" h2.
  Covers list → runner (Start / dashboard handoff) and runner → summary.
- `PracticePage.tsx` — key `run-<sessionId>` / `'list'`; ref on the list view's
  "Practice" h1 only, so returning (End lesson / Done) refocuses it while the
  incoming runner handles its own focus on the way in.
- `__root.tsx` + `Layout.tsx` — key `'onboarding'` / `'app'`; new optional
  `mainRef` prop on Layout puts the ref + `tabIndex={-1}` on `<main>`.
  **Deviation:** the onboarding → app swap focuses the main landmark, not a
  heading — the routed page's heading isn't reachable by ref from the root
  component that owns the swap; focusing the content landmark is the standard
  fallback and keeps the mechanism single.
- `OnboardingWizard.tsx` — inline step-focus effect (refs + mounted flag)
  replaced by `useViewFocus('step-<n>')`; behavior unchanged, existing focus
  test still green.

Tests: runner mount + summary focus (PracticeRunner.test.tsx, incl. asserting
mid-lesson advance does NOT steal focus), full-session and early-exit swaps
back to the list heading (PracticePage.test.tsx), onboarding → app main focus
(router.test.tsx). `bun run check` green.

Out of scope, noted as follow-up: route changes (nav-link navigation) keep
focus on the persistent nav link rather than dropping it to `body` — a milder,
different problem than this issue's unmount-drop; left for a future item.
