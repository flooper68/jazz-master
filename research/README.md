# Research

Persisted results of deep research (`processes/deep-research.md`). Research is a first-class deliverable: files here let future work act on past findings instead of re-searching.

- Files: `RES-###-<slug>.md`, sequential IDs, never deleted.
- A task that includes completed research links its result via `research: RES-###` frontmatter.
- Do not reserve future research IDs in backlog tasks. Pick the next available ID when the research file is created, then update the consuming task.
- Before starting new research, check whether an existing RES file already covers (part of) the topic.
- Completed research must feed forward through a consuming task, process/architecture update, rejected/deferred decision, or `processes/knowledge-maintenance.md` follow-up. See `work/README.md` for the canonical intake-to-action workflow.

## Index

`RES-001` is a known never-created gap from the early parallel-research ID
collision; numbering resumes at `RES-002`.

| ID | Title | Consumed by |
|---|---|---|
| RES-002 | Astro on Cloudflare Workers with SPA app shell, TanStack Router, tRPC, React Query, and Hyperdrive | TASK-020 through TASK-025 |
| RES-003 | Karpathy LLM Wiki pattern for agent-maintained knowledge bases | TASK-032 / ADR-007 |
| RES-004 | Grill-me skill and recent developments in agentic coding | ADR-008 / `processes/grilling.md` |
| RES-005 | Matt Pocock's recent agentic coding workflow patterns | TASK-005 / TASK-007 |
| RES-006 | Knowledge pruning and triage for insights, issues, research, and notes | `processes/knowledge-maintenance.md` / `processes/triage.md` |
| RES-007 | HTML over Markdown for documentation aimed at AI agents | Current decision: Markdown remains canonical; HTML belongs in `artifacts/` |
| RES-008 | Organizational problem identification, measurement, and solving frameworks | TASK-007 / TASK-030 |
| RES-009 | Agent skill for polished HTML/CSS/JS visual artifacts, presentations, and docs | `processes/artifact-creation.md` |
| RES-010 | React 19 + TypeScript + Vite/Bun development best practices | TASK-005 |
| RES-011 | Product practices for solo-owner + AI-agent software work | TASK-007 |
| RES-012 | QA and testing best practices for Jazz Master | TASK-006 |
| RES-013 | Notation + tablature rendering approach for exercise display | TASK-014 / ADR-010 |
| RES-014 | Browser audio recording & pitch-detection feasibility for guitar take scoring | TASK-015 / EPIC-010 |
| RES-015 | Sampled-instrument playback for play-along | TASK-045 / ADR-011 |
| RES-016 | Manual regression testing for agent-run browser passes | `processes/regression-testing.md` |
| RES-017 | Local PostgreSQL, psql, Drizzle ORM, and migrations | TASK-028 / TASK-055 / TASK-056; TASK-025 abandoned |
| RES-018 | Railway declarative service configuration | Direct owner research question; no immediate follow-up |
| RES-019 | Cloudflare options for running deployment database migrations | Direct owner research question; no immediate follow-up |
| RES-020 | App-hosted Clerk sign-in and sign-up pages for Astro | TASK-074 |
| RES-021 | Vertical Casting Hub public auth and landing patterns for Jazz Master | TASK-075 |

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
