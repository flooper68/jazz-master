---
apss_version: "0.1"
id: jazz-master.governance
name: Operating governance
status: proposed
parent: jazz-master

problem: A solo owner and autonomous agents need explicit authority, decision provenance, operating rules, and enforcement so speed does not silently transfer control or corrupt the project record.
vision: Every load-bearing choice and operating adaptation has a clear owner, durable rationale, review path, and observable enforcement.
goals:
  - Preserve owner authority over strategy and adaptation.
  - Keep architecture decisions, process rules, and exceptions explicit and reviewable.
strategy: Use AGENTS.md as the canonical index, ADRs for lasting decisions, one-at-a-time grilling for owner judgment, git as provenance, and gates/reviews for enforcement.

roles:
  owner: [product owner]
  operators: [product owner, AI governance agents]
  consumers: [all proposed Jazz Master systems, future agents]
  validators: [product owner, independent review agents]
  adaptation_approvers: [product owner]

inputs:
  - Owner decisions, architecture changes, process failures, authority questions, review findings, and repository state.

artifact:
  primary: An accepted, traceable operating decision or rule with explicit authority and enforcement consequences.
  medium: decisional
  supporting:
    - AGENTS.md, ADRs, process contracts, grill-session notes, and architecture log entries.
  consumers: [all proposed Jazz Master systems, future agents]
  intended_outcome: Agents act consistently within owner-approved boundaries, and the owner remains close enough to understand and adapt the product and project.

planning:
  process: processes/grilling.md
  plan: work/tasks/
  log: work/tasks/
  record_model: Governance tasks contain their durable plan and execution Log; ADRs and architecture/LOG.md are accepted artifacts and notable-event evidence, not substitutes for the work record.

execution:
  process: processes/grilling.md
  invocation: A load-bearing decision, owner feedback, authority ambiguity, process exception, architectural change, or exam-grill cadence.

validation:
  artifact: The owner and independent reviewer check decision provenance, consistency, explicit trade-offs, affected indexes/processes, and enforceable wording.
  outcome: Audit later work for compliance and use exam grills to assess owner comprehension; no systematic governance-effectiveness compilation exists beyond incidents and monthly-grill intent.

streams:
  - id: decisions-and-authority
    purpose: Preserve what was decided, by whom, why, and what it changes.
    source: architecture/decisions/, notes/ grill sessions, AGENTS.md, and process changes.
    access: Retain in git with bidirectional links and append notable events to architecture/LOG.md.
    consumed_by: processes/grilling.md
    grill: processes/grilling.md
  - id: adherence-and-failures
    purpose: Reveal whether rules are understood, followed, useful, or counterproductive.
    source: Task logs, review findings, git incidents, heartbeat, exam grills, and agent/operator feedback.
    access: Read repository evidence and file explicit issues/insights or decision updates.
    consumed_by: processes/knowledge-maintenance.md
    grill: processes/grilling.md

uncertainty:
  discussion: processes/grilling.md is the primary owner interface; ask one contextual question at a time and preserve the answer.
  research: Invoke jazz-master.research for external governance, security, legal, or process evidence when needed.
  experimentation: Pilot bounded process or autonomy changes with explicit success and rollback conditions before broader authority changes.

learning:
  compilation_process: processes/knowledge-maintenance.md
  compiled_knowledge: wiki/project/overview.md
  changelog: architecture/LOG.md
  adaptation_process: processes/grilling.md
  implementation_state: partial

authority:
  execution: Agents may apply accepted rules and draft decisions; only the owner may approve strategy, system boundaries, authority changes, and governance adaptation.
  adaptation: human-approved

health:
  - Strategy remains owner-controlled.
  - Decisions and exceptions have provenance and current index/process updates.
  - Required review, verification, commit, and push gates remain enforceable.
  - Exam-grill gaps shrink rather than becoming ceremony.

relations:
  feeds: [jazz-master, jazz-master.knowledge]
  verifies: [jazz-master.portfolio, jazz-master.delivery, jazz-master.quality, jazz-master.product-learning, jazz-master.research, jazz-master.knowledge]
  verified_by: []
  invokes: [jazz-master.research, jazz-master.knowledge]
  depends_on: []
  scheduled_by: [jazz-master.portfolio]
  governed_by: []
  improves: [jazz-master]
---

# Operating governance

## Boundary

Governance owns authority, accepted operating decisions, rules, and their
enforcement. It does not execute every governed process, own all compiled
knowledge, or choose product value without the owner's direction role. It is an
independent system because its decisional artifact, cross-system consumers,
owner-only adaptation authority, and adherence evidence are distinct.

`processes/grilling.md` remains a capability owned here, not a standalone
system: it elicits and records judgment but does not own the downstream problem
or artifact for every system that invokes it.

## Complete loop

A decision or incident is framed from canonical evidence; uncertainty is
resolved with an owner grill, research, or bounded pilot; the resulting rule or
decision is reviewed, recorded, indexed, and enforced. Later adherence,
exceptions, incidents, and owner-comprehension evidence should be compiled and
used to keep, amend, or retire the rule.

## Artifact contract

The artifact is an accepted operating decision/rule. Correctness means clear
authority, rationale, consistency, and usable enforcement. Effectiveness means
agents behave predictably without distancing the owner or adding empty
ceremony; documentation alone does not establish that.

## Learning and adaptation

ADRs, notes, and logs preserve rich evidence and incidents do change rules.
Knowledge maintenance can detect drift. Governance still lacks a regular
compilation of rule adherence, operator friction, exceptions, and retired
rules, and the exam grill has not yet established a trend.

## Relationships

Governance verifies operating adherence across every child, feeds constraints
to the root, and invokes knowledge/research as needed. It does not become a
second parent; each child still belongs only to `jazz-master`.

## Open design gaps

- **JM-GAP-15 — governance learning is incident-driven.** There is no compiled
  rule-effectiveness review covering adherence, exceptions, cost, and
  retirement.
- **JM-GAP-16 — owner-comprehension validation is unproven.** The exam-grill
  cadence and kill criterion exist, but no completed sequence demonstrates
  shrinking gaps.
- **JM-GAP-17 — governance versus knowledge boundary is provisional.** This
  proposal gives governance canonical decisions/rules and knowledge derived
  synthesis, while both currently use knowledge maintenance.
- **JM-GAP-21 — planning records are not capsule-local.** Governance uses the
  shared task registry until TASK-079 creates its accepted PLAN/LOG contract.

## Open questions (deferred grill)

1. Does the owner accept governance as an independent root child, or is its
   decision artifact better owned directly by the root with governance kept as
   a capability?
2. What evidence would justify retiring an operating rule that agents follow
   correctly but that adds more cost than protection?
3. How many exam-grill observations, and what shrinking-gap pattern, are needed
   before owner comprehension counts as validated rather than merely intended?
4. Does the owner accept governance as owner of canonical decisions/rules and
   knowledge stewardship as owner only of derived synthesis when both invoke
   knowledge maintenance?
5. Should shared plans/logs remain a supported long-term model, or must
   governance adopt capsule-local PLAN/LOG records before activation?
