---
id: ISSUE-004
title: Closing notation focus mode with Escape drops focus to the page body
status: confirmed
severity: minor
created: 2026-07-08
source: REV-002
---

# ISSUE-004 - Closing notation focus mode with Escape drops focus to the page body

## Steps to reproduce

1. Open `/app/practice` and start a notation-bearing lesson.
2. Open the score focus mode.
3. Press `Escape`.
4. Inspect `document.activeElement`.

## Expected

Focus returns to the control that opened focus mode, or to another deliberate
runner control near the score.

## Actual

The dialog closes and focus lands on `<body>`.

## Notes

Found during `REV-002` at desktop width. The focus dialog itself initially
focuses `Exit focus`, and mobile focus mode fits the viewport without page
overflow. This issue is limited to focus restoration after close.

## Triage note

2026-07-08 TASK-053 sweep - Confirmed from REV-002 browser evidence and code
inspection: `NotationFocusDialog` closes on Escape through `onClose` without
restoring focus to the opener. Severity remains minor; this is a direct fix
candidate and does not need a separate task.
