---
apss_version: "0.1"
id: jazz-master.portfolio
name: Portfolio coordination
status: proposed
parent: jazz-master

problem: Valid goals, feedback, risks, and maintenance needs compete for limited owner and agent attention without one resumable operating plan.
vision: Jazz Master always has a small, dependency-correct, evidence-labelled next-work plan and an honest view of system health.
goals:
  - Keep the actionable work queue coherent and dependency-correct.
  - Schedule due quality, security, knowledge, research, and owner-attention work.
strategy: Compile repository state through heartbeat, rank ready work through prioritization, and report status from canonical evidence rather than intuition.

roles:
  owner: [product owner]
  operators: [AI coordination agents]
  consumers: [jazz-master.delivery, product owner, all proposed child systems]
  validators: [product owner, executing agents]
  adaptation_approvers: [product owner]

inputs:
  - strategy/goals.md
  - work/ flow-item state, dependencies, reviews, notes, research, and maintenance cadence evidence.

artifact:
  primary: A prioritized, dependency-correct, resumable portfolio and heartbeat recommendation.
  medium: informational
  supporting:
    - Evidence-backed status report.
    - Scheduled hygiene work and owner-decision queue.
  consumers: [jazz-master.delivery, product owner, all proposed child systems]
  intended_outcome: Available effort starts the right actionable work without losing required maintenance or owner decisions.

planning:
  process: processes/heartbeat.md
  plan: work/HEARTBEAT.md
  log: work/tasks/
  record_model: HEARTBEAT.md is the durable cross-system operating plan and snapshot; relevant shared work items contain append-only execution Logs in work/tasks/ until system-local records exist.

execution:
  process: processes/prioritization.md
  invocation: Owner heartbeat/status request, completion of work, arrival of new evidence, or selection among multiple ready items.

validation:
  artifact: Check frontmatter states, dependency satisfaction, process cadence rules, explicit evidence, and consistency between reports and canonical files.
  outcome: Observe whether selected items complete without avoidable blockage or neglected hygiene; no compiled selection-effectiveness review exists today.

streams:
  - id: work-state
    purpose: Establish current commitments, readiness, dependencies, and recent results.
    source: work/, git history, and architecture/LOG.md.
    access: Query repository frontmatter and history; write the heartbeat snapshot to work/HEARTBEAT.md.
    consumed_by: processes/heartbeat.md
    grill: null
  - id: owner-and-system-demand
    purpose: Capture owner priorities and due requests from child systems.
    source: Owner instruction, deferred grills, cadence triggers, open issues, and system relations.
    access: Retain requests in their canonical work or note files.
    consumed_by: processes/prioritization.md
    grill: processes/grilling.md

uncertainty:
  discussion: Use processes/grilling.md when prioritization requires a value or risk trade-off owned by the owner.
  research: Invoke jazz-master.research only when sequencing depends on evidence not available in the repository.
  experimentation: Use a time-boxed spike or alternate work sequence when dependency or effort uncertainty is load-bearing.

learning:
  compilation_process: processes/heartbeat.md
  compiled_knowledge: work/HEARTBEAT.md
  changelog: architecture/LOG.md
  adaptation_process: processes/prioritization.md
  implementation_state: partial

authority:
  execution: Agents may derive readiness, schedule rule-triggered hygiene, and recommend next work; owner instructions and strategy control value trade-offs.
  adaptation: human-approved

health:
  - Claimed work is unique and dependency-correct.
  - Reports match canonical frontmatter and git state.
  - Due maintenance and deferred owner questions are visible.

relations:
  feeds: [jazz-master.delivery, jazz-master]
  verifies: []
  verified_by: [jazz-master.governance]
  invokes: [jazz-master.direction, jazz-master.delivery, jazz-master.quality, jazz-master.product-learning, jazz-master.research, jazz-master.knowledge]
  depends_on: [jazz-master.direction]
  scheduled_by: []
  governed_by: [jazz-master.governance]
  improves: [jazz-master.delivery]
---

# Portfolio coordination

## Boundary

This system owns selection, sequencing, cadence, and operational visibility. It
does not decide product value (direction), implement work (delivery), or judge
product quality (quality/product learning). A durable plan consumed by every
operator and the observable cost of bad sequencing justify an independent
adaptive loop rather than treating prioritization as an incidental step.

## Complete loop

Heartbeat inventories canonical state and evidence, sweeps inputs, schedules
due hygiene, and invokes prioritization. Status reporting makes the reasoning
inspectable. Execution results, blocks, queue age, and missed cadence should be
compiled into selection lessons and used to adapt ranking or scheduling.

## Artifact contract

The artifact is an actionable portfolio state and recommendation. Correctness
means its facts, dependencies, and rules match the repository. Effectiveness
means operators start valuable work without avoidable blockage or neglected
system health; a syntactically correct report can still sequence poorly.

## Learning and adaptation

`work/HEARTBEAT.md` retains snapshots and the prioritization process can change,
but no systematic retro compares estimates and selections with actual delivery
or product outcomes. That missing compilation remains a gap.

## Relationships

Direction supplies accepted value constraints. Portfolio schedules the other
systems and feeds ready work to delivery. Governance checks process and
authority consistency.

## Open design gaps

- **JM-GAP-06 — coordination learning is incomplete.** Heartbeat has a local
  retro, but the project does not compile selection quality, blocked starts,
  lead time, or repeatedly missed estimates into durable planning knowledge.
- **JM-GAP-05 — direction versus coordination ownership is provisional.**
  `processes/prioritization.md` mixes strategic value and sequencing mechanics.
- **JM-GAP-21 — planning records are not capsule-local.** Portfolio uses the
  shared heartbeat plan and shared task logs. The retired TASK-079 migration
  would have created a capsule-local PLAN/LOG contract, but no replacement is
  currently planned.

## Open questions (deferred grill)

1. Which outcome should decide whether portfolio coordination is improving:
   fewer blocked starts, shorter lead time, better goal progress, or a declared
   combination?
2. Does the owner accept that direction chooses value while portfolio sequences
   accepted work, including escalation when those responsibilities disagree?
3. Should shared plans/logs remain a supported long-term model, or must
   portfolio adopt capsule-local PLAN/LOG records before activation?
