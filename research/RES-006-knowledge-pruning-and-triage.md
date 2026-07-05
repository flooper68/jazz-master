---
id: RES-006
title: Knowledge pruning and triage for insights, issues, research, and notes
status: complete
task: none              # requested directly by owner
created: 2026-07-05
stale_when: "The repo's work taxonomy changes, the project gains multiple regular contributors, or AI-agent knowledge maintenance tools become a standard part of the workflow."
---

# RES-006 - Knowledge pruning and triage for insights, issues, research, and notes

## Research questions

1. What do product and software-development sources recommend for periodically turning raw ideas, feedback, bugs, and research into actionable work?
2. How should a solo-owner, AI-agent-built project decide whether to accept, reject, defer, merge, or split incoming items?
3. How should bugs differ from product insights during triage?
4. How should completed research be converted into concrete process, architecture, or implementation tasks without losing traceability?
5. Do meeting notes belong in the existing `work/insights/` inbox, or does the repo need a separate document type for raw notes?

## Findings

### 1. Backlog refinement is an ongoing inspection/adaptation activity, not a one-time cleanup

The Scrum Guide treats the Product Backlog as the single ordered source of product work and says refinement breaks larger items into smaller, more precise ones with attributes such as description, order, and size. It also makes Product Backlog management accountable to the Product Owner: creating clear items, ordering them, and keeping the backlog visible and understood [1].

Atlassian's backlog-refinement guidance aligns with this: refinement means regularly reviewing, ranking, editing, estimating, clarifying, splitting, merging, and preparing items so the most important work is ready before planning. It specifically calls out duplicate deletion, breaking work into subtasks, and confirming priority order before closing a refinement pass [2].

For Jazz Master, this supports a recurring knowledge-pruning pass rather than ad hoc cleanup. A good pass should inspect new insights, open issues, completed research, and recent notes; adapt them into tasks, issue updates, rejected/deferred records, or architecture/process updates; and keep provenance.

### 2. Shape Up is a useful counterweight: do not maintain a giant central backlog of every thought

Shape Up argues that raw ideas are often either too vague or too over-specified. Useful shaped work should be rough enough to leave implementation judgment, solved enough to reduce major unknowns, and bounded enough to say what is out of scope [3].

It also strongly warns against a giant backlog. The useful pattern is not "review everything forever"; it is to bring a few timely, well-shaped options to the decision point, let unchosen options go, and rely on important ideas resurfacing with fresh context [4]. That conflicts somewhat with classical backlog-refinement practice, but the conflict is productive: keep a searchable archive, but do not treat every archived idea as a standing obligation.

For Jazz Master, the archive can remain complete because files are never deleted, but the actionable queue should stay small. Old `new` insights should be either accepted, rejected, or explicitly deferred with a "what would change this" note. Deferred should not mean "invisible backlog item with no kill criteria."

### 3. User-feedback research supports a lifecycle: collect, classify, validate, synthesize, act

A 2023 study of user-feedback practices across 40 practitioners and 32 software organizations found that organizations draw feedback from many sources and need structured activities to curate and act on it. The study's distilled best practices include active participation from people close to the work and validation across channels, rather than acting on single isolated feedback fragments [6].

This maps well to Jazz Master's `insights` concept: an insight should be a synthesized, product-relevant observation or idea, not necessarily the raw source itself. A single meeting note, app observation, or chat comment might produce zero, one, or several insights after pruning.

### 4. Bugs need evidence, reproducibility, and transparent closure reasons

Issue-report research emphasizes that issue reports are valuable project-evolution knowledge, but their quality varies when reporters do not provide structured information. GitHub issue-template research found that templates exist to collect relevant information and improve issue quality, but adoption is still limited in the wild [9].

For bugs, the triage output should therefore not be "interesting idea"; it should be a reproducible report with environment, steps, expected result, actual result, severity, and next action. If not reproducible, the issue should stay open with the missing evidence stated.

Recent WONTFIX research found that `wontfix` is common enough to be an important resource-management tool, but can reduce transparency if the reason is unclear [10]. Jazz Master's current rule that `wontfix` requires a written reason is consistent with this evidence.

### 5. UX/research synthesis benefits from structure and, when possible, independent review

UX data-analysis research found that practitioners often face time pressure, use structured formats and severity ratings, and collaborate to find more problems, generate redesign suggestions, and improve reliability. It also found common challenges around limited resources, disagreements, and merging multiple analyses [7].

For a solo-owner plus AI-agent project, this suggests two lightweight practices:

- Use a structured pruning checklist so agents do not rely on vibes.
- For high-impact synthesis, run a short independent review of proposed triage outcomes before committing process or task changes.

This does not mean every small insight needs a second agent. It does mean research recommendations, process changes, major epics, and severity decisions that change priority should be easy to audit.

### 6. AI can help prune, but it should propose merges/splits/rejections with traceable reasons

A 2025 empirical study of GenAI-assisted backlog grooming found that an AI assistant could detect duplicates and propose merges, deletions, or new issues while reducing time spent, but the study framed this around maintaining transparency and accuracy [8].

