---
apss_version: "0.1"
id: jazz-master.direction
name: Product direction
status: proposed
parent: jazz-master

problem: Product effort can be coherent and well executed while pursuing the wrong guitarist problem, outcome, or strategic bet.
vision: Jazz Master has explicit, evidence-aware direction that keeps each goal and product choice tied to the zero-tension practice promise.
goals:
  - Preserve an explicit current product vision and goals.
  - Convert validated product evidence into owner-approved direction changes.
strategy: Keep strategy owner-controlled, use product-practice standards to frame choices, and feed accepted direction to portfolio coordination.

roles:
  owner: [product owner]
  operators: [product owner, AI product agents]
  consumers: [jazz-master.portfolio, jazz-master]
  validators: [product owner, jazz-master.product-learning]
  adaptation_approvers: [product owner]

inputs:
  - strategy/VIS-001-jazz-master.md
  - Product-learning evidence, research findings, constraints, and current product state.

artifact:
  primary: An owner-approved product direction packet comprising vision, current goals, and product decision rationale.
  medium: decisional
  supporting:
    - Product-facing problem briefs and goal-linked epic proposals.
  consumers: [jazz-master.portfolio, jazz-master]
  intended_outcome: The portfolio spends effort on the highest-value validated steps toward better jazz practice.

planning:
  process: processes/product-practices.md
  plan: strategy/goals.md
  log: work/tasks/
  record_model: The owner-controlled goals file is the durable direction plan; relevant shared work items contain append-only execution Logs in work/tasks/ until system-local records exist.

execution:
  process: processes/product-practices.md
  invocation: A strategy question, validated product learning, owner feedback, goal review, or a proposal that changes product direction.

validation:
  artifact: The owner checks coherence with VIS-001, explicit problem/outcome framing, trade-offs, evidence strength, and feasibility constraints.
  outcome: Portfolio and product-learning evidence should show that selected goals improve practice behavior; this is not yet reviewed on a defined cadence or threshold.

streams:
  - id: validated-product-learning
    purpose: Supply evidence about practice needs, friction, and outcomes.
    source: jazz-master.product-learning artifacts, notes/, work/reviews/, and work/issues/.
    access: Read retained evidence and linked product-learning conclusions.
    consumed_by: processes/product-practices.md
    grill: processes/grilling.md
  - id: feasibility-and-context
    purpose: Bound direction by architecture, research, delivery cost, and current capabilities.
    source: architecture/, research/, work/epics/, and delivery evidence.
    access: Read canonical repository sources and linked git history.
    consumed_by: processes/product-practices.md
    grill: processes/grilling.md

uncertainty:
  discussion: Use processes/grilling.md for one-at-a-time owner decisions and targeted guitarist discussions.
  research: Invoke jazz-master.research for market, learning-science, domain, or technical uncertainty.
  experimentation: Ask jazz-master.delivery and jazz-master.product-learning to run prototypes, dogfooding, or target-user trials before committing broad direction.

learning:
  compilation_process: processes/product-practices.md
  compiled_knowledge: wiki/product/overview.md
  changelog: wiki/log.md
  adaptation_process: processes/grilling.md
  implementation_state: partial

authority:
  execution: Agents may analyze evidence and draft proposals; only the owner may edit strategy or accept direction.
  adaptation: human-approved

health: Direction remains explicit, current, evidence-labelled, and within the owner's strategy authority.

relations:
  feeds: [jazz-master.portfolio, jazz-master]
  verifies: []
  verified_by: [jazz-master.product-learning]
  invokes: [jazz-master.research, jazz-master.product-learning]
  depends_on: [jazz-master.product-learning]
  scheduled_by: [jazz-master.portfolio]
  governed_by: [jazz-master.governance]
  improves: [jazz-master]
---

# Product direction

## Boundary

This system owns what product problem and outcome to pursue, not execution
sequencing or implementation. It is independent because its decisional artifact
has a distinct owner, consumers, validation criteria, and adaptation authority.
`processes/product-practices.md` is its principal process; it does not become a
system itself.

## Complete loop

Direction reads the current strategy, validated product learning, research,
constraints, and prior outcomes. It frames a decision, resolves uncertainty,
obtains owner judgment, validates coherence and evidence, records the accepted
direction, and feeds it to portfolio coordination. Later product outcomes should
test the decision and trigger adaptation.

## Artifact contract

The artifact is an accepted direction, not a backlog or shipped feature. Its
correctness is coherent, explicit reasoning under owner authority. Its outcome
is better allocation toward guitarist value; shipping the selected work alone
does not prove that outcome.

## Learning and adaptation

Product knowledge is partly compiled in `wiki/product/overview.md`, but the
current process does not explicitly compare prior product bets with later
outcomes. Proposed compilation would add that comparison before the owner
changes goals or product strategy.

## Relationships

Product learning validates and feeds direction; research resolves selected
questions; direction feeds portfolio coordination. Governance constrains how
decisions and owner authority are recorded.

## Open design gaps

- **JM-GAP-04 — direction learning is not closed.** There is no durable ledger
  connecting an accepted product bet to later outcome evidence and a keep,
  change, or stop decision.
- **JM-GAP-05 — direction versus coordination ownership is provisional.** The
  proposal gives direction the value choice and portfolio coordination the
  sequencing choice, but current prioritization blends both.
- **JM-GAP-21 — planning records are not capsule-local.** Direction uses the
  shared strategy goal plan and shared task logs until TASK-079 creates its
  accepted PLAN/LOG contract.

## Open questions (deferred grill)

1. Does the owner accept the boundary “direction chooses value; portfolio
   coordination sequences accepted work,” including escalation when they
   disagree?
2. What evidence and review cadence should reconnect an accepted product bet to
   a keep, change, or stop decision?
3. Should shared plans/logs remain a supported long-term model, or must
   direction adopt capsule-local PLAN/LOG records before activation?
