---
id: ISSUE-001
title: App shell overflows horizontally at mobile widths
severity: minor
status: confirmed
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