For Jazz Master, AI agents should be allowed to propose merges, splits, rejections, and task creation, but the durable files must hold the rationale. This is especially important because the repo is the tracker; there is no external project-management system preserving discussion.

### 7. Meeting notes are raw source material, not the same thing as insights

Atlassian's meeting-minutes guidance describes meeting notes as a record of topics, decisions, and action items; useful notes include date, attendees, agenda, discussion summaries, decisions, and action items with owners/deadlines [5]. This is broader than Jazz Master's `work/insights/` template, which is deliberately a cheap raw idea inbox with lifecycle status.

Therefore, a whole meeting note should not be filed as a single `INS-*` unless the meeting produced exactly one product idea and the raw context is disposable. A meeting can produce several different outputs:

- Actionable product idea or opportunity -> `work/insights/INS-###`
- Reproducible defect -> `work/issues/ISSUE-###`
- Agreed implementation unit -> `work/tasks/TASK-###`
- Architecture decision -> `architecture/decisions/ADR-###`
- Notable engineering event -> `architecture/LOG.md`
- Raw record of discussion, decisions, and unresolved questions -> a separate notes/source document type

Because `work/` is defined as lifecycle-managed flow items, raw meeting notes do not fit cleanly under `work/` unless they gain a lifecycle. A separate `notes/` or `sources/notes/` area would better preserve raw context while keeping `work/insights/` actionable.

### 8. Research files need feed-forward checks and stale checks

Jazz Master's existing deep-research process already says completed research must feed recommendations into concrete changes and link the `RES-*` id from consuming tasks. Recent LLM-wiki research reinforces the risk of compiling raw material into summaries that drop important facts; WiCER frames this as a compilation gap and uses diagnostic checks to catch omitted facts [12].

For this repo, a knowledge-pruning process should not rewrite research into a new summary as the canonical truth. It should instead:

- Check whether every completed `RES-*` has a consuming task, ADR, process update, or explicit "no action" outcome.
- Preserve links from tasks/processes back to the `RES-*`.
- Mark stale research by `stale_when`, not by deleting or replacing it.
- File missing feed-forward work as tasks or insights.

### 9. Architecture decisions are a separate durable artifact

ADR guidance defines an ADR as a document that captures an important architecture decision with its context and consequences. It also describes a decision log as the collection of ADRs for a project and suggests keeping decision records in git when that fits the workflow [11].

This means notes and triage should not bury architectural decisions in task logs or insights. If a pruning pass discovers that a note, research file, or implementation discussion actually settled a system-shaping choice, the output should be an ADR or an ADR task, not only an insight.

## Recommendations

### Adopt a `processes/knowledge-pruning.md` process

Add a new process rather than overloading `processes/triage.md`. Keep `triage.md` focused on `work/insights/` and `work/issues/`; make knowledge pruning the wider sweep across:

- Recent `work/insights/`
- Recent `work/issues/`
- Completed `research/RES-*`
- Recent raw notes, if/when a notes area exists
- `architecture/LOG.md` and ADR drift when relevant

The output should be one pruning batch: updated statuses, created tasks, created issues/insights, proposed ADR/process updates, and a short summary of priority changes.

### Use a clear source-to-output routing table

The process should classify each source fragment before deciding work:

| Source fragment | Output |
|---|---|
| Product idea, opportunity, friction, user need | `INS-###` or accept/reject/defer existing insight |
| Reproducible product defect | `ISSUE-###` |
| One-session implementation unit | `TASK-###` |
| Pillar-sized area | propose or create `EPIC-###` only when authorized |
| System-shaping technical choice | `ADR-###` or ADR task |
| Research recommendation not yet acted on | task, process edit, ADR, or explicit no-action note |
| Meeting discussion context | raw note document, with extracted work items linked |
| Duplicate/stale/no-longer-relevant item | merge/reject/wontfix/defer with reason |

### Add raw notes as a new document type if meetings will be preserved

Meeting notes should not generally live in `work/insights/`. Recommended addition:

```text
notes/
  NOTE-###-<slug>.md
```

Suggested template:

```markdown
---
id: NOTE-0XX
title: <meeting/topic>
created: YYYY-MM-DD
source_type: meeting | call | observation | chat | owner-note
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

`processed: false -> true` gives notes a small lifecycle without turning them into implementation work. If the owner does not want a new top-level directory, `work/notes/` is possible, but it weakens the current rule that `work/` items are flow items with terminal statuses.

### Keep the actionable queue small

During pruning, do not create tasks for every accepted idea. First decide whether the idea is:

- Now: create/schedule a task.
- Later but credible: accept the insight and create either a deferred task or an epic note only if it meaningfully helps future work.
- Not now: defer with a specific trigger.
- Not worth carrying: reject with the reason.

This applies Shape Up's warning against backlog weight while preserving Jazz Master's searchable file history.

### Require pruning decisions to state evidence and next action

Every pruned item should end with one of these outcomes:

- Created `TASK-###`
- Linked to existing `TASK-###` / `EPIC-###` / `ISSUE-###` / `ADR-###`
- Rejected/wontfix with reason
- Deferred with trigger
- No action because already covered, with link
- Needs owner decision, with the exact decision requested

