---
id: TASK-029
title: Run QA/product review of the foundation surface
status: backlog
depends_on: []
created: 2026-07-06
---

# TASK-029 — Run QA/product review of the foundation surface

## Goal

A `REV-001` report per `processes/qa-product-review.md` covering everything shipped since repo start, so the practice-loop work (goal 3) builds on inspected, not assumed-good, foundations.

## Context

Scheduled by heartbeat 2026-07-06. Cadence rule fired twice over: 11 tasks shipped with zero `REV-*` on record, and EPIC-001 (foundation) reached `done`. Surface to review: app shell + routing (TASK-001), theory core incl. scales/arpeggios/positions (TASK-002/009/010), Fretboard and ChordDiagram components (TASK-003/004), typed localStorage persistence (TASK-008).

Known open items to fold into (not duplicate from) the review: ISSUE-001 (mobile horizontal overflow, confirmed minor), deferred insights INS-002/004/005 (shell polish, fretboard hardening, chord-diagram follow-ups). If TASK-006 (testing/QA practices) has shipped by pick-up time, run the upgraded inspection steps it produces.

## Acceptance criteria

- [ ] `work/reviews/REV-001-*.md` exists in the process's report format
- [ ] Every EPIC-001 surface listed above inspected (running app, not just code)
- [ ] Findings filed as `INS-*`/`ISSUE-*`/`NOTE-*` per `processes/feedback-intake.md` — none fixed inline
- [ ] `bun run check` passes (no code changes expected; the gate still runs)

## Verification

The REV file exists and each surface has an entry; filed findings link back to `source: REV-001`.
