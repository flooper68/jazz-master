---
apss_version: "0.1"
id: jazz-master.product-learning
name: Product learning
status: proposed
parent: jazz-master

problem: Raw feedback, observations, QA findings, and ideas do not automatically become validated understanding of guitarist needs or evidence about product outcomes.
vision: Jazz Master preserves product evidence, distinguishes signal from assumption, and turns it into traceable learning that changes direction and work.
goals:
  - Route every product observation without losing raw context.
  - Validate important product problems and outcomes before broad investment.
strategy: Capture cheaply in notes/issues/insights, triage deliberately, use owner grills and focused trials, and feed validated learning to direction and portfolio coordination.

roles:
  owner: [product owner]
  operators: [AI product agents, product owner, QA agents]
  consumers: [jazz-master.direction, jazz-master.portfolio, jazz-master]
  validators: [product owner, target guitarists when recruited]
  adaptation_approvers: [product owner]

inputs:
  - Owner feedback, guitarist discussions, product use, QA reports, issues, analytics when available, and delivery outcomes.

artifact:
  primary: A validated, traceable product-learning conclusion with a routed decision or work outcome.
  medium: informational
  supporting:
    - Raw notes, insights, issues, problem briefs, and review reports.
  consumers: [jazz-master.direction, jazz-master.portfolio, jazz-master]
  intended_outcome: Product direction and work change in response to real guitarist problems and observed product effects rather than unlabelled assumptions.

planning:
  process: processes/triage.md
  plan: work/tasks/
  log: work/tasks/
  record_model: Product-learning tasks contain the durable plan and execution Log; notes, insights, issues, and heartbeat are evidence/artifacts rather than the work log.

execution:
  process: processes/feedback-intake.md
  invocation: New feedback, observation, QA finding, issue, usage evidence, or a heartbeat inbox sweep.

validation:
  artifact: Check provenance, problem framing, evidence strength, duplicates, routing reason, and owner confirmation for judgment-carrying promotions.
  outcome: Observe whether accepted learning changes direction/work and later improves target-guitarist behavior; only owner dogfooding and episodic QA evidence exist today.

streams:
  - id: raw-product-evidence
    purpose: Preserve observations before interpretation and enable later re-reading.
    source: notes/, work/reviews/, work/issues/, owner feedback, and future user/usage sources.
    access: Retain repository-native sources or durable summaries with provenance.
    consumed_by: processes/feedback-intake.md
    grill: processes/grilling.md
  - id: disposition-and-outcomes
    purpose: Learn which insights were acted on and whether the resulting product change helped.
    source: work/insights/, work/tasks/, strategy/, product behavior, and follow-up feedback.
    access: Follow source/outcome links and git history; retain later observations as new raw evidence.
    consumed_by: processes/triage.md
    grill: processes/grilling.md

uncertainty:
  discussion: Use processes/grilling.md for owner feedback, decision provenance, and contextual guitarist interviews one question at a time when appropriate.
  research: Invoke jazz-master.research when the product question depends on existing external knowledge.
  experimentation: Run dogfooding, prototypes, usability sessions, repeated target-guitarist trials, or instrumented comparisons proportionate to the decision.

learning:
  compilation_process: processes/triage.md
  compiled_knowledge: wiki/product/overview.md
  changelog: wiki/log.md
  adaptation_process: processes/product-practices.md
  implementation_state: partial

authority:
  execution: Agents may capture and route evidence; the owner confirms judgment-carrying promotions and product conclusions.
  adaptation: human-approved

health:
  - Raw context remains recoverable and linked to dispositions.
  - New/open inboxes are bounded and periodically triaged.
  - Evidence strength and single-user limitations remain explicit.

relations:
  feeds: [jazz-master.direction, jazz-master.portfolio, jazz-master.quality, jazz-master]
  verifies: [jazz-master.direction, jazz-master.delivery, jazz-master]
  verified_by: [jazz-master.governance]
  invokes: [jazz-master.research]
  depends_on: [jazz-master.delivery, jazz-master.quality]
  scheduled_by: [jazz-master.portfolio]
  governed_by: [jazz-master.governance]
  improves: [jazz-master.direction, jazz-master]
---

# Product learning

## Boundary

Product learning owns interpretation of product evidence and its routed
conclusion. It does not own raw product delivery, quality's correctness verdict,
or the owner's direction decision. It qualifies as a system because evidence
capture, validation with consumers, compilation, and adaptation of future
discovery form a recurring loop with a distinct artifact.

## Complete loop

Evidence is captured without premature commitment, routed into the right work
type, framed and deduplicated in triage, and escalated for owner judgment or
further research/experimentation. A validated conclusion feeds direction and
portfolio. Later delivery and user effects should be linked back to the
original conclusion and improve future product-learning methods.

## Artifact contract

The primary artifact is the validated conclusion and disposition, not the raw
note or task. Correctness means provenance and evidence support the conclusion.
Effectiveness means acting on it improves product decisions and guitarist
outcomes; creating many insights is not success.

## Learning and adaptation

The current loop preserves sources and dispositions and compiles broad product
state into the wiki. It does not routinely follow accepted insights through
delivery to outcome, compare predictions with evidence, or adapt discovery
methods from misses.

## Relationships

Quality contributes QA/field findings; delivery supplies changed product
behavior; product learning validates both root outcomes and direction bets. It
feeds direction and portfolio but does not approve their decisions.

## Open design gaps

- **JM-GAP-12 — external product validation is missing.** Current evidence is
  dominated by owner dogfooding and agent QA; repeated target-guitarist evidence
  does not exist.
- **JM-GAP-13 — learning-to-outcome trace is incomplete.** Source/outcome links
  stop largely at task creation or completion rather than later use and
  practice outcomes.
- **JM-GAP-14 — product-learning method adaptation is informal.** Missed or
  disproven assumptions do not trigger a compiled change to interview,
  dogfood, instrumentation, or experiment protocols.
- **JM-GAP-21 — planning records are not capsule-local.** Product learning uses
  the shared task registry until TASK-079 creates its accepted PLAN/LOG
  contract.

## Open questions (deferred grill)

1. Before broad feature expansion, what target-guitarist evidence threshold
   should be mandatory: number of people, repeated sessions, observed behavior,
   self-report, or a combination?
2. At what post-delivery checkpoint must an accepted insight be re-evaluated
   against actual use and practice outcomes?
3. Which failed or disproven assumption pattern should force adaptation of the
   interview, dogfood, instrumentation, or experiment protocol?
4. Should shared plans/logs remain a supported long-term model, or must product
   learning adopt capsule-local PLAN/LOG records before activation?