For bugs, preserve the current stricter rule: reproduce first, then set severity. If not reproducible, record what evidence is missing.

### Run pruning on cadence and at natural trigger points

Recommended triggers:

- After every QA/product review.
- After any directly requested research file is completed.
- After a meeting note is added.
- When the dev loop finds no actionable work.
- Periodically, e.g. weekly while the project is active, if inboxes are accumulating.

### Add a feed-forward audit for research

For each completed `RES-*`, check:

- Is it linked from a consuming task, process update, ADR, or explicit no-action note?
- Are its recommendations either implemented, filed, rejected, or deferred?
- Has `stale_when` been tripped?
- Do created tasks include `research: RES-###` where appropriate?

This should catch the current class of problem where owner-requested research exists but is not yet connected to work planning.

### Consider a lightweight independent review for high-impact pruning

For ordinary inbox cleanup, a single agent can prune. For pruning that creates epics, rejects major product directions, changes process docs, or updates architecture, run a short independent review before shipping the batch.

## Considered and rejected alternatives

### Put meeting notes directly in `work/insights/`

Rejected. An insight is a lifecycle item that should become accepted, rejected, or deferred. A meeting note is raw evidence and may contain many decisions, issues, action items, and context fragments. Conflating them would make insights noisy and harder to triage.

### Put raw notes in `research/`

Rejected. `research/` is for completed deep-research deliverables with questions, findings, recommendations, and sources. Meeting notes are sources that might feed research, but they are not research results.

### Add a full wiki system now

Rejected for current scale. Existing folders already cover durable knowledge and work tracking. The next improvement should be a pruning process and optional notes/source document type, not a parallel wiki.

### Delete stale insights and old rejected ideas

Rejected. The repo's convention is never to delete work files. Terminal statuses plus reasons preserve searchability and prevent re-litigating old decisions.

## Sources

[1] Schwaber, Ken and Sutherland, Jeff. "The 2020 Scrum Guide." ScrumGuides.org. https://scrumguides.org/scrum-guide.html (November 2020; accessed 2026-07-05).

[2] Rehkopf, Max. "Backlog refinement guide." Atlassian Agile Coach. https://www.atlassian.com/agile/scrum/backlog-refinement (accessed 2026-07-05).

[3] Singer, Ryan. "Principles of Shaping." Shape Up, 37signals/Basecamp. https://basecamp.com/shapeup/1.1-chapter-02 (copyright page 1999-2025; accessed 2026-07-05).

[4] Singer, Ryan. "Bets, Not Backlogs." Shape Up, 37signals/Basecamp. https://basecamp.com/shapeup/2.1-chapter-07 (copyright page 1999-2025; accessed 2026-07-05).

[5] Atlassian. "Meeting minutes template for teams." Confluence templates. https://www.atlassian.com/software/confluence/templates/meeting-notes (copyright page 2026; accessed 2026-07-05).

[6] Li, Ze Shi; Arony, Nowshin Nawar; Devathasan, Kezia; Sihag, Manish; Ernst, Neil; Damian, Daniela. "Unveiling the Life Cycle of User Feedback: Best Practices from Software Practitioners." arXiv:2309.07345. https://arxiv.org/abs/2309.07345 (submitted 2023-09-13; accessed 2026-07-05).

[7] Kuang, Emily; Jin, Xiaofu; Fan, Mingming. "\"Merging Results Is No Easy Task\": An International Survey Study of Collaborative Data Analysis Practices Among UX Practitioners." CHI 2022 / arXiv:2204.02823. https://arxiv.org/abs/2204.02823 (submitted 2022-04-06; accessed 2026-07-05).

[8] Oftebro, Kasper Lien; Nguyen-Duc, Anh; Kemell, Kai-Kristian. "GenAI-Enabled Backlog Grooming in Agile Software Projects: An Empirical Study." arXiv:2507.10753. https://arxiv.org/abs/2507.10753 (submitted 2025-07-14; accessed 2026-07-05).

[9] Nikeghbal, Nafiseh; Kargaran, Amir Hossein; Heydarnoori, Abbas; Schutze, Hinrich. "GIRT-Data: Sampling GitHub Issue Report Templates." MSR 2023 / arXiv:2303.09236. https://arxiv.org/abs/2303.09236 (submitted 2023-03-16, revised 2023-03-21; accessed 2026-07-05).

[10] Curtis, J. Alexander; Kasiviswanathan, Sharadha; Eisty, Nasir. "Deciphering WONTFIX: A Mixed-Method Study on Why GitHub Issues Get Rejected." arXiv:2510.01514. https://arxiv.org/abs/2510.01514 (submitted 2025-10-01; accessed 2026-07-05).

[11] Architecture Decision Record project. "Architecture decision record (ADR)." GitHub. https://github.com/architecture-decision-record/architecture-decision-record (accessed 2026-07-05).

[12] Huerta, Juan M. "WiCER: Wiki-memory Compile, Evaluate, Refine Iterative Knowledge Compilation for LLM Wiki Systems." arXiv:2605.07068. https://arxiv.org/abs/2605.07068 (submitted 2026-05-08; accessed 2026-07-05).
