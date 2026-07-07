---
id: NOTE-008
title: Production deploy task abandoned outright (grill session)
created: 2026-07-07
source_type: grill-session
participants: [owner, agent]
processed: true
---

# NOTE-008 — Production deploy task abandoned outright (grill session)

## Context

While reviewing unfinished work, the owner made a decision-shaped call: "let's ditch the production deploy task fully — mark as abandoned" (TASK-036, until now `gated` per NOTE-006's "for now let's not deal with production"). Implicit grill triggered. Agenda proposed (① what "abandoned" means for the production story, ② whether the enforcement thinking survives) and a two-question ceiling set; question 2 was skipped as moot once question 1 was answered.

## Discussion and decisions

1. **What does abandonment mean (Q1)?** Agent offered the fork: (a) production is off the table as a concept — dev URL is the product's home, any future production work starts from a fresh task — vs (b) the owner merely dislikes the standing placeholder (with a gentle pushback that a gated task costs nothing and preserves already-thought-through questions). Owner: **"it is off for long enough we don't want to have in context"** — i.e. (a): the placeholder itself is the cost being removed; production is far enough out that carrying it in trackers, reports, and agent context buys nothing.
2. **Q2 (skipped, reasoning recorded):** the task file is not deleted (files are never deleted — work/README.md), so its three open questions (prod-trigger enforcement, naming/domain, promote-artifact semantics) survive on disk as raw material for any future fresh production task, and ADR-009's decision — production deploys owner-only, never agent-reachable — stands untouched. Nothing needed the owner's judgment.

## Routed questions

None — the single question was answered in-session.

## Write-backs and extracted work

- `work/tasks/TASK-036` — `status: abandoned` + `abandoned_reason:`; abandonment banner added; the deferred-grill heading renamed so the heartbeat stops collecting its questions as outstanding.
- `work/README.md` — `abandoned` added to the task status vocabulary (terminal, carries `abandoned_reason:`) and to the terminal-statuses list.
- `architecture/overview.md` — deployment section + current-state paragraph: production is off the roadmap, dev URL is the home.
- `architecture/LOG.md` — log entry for the decision.
- `work/epics/EPIC-013` — production removed from remaining epic scope; Last reviewed updated.
- `wiki/product/overview.md` + `wiki/log.md` — under-the-hood synthesis updated.
- ADR-009 deliberately untouched: its decision is unaffected; its TASK-036 references now resolve to a file that records its own abandonment.
