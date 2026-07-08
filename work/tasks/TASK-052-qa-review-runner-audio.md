---
id: TASK-052
title: Run QA/product review of runner, notation, and audio surfaces
status: backlog
proposed_by: HEARTBEAT 2026-07-08
depends_on: []
created: 2026-07-08
---

# TASK-052 - Run QA/product review of runner, notation, and audio surfaces

## Goal

A fresh QA/product review inspects the shipped guided-practice, notation,
play-along, platform, and recording-capture surfaces after the large burst of
post-foundation work.

## Context

Scheduled by heartbeat 2026-07-08. Cadence rule fired: the status report shows
34 task/issue commits since the last review, with EPIC-009 and EPIC-014 both
completed and EPIC-010 recording work in progress. Run
`processes/qa-product-review.md`; do not fix findings inline.

Known charters to include:

- Runner usability after play-along and recording controls
- Notation readability/focus/toggle problems captured in NOTE-011 and TASK-048
- Audio controls, console/network cleanliness, and sample loading behavior
- Phone-width navigation after placeholder pages are removed
- Accessibility/focus including ISSUE-003

## Acceptance criteria

- [ ] A new `work/reviews/REV-###-*.md` report exists in the QA review format
- [ ] The review covers desktop and phone-width guided practice flows
- [ ] Findings are filed as issues/insights/notes and linked from the report
- [ ] `bun run --cwd codebase check:e2e` is run first per the review process
- [ ] `bun run --cwd codebase check` passes

## Verification

- The review report exists and links filed findings.
- `bun run --cwd codebase check:e2e`
- `bun run --cwd codebase check`
