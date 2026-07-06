---
id: NOTE-001
title: Grill loop as primary owner interface — design session
created: 2026-07-06
source_type: chat
participants: [owner, agent]
processed: false
---

# NOTE-001 - Grill loop as primary owner interface — design session

## Context

RES-004 researched a "grill-me" skill (agent adversarially critiques an artifact, analysis-only, non-mutating). The owner asked whether such a thing existed (it doesn't yet), then asked to be grilled about how it should work and where it should be integrated. The session itself was run as a grill: one question at a time, each building on the last answer. This note preserves the arc and the decisions; it supersedes parts of RES-004's recommendations (noted below).

## Discussion

The grill surfaced, in order:

1. **Motivation** — no single concrete past miss; the driving problem is owner distance: "I don't have a deep insight into details, I need to be closer to the product." This reframes the tool: not (only) a defect-finder that critiques artifacts, but a comprehension-and-ownership mechanism where the **agent questions the owner**. Direction reversed from RES-004.
2. **Scope** — owner wants closeness to domain, technical issues, and progress; pressed to pick one, the resolution was **contextual anchoring**: the grill goes into the details of whatever artifact/decision is live (domain for drills, technical for ADRs, progress at heartbeat).
3. **Interaction rule** — one question at a time; a batch of questions gets skimmed, a single question forces a real answer and lets the next build on it. Applies to live sessions; written grill reports may still be structured lists.
4. **Unanswerable questions** — routed per question, contextually: blocker / answer now (agent teaches in place) / spawn research task / skip-and-record. Agent proposes the route, owner confirms.
5. **Scale** — owner intent: "hundreds" of exchanges per week. Arithmetic forced the real claim: this is not a checkpoint inside processes but the **primary way of working**: grill → agents do work → owner gives feedback → grilled on the feedback → repeat.
6. **Agenda** — agent sets it (surveys `work/` state, decides what most needs owner judgment). Owner stays in the loop by reviewing all resulting changes/tasks/plans. Known gap: review only catches what is surfaced; errors of omission need a periodic counter-move (see exam grill).
7. **Persistence** — full session transcript lands in `notes/` as audit trail; decision-type answers are applied **directly to the artifact under discussion in-session**, with the owner reviewing the diff. This consciously overrides RES-004's "analysis-only, non-mutating" rule — the rationale (critique silently becoming implementation) doesn't apply when the owner is present and reviewing. `strategy/` stays agent-read-only: vision-level answers become drafts handed to the owner.
8. **Success/kill criterion** — "I should be able to describe the whole system." Operationalized as a periodic **exam grill** (~monthly): owner describes the system unaided (domain model, architecture, shipped, next); agent probes for gaps; gaps become the next period's grill agenda. If gaps stop shrinking exam over exam, the loop is theater and gets redesigned.

Risks accepted rather than resolved: the "hundreds/week" appetite is untested; agent agenda-setting is a soft handover of direction counterbalanced only by the exam grill.

## Decisions

- Build the grill loop as the owner's primary interface, not a critique checkpoint. Agent grills owner; contextually anchored; one question at a time.
- Agent proposes per-question routing (blocker / answer / research / record); owner confirms.
- Agent sets session agendas from `work/` state; owner reviews resulting changes; periodic exam grill guards against omission.
- Transcripts → `notes/NOTE-###`; decisions applied directly to the live artifact with owner reviewing the diff (supersedes RES-004 rec 4 "non-mutating"); `strategy/` untouched.
- Exam grill ~monthly is both the success metric and the kill criterion.
- No task file for the implementation; owner asked to analyze and plan the changes directly.

## Action items

- Write `processes/grilling.md` (the playbook) and a thin `.claude/skills/grill-me/SKILL.md` trigger pointing at it (process canonical, skill thin — avoid drift).
- ADR recording the decision (supersedes parts of RES-004's recommendation; documents the notes-pipeline exception for in-session write-backs).
- Wire in: CLAUDE.md process index row; heartbeat cadence row for the exam grill; `processes/feedback-intake.md` sources + note template `source_type` gain grill sessions.

## Extracted work

- (pending — will link the process doc, skill, and ADR when implemented)
