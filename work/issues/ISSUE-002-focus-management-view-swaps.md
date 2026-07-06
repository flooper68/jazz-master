---
id: ISSUE-002
title: Focus is lost when views swap without navigation (practice list ↔ runner ↔ summary)
severity: minor
status: confirmed
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
