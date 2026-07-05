# Work — flow items

Everything in this directory has a **lifecycle**: it is created, moves through statuses, and ends. Raw source material lives in `notes/`; durable knowledge lives in `strategy/`, `processes/`, `architecture/`, and `research/` — see CLAUDE.md for the full map.

```
work/
  epics/     EPIC-###   a coherent feature area (weeks of work)
  tasks/     TASK-###   one unit of work, finishable in a single session
  insights/  INS-###    raw ideas inbox — cheap to file, processed by triage
  issues/    ISSUE-###  reported bugs — reproduced, triaged, fixed via the dev loop
  reviews/   REV-###    QA/product review reports
```

## How work flows

Visions (`strategy/`) spawn epics; epics spawn tasks; only tasks/issues are directly implemented (via `processes/dev-loop.md`). Raw notes and feedback live in `notes/` and are processed by `processes/feedback-intake.md`. QA reviews (`processes/qa-product-review.md`) file insights and issues; triage (`processes/triage.md`) turns those into tasks; prioritization (`processes/prioritization.md`) orders the next work. Provenance is kept via `source:` frontmatter.

## Conventions (all item types)

- Filename `<ID>-<kebab-slug>.md`; IDs sequential per type, never reused (list the directory for the next free one).
- YAML frontmatter carries `id`, `title`, `status`, `created`, and type-specific fields. Frontmatter is the single source of truth — there is no external tracker.
- Files are never deleted; terminal statuses (`done`, `rejected`, `wontfix`) keep the history searchable.
- Work-in-flight appends to a `## Log` section (format in `processes/dev-loop.md`).

## Statuses

| Type | Flow |
|---|---|
| epic | `backlog → in-progress → done` |
| task | `backlog → in-progress → done` (+ `blocked` with stated reason) |
| insight | `new → accepted \| rejected` (accepted records `outcome:` task ids; rejected records why) |
| issue | `open → confirmed → in-progress → fixed \| wontfix` |
| review | none — a report, immutable once shipped |

## Templates

### Task

```markdown
---
id: TASK-0XX
title: <imperative title>
epic: EPIC-0XX
status: backlog
depends_on: []
source: INS-0XX | ISSUE-0XX | NOTE-0XX   # optional provenance
research: RES-0XX             # optional, if a research phase feeds it
created: YYYY-MM-DD
---

# TASK-0XX — <title>

## Goal
One outcome-oriented sentence.

## Context
What the implementer needs; link epics, research, code paths.

## Acceptance criteria
- [ ] Each item objectively true/false
- [ ] `bun run check` passes

## Verification
Exact commands/steps proving the criteria.
```

### Insight

```markdown
---
id: INS-0XX
title: <short idea>
status: new
created: YYYY-MM-DD
source: NOTE-0XX | REV-0XX    # optional provenance
---

The idea, in as little as two sentences. Where it came from. Why it might matter.
```

### Issue

```markdown
---
id: ISSUE-0XX
title: <symptom>
status: open
severity:            # set at triage: blocker | major | minor
created: YYYY-MM-DD
source: NOTE-0XX | REV-0XX    # optional provenance
---

## Steps to reproduce
## Expected
## Actual
```

### Epic

Follow the existing files in `epics/`. Each epic should include:

- goal
- why this matters now
- scope
- out of scope
- task list
- Done when
- current status note
- last reviewed date

Agents create epics only when asked. Triage may propose an epic when an insight is too large for tasks.

### Review

Follow the format in `processes/qa-product-review.md`.

## Writing a good task

Completable in one focused session; verifiable without human judgment where possible. If it grows mid-flight, split it: ship a slice, file follow-ups, link them.

Attach each task to an existing epic unless there is a clear reason it is standalone. Tasks created from feedback, issues, insights, notes, or research should preserve provenance in `source:` or `research:`.
