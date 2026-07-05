# Notes

Raw source material that may produce work but is not itself implementation work. Use notes for owner thoughts, meetings, calls, observations, or feedback batches where preserving context matters.

Notes are processed through `processes/feedback-intake.md` and `processes/knowledge-maintenance.md`. Extracted work goes to `work/insights/`, `work/issues/`, `work/tasks/`, or `architecture/decisions/` with links back to the note.

## Files

- `NOTE-###-<slug>.md`
- IDs are sequential and never reused.
- Notes are never deleted; set `processed: true` when all useful outputs are linked or explicitly dismissed.

## Template

```markdown
---
id: NOTE-0XX
title: <meeting/topic>
created: YYYY-MM-DD
source_type: meeting | call | observation | chat | owner-note | user-feedback
participants: []
processed: false
---

# NOTE-0XX - <title>

## Context

## Discussion

## Decisions

## Action items

## Extracted work
- INS-0XX
- ISSUE-0XX
- TASK-0XX
- ADR-0XX
```
