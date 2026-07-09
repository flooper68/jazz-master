---
apss_version: "0.1"
id: <stable-unique-id>
name: <human-readable-name>
status: proposed # proposed | active | paused | retired
parent: null # stable system id; null only for a root system

problem: <condition this system exists to change>
vision: <durable description of what better looks like>
goals:
  - <current bounded result>
strategy: <current theory and approach for reaching the goals>

roles:
  owner: [<person-role-or-agent>]
  operators: [<person-role-or-agent>]
  consumers: [<artifact-consumer>]
  validators: [<artifact-or-outcome-validator>]
  adaptation_approvers: [<person-role-or-agent>]

inputs:
  - <input, constraint, or upstream artifact>

artifact:
  primary: <inspectable output produced by the system>
  medium: <digital | informational | decisional | formal | physical | state-change | custom>
  supporting: []
  consumers: [<consumer system, person, or environment>]
  intended_outcome: <change the artifact should cause>

planning:
  process: <path or concise implementation description>
  plan: work/PLAN.md
  log: work/LOG.md

execution:
  process: <path or concise implementation description>
  invocation: <event, schedule, continuous condition, on-demand call, or other trigger>

validation:
  artifact: <how correctness/acceptance of the output is checked>
  outcome: <how real-world effectiveness for the consumer is checked>

streams:
  - id: <stream-id>
    purpose: <why the system reads this stream>
    source: <native source or location>
    access: <how the evidence is captured or retrieved>
    consumed_by: <process or responsibility>
    grill: null # optional source-specific discussion/elicitation protocol

uncertainty:
  discussion: <how the system elicits knowledge or judgment>
  research: <how the system compiles existing external evidence>
  experimentation: <how the system generates new evidence>

learning:
  compilation_process: <path or concise implementation description>
  compiled_knowledge: knowledge/README.md
  changelog: knowledge/CHANGELOG.md
  adaptation_process: <path or concise implementation description>

authority:
  execution: <declared execution authority>
  adaptation: human-approved # or a precisely bounded autonomous policy

health: null # optional for open-ended systems; otherwise declare viability conditions/checks

relations:
  feeds: []
  verifies: []
  verified_by: []
  invokes: []
  depends_on: []
  scheduled_by: []
  governed_by: []
  improves: []
---

# <System name>

## Boundary

Explain why this is an independent adaptive system rather than a process or
capability inside its parent. State what is inside and outside its control.

## Complete loop

Describe how the system plans, resolves uncertainty, executes, produces its
artifact, validates artifact and outcome, captures evidence, compiles knowledge,
adapts, and invokes the next run. Responsibilities may be reordered, combined,
parallelized, or asynchronous.

## Artifact contract

Clarify the primary artifact, supporting artifacts, handoff to consumers, and
the distinction between acceptance and outcome effectiveness.

## Learning and adaptation

Explain how evidence becomes compiled knowledge, what may change, who approves
change, and how the system knows the next run uses the learning.

## Relationships

Explain cross-system relationships that are not obvious from their typed IDs.

## Open design gaps

Record missing implementations honestly. A declared but unimplemented loop is
a proposed system, not an active one.
