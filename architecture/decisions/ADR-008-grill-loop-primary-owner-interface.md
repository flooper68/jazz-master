---
id: ADR-008
title: Grill loop as the owner's primary working interface
status: accepted
date: 2026-07-06
---

# ADR-008 — Grill loop as the owner's primary working interface

## Context

`research/RES-004` researched a "grill-me" skill and recommended an analysis-only, non-mutating critique pass: agent adversarially reviews an artifact (plan, diff, research recommendation) on demand. Before implementing, the owner asked to be grilled about the design itself; that session is preserved as `notes/NOTE-001`.

The grill surfaced that the motivating problem is not undetected defects but **owner distance**: "I don't have a deep insight into details, I need to be closer to the product." A solo owner reviewing agent output without deep context rubber-stamps; review was the disease, not the cure. That reverses the tool's direction — the agent questions the owner — and promotes it from a checkpoint to the owner's primary interface: grill → agents do the work → owner gives feedback → grilled on the feedback.

## Decision

Adopt the grill loop as defined in `processes/grilling.md` (canonical), with `.claude/skills/grill-me/SKILL.md` as a thin trigger surface pointing at it:

- Agent grills the owner, **one question at a time**, anchored to the live artifact's details (domain / technical / progress by context).
- Agent proposes the session agenda from the state of `work/` and the per-question routing (blocker / answer now / research / record); the owner confirms both.
- Decision-type answers are applied **directly to the artifact under discussion in-session**, diff reviewed by the owner; the full transcript lands in `notes/` (`source_type: grill-session`).
- Creation of judgment-carrying artifacts (epics, product-facing tasks, ADRs, strategy proposals, triage promotions) always routes through a grill — inline when the owner is present, otherwise **deferred**: the autonomous run drafts the artifact and queues its 2–3 load-bearing questions into the owner-confirmation batch. Mechanical items (heartbeat hygiene tasks, trivial issue→task conversions) never grill.
- A ~monthly **exam grill** — owner describes the whole system unaided, agent probes for gaps — is both the success metric and the kill criterion: gaps not shrinking exam over exam means the loop is theater and gets redesigned or retired.

### Supersedes parts of RES-004

- Rec 4 ("analysis-only, non-mutating") — overridden for the artifact under discussion: the original rationale (critique silently becoming implementation) does not apply when the owner is present and reviews every diff. `strategy/` remains agent-read-only regardless; vision-level answers become drafts handed to the owner.
- Rec 1 (location `.agents/skills/`) — the repo runs on Claude Code; the skill lives at `.claude/skills/grill-me/`, and the canonical content lives in `processes/` per the knowledge map (skill stays thin to prevent drift).
- The rejected-options caution against auto-triggering ("auto-triggering on every implementation request: rejected") — kept for the critique use-case it addressed, but implicit triggering on owner feedback and decision-shaped statements is adopted deliberately: for an *interface*, implicit entry is the point. The never-trigger list and stand-down phrase bound it.

### Exception to the notes pipeline

ADR-004's rule that `notes/` content is "processed, never implemented directly" gains one exception, recorded here and in `processes/feedback-intake.md`: decisions made mid-grill are applied to the live artifact in-session. Routing a decision the owner just made through note → triage → task adds latency and retelling loss with no authority gained — the owner is the authority and is present. Everything else discovered in a grill still flows through intake as usual.

## Consequences

- The owner's engagement stops depending on unprompted document-reading; questions pull them into details at decision points, and answers persist as artifact changes plus session notes.
- Triage's owner-confirmation batch changes character: from yes/no proposals to opening grill questions (deferred grill), making confirmation a decision session rather than a rubber-stamp.
- Accepted, unresolved risks: the owner's stated appetite ("hundreds of exchanges a week") is untested against reality, and agent agenda-setting concentrates framing power. Counterweights: the owner reviews all resulting changes/tasks/plans, and the exam grill catches errors of omission. The exam grill's built-in kill criterion is the tripwire if the whole loop turns out to be theater.
- Process wiring updated in the same change: CLAUDE.md process index, `processes/heartbeat.md` (exam-grill cadence flag, deferred-grill questions collected into the beat report), `processes/dev-loop.md` (deferred-grill questions on ADRs written at Record and judgment-carrying items filed at Reflect), `processes/triage.md` (confirmation batch = deferred grill), `processes/feedback-intake.md` and `notes/README.md` (grill-session source type, `exam:` flag, pipeline exception).

## Related decisions

- ADR-003 / ADR-004 — the knowledge system and closed loop this rides on; the notes-pipeline exception above amends ADR-004's intake flow.
- RES-004 — design source; recommendations 1 and 4 plus the auto-triggering caution superseded as described; its skill-quality guidance (focused scope, explicit triggers, evaluate before trusting, Gotchas accumulation) is adopted.
- NOTE-001 — the design session with the full decision arc.
