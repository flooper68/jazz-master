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

This is the canonical map from source material to actionable work. Only tasks and confirmed issues are directly implemented by `processes/dev-loop.md`; everything else is intake, evidence, prioritization, or durable context.

| Source | Process | Actionable outcome |
|---|---|---|
| Vision and goals | Human owner, then epics/tasks | `EPIC-*` and `TASK-*` |
| Owner notes, user feedback, agent observations | `processes/feedback-intake.md` | `NOTE-*`, `INS-*`, `ISSUE-*`, or already-agreed `TASK-*` |
| New insights | `processes/triage.md` | accepted insight with `outcome: [TASK-*]`, rejected, or deferred |
| Open issues | `processes/triage.md` | confirmed issue, direct fix candidate, or linked `TASK-*` |
| QA/product reviews | `processes/qa-product-review.md` then triage | `REV-*` plus filed `INS-*`, `ISSUE-*`, or `NOTE-*` |
| Completed research | consuming task or `processes/knowledge-maintenance.md` | implementation/doc/process change, `TASK-*`, ADR, defer/reject/no-action |
| Stale docs, stale research, unprocessed notes | `processes/knowledge-maintenance.md` | linked work, pruned/deferred decisions, index updates |
| Multiple ready candidates | `processes/prioritization.md` | next task or issue to run through the dev loop |
| Everything accumulated since the last beat (owner-triggered) | `processes/heartbeat.md` | triaged inboxes, scheduled hygiene `TASK-*` (QA review, knowledge sweep, security review), next 1–3 recommendation in `work/HEARTBEAT.md` |

Provenance is kept with `source:` for notes/insights/issues/reviews and `research:` for completed `RES-*` files.

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
research: RES-0XX             # optional, only after the RES file exists
created: YYYY-MM-DD
---

# TASK-0XX — <title>

## Goal
One outcome-oriented sentence.

## Problem brief
<!-- Required for product-facing work or when the problem statement is ambiguous;
     omit for purely technical/internal tasks where Goal + Context suffice. (RES-008) -->
Current condition:
Desired condition:
Affected user/workflow:
Evidence:
Baseline:
Target:
How we will know it improved:

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
For product-facing observations, note the current condition, desired condition, and
evidence when known — triage needs these before it can accept the insight into a task.

## Product framing   # optional; include when known
Current condition:
Desired condition:
Affected user/workflow:
Evidence:
Validation need: dogfood | external user | research/spike | direct task candidate
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

Product-facing tasks distinguish **output** (what will be built) from **outcome** (what should improve for the user, from baseline to target) — that is what the Problem brief carries. Framing guidance: `research/RES-008-organizational-problem-identification-measurement-solving-frameworks.md`.

Quality bar for product-facing tasks, adapted from `processes/product-practices.md`:

- Outcome before output: name the behavior, product state, or workflow quality that should improve.
- Small and vertical: one shippable path, not a grab-bag of adjacent improvements.
- Bounded: out-of-scope items and no-gos are explicit when ambiguity could cause scope creep.
- Testable: acceptance criteria are objective and verification can be run by a future agent.
- Traceable: source insight, issue, note, research, or strategy context is linked.

Attach each task to an existing epic unless there is a clear reason it is standalone. Tasks created from feedback, issues, insights, notes, reviews, or research must preserve provenance in `source:` or `research:`.

Do not reserve future research IDs in backlog tasks. If a task needs research first, say so in Context and assign the `RES-###` when `processes/deep-research.md` actually creates the file.
