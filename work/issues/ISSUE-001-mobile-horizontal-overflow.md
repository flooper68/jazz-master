---
id: ISSUE-001
title: App shell overflows horizontally at mobile widths
severity: minor
status: fixed
source: REV-001
created: 2026-07-05
---

# ISSUE-001 — App shell overflows horizontally at mobile widths

Found during TASK-004 verification while checking the Voicings demo grid at a
narrow viewport.

## Steps to reproduce

1. `bun run dev`, open any page (e.g. `/voicings`)
2. Resize the window to a phone-like width (~420px)

## Expected

Main content wraps/reflows within the viewport; sidebar collapses or shrinks.

## Actual

The fixed-width sidebar plus main content exceed the viewport: body text and
page content are clipped on the right (plain paragraphs clip instead of
wrapping, so the main area itself is wider than the viewport). Not caused by
any one page — reproduces with text-only stub pages.

## Environment

Chromium via Playwright, viewport 420×800, dev build 2026-07-05.

## Notes

Related to (but not covered by) [[INS-002]] app-shell polish. Likely a Layout
sizing issue (fixed sidebar width + unconstrained main min-width).

Re-confirmed in REV-001 at 375×800: `/`, `/voicings`, `/progressions`,
`/practice`, `/repertoire`, and `/ear-training` all exceed the viewport;
`/voicings` measured 752px document width against a 375px viewport.

## Triage

2026-07-06 (heartbeat) — `status: confirmed`, severity `minor`, on the strength
of the documented Playwright reproduction (420×800, reproduces on text-only stub
pages) from TASK-004 verification. Sized trivial (Layout sizing fix, < 1
session): the issue itself is the work item — no separate task; the dev loop
can pick it directly. Also normalized the frontmatter status vocabulary (was
`new`; the issue flow starts at `open`).

## Log

### 2026-07-06 — claimed (agent)
Plan: root cause is `components/Layout.tsx` — the shell is a single flex row
with a fixed `w-56 shrink-0` sidebar and a `flex-1` main whose implicit
`min-width: auto` stops it shrinking below its content, so the row overflows
phone viewports. Fix inside Layout only: stack the shell vertically below `md`
(sidebar becomes a full-width top bar with a wrapping horizontal nav), restore
the current sidebar layout at `md:` and up, and give `<main>` `min-w-0` so it
can shrink within the flex row. Test: a colocated `Layout.test.tsx` asserting
the load-bearing responsive classes (honest limitation: jsdom cannot measure
layout, so the test guards against accidental removal of the classes, not
against all overflow regressions). Verify for real in a browser at 375px on
`/app`, `/app/voicings`, `/app/practice`, `/app/history` via dev server.

### 2026-07-07 — fixed
Implemented as planned, all inside `components/Layout.tsx`: shell wrapper
`flex-col md:flex-row`, sidebar loses its unconditional `w-56` (now `md:w-56`)
and becomes a full-width top bar with `border-b` and a wrapping horizontal nav
(`flex-row flex-wrap md:flex-col`) below `md`; `<main>` gets `min-w-0` so it
can shrink inside the flex row, plus tighter mobile padding (`px-4 py-6`,
`md:px-8 md:py-10`).

Verified in a real browser (Playwright/Chromium against `bun run dev`,
viewport 375×800): `document.documentElement.scrollWidth` is exactly 375 on
all eight routes — `/app`, `/app/voicings`, `/app/progressions`,
`/app/practice`, `/app/history`, `/app/repertoire`, `/app/ear-training`,
`/app/profile` (REV-001 had measured 752 on `/voicings`). Screenshot of
`/app/voicings` at 375px confirms wrapped nav, wrapping body text, and chord
diagrams fitting the viewport. Desktop regression-checked at 1280×800:
scrollWidth 1280, sidebar 224px, main side-by-side to its right.

Tests: new `Layout.test.tsx` (3 tests) passes; the honest limitation stands —
jsdom does no layout, so the tests pin the load-bearing responsive classes
only. `bun run check` green (typecheck + lint + 522 tests + build, exit 0).
Onboarding-wizard viewport behavior was out of scope and untouched.

### 2026-07-07 — merge note (orchestrator)

Cherry-picked onto main after ISSUE-002 (which added `ref={mainRef} tabIndex={-1}` to the same `<main>` line); resolved by combining both — `<main ref={mainRef} tabIndex={-1} className="min-w-0 flex-1 px-4 py-6 md:px-8 md:py-10">`. Independent review verdict: clean; gate re-run green post-merge. Reviewer's out-of-scope note (onboarding-wizard mobile behavior unverified) recorded in the reflect step.
