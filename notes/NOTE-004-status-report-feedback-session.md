---
id: NOTE-004
title: Owner feedback on the ad-hoc status report — content gaps and titles-first presentation
created: 2026-07-06
source_type: owner-feedback
participants: [owner, agent]
processed: true
---

# NOTE-004 — Owner feedback on the ad-hoc status report

## Context

The owner asked for "a report" and the agent produced one by manually sweeping
`work/` frontmatter and git (TASK-034, which would make this a one-command ask,
is still backlog — this session is its second evidence point). The owner then
gave iterative feedback on what the report must contain and how it must read.

## Feedback and decisions

1. **Content the report must include** (beyond TASK-034's original spec):
   - potential next tasks (already covered — fresh prioritization),
   - high-priority issues — an explicit open-issues section ordered by severity,
   - high-level epics/initiatives — the epic landscape mapped against the
     "Now" goals in `strategy/goals.md`, so "why this next" is visible.
2. **Presentation: titles first, IDs last.** Reports lead with human-readable
   titles ("Practice profile & onboarding"), because readers don't know the
   keys; the ID (TASK-016) appears only as a trailing note/parenthetical.
   IDs never lead a sentence or a list entry in owner-facing report output.
3. **Improve the report process now** — fold these into TASK-034's spec (it is
   still backlog, so a spec update, not rework). The agent additionally
   proposed, and the session accepted into the same spec update, a
   **repo-hygiene section** in the facts script (dirty working tree, unpushed
   commits, stray untracked files) — today's most important finding (finished
   TASK-013 work uncommitted) came from `git status`, which the original spec
   never consulted.

## Extracted work

- TASK-034 spec updated in-session (hygiene section, issues-by-severity,
  goal-alignment narration, titles-first convention) — see its Log entry.
