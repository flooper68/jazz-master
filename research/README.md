# Research

Persisted results of deep research (`processes/deep-research.md`). Research is a first-class deliverable: files here let future work act on past findings instead of re-searching.

- Files: `RES-###-<slug>.md`, sequential IDs, never deleted.
- A task that includes research links its result via `research: RES-###` frontmatter.
- Before starting new research, check whether an existing RES file already covers (part of) the topic.

## File format

```markdown
---
id: RES-001
title: <topic>
status: complete          # in-progress | complete
task: TASK-005            # consuming work item, if any
created: 2026-07-05
stale_when: <what would invalidate this — e.g. "React 20 / Tailwind v5 release">
---

# RES-001 — <topic>

## Research questions
Numbered, concrete (framed before searching).

## Findings
Per question: what the evidence says, with inline citations [1][2].
Where credible sources disagree, both positions + our pick and reasoning.
Single-source claims are flagged as such.

## Recommendations
What THIS project should adopt / adapt / skip — actionable, each traceable
to a finding. Include considered-and-rejected alternatives with reasons.

## Sources
[1] Title — URL (published/updated date, accessed date)
```
