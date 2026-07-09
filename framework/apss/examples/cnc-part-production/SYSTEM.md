---
apss_version: "0.1"
id: example.cnc-part-production
name: CNC part production
status: proposed
parent: null

problem: Small production runs need repeatable metal brackets that fit and survive their real assembly load.
vision: Approved CAD revisions become reliable physical parts with short feedback from field use to manufacturing improvement.
goals:
  - Produce the current bracket revision within drawing tolerances.
  - Confirm the bracket fits the target assembly and survives its specified load.
strategy: Use a durable production plan, CNC machining, dimensional inspection, assembly/load trials, and feedback-driven updates to tooling and process parameters.

roles:
  owner: [manufacturing lead]
  operators: [CAM programmer, CNC operator]
  consumers: [assembly team]
  validators: [quality inspector, assembly engineer]
  adaptation_approvers: [manufacturing lead]

inputs:
  - Approved CAD model and drawing revision.
  - Material stock and machine/tool availability.
  - Prior inspection, machine, operator, and assembly evidence.

artifact:
  primary: Machined metal bracket from the approved revision.
  medium: physical
  supporting:
    - Inspection record linked to the produced batch.
  consumers: [assembly team]
  intended_outcome: The bracket installs without rework and carries the specified operating load.

planning:
  process: processes/loop.md
  plan: work/PLAN.md
  log: work/LOG.md

execution:
  process: processes/loop.md
  invocation: On an approved production request or approved process-improvement trial.

validation:
  artifact: Inspect the drawing's critical dimensions, material, finish, and visible defects; reject nonconforming parts.
  outcome: Install a sampled part in the target assembly and run the specified load trial; collect assembly and field feedback for later batches.

streams:
  - id: cad-revisions
    purpose: Supply the authoritative geometry and tolerance contract.
    source: Approved CAD and drawing system.
    access: Reference the released revision in the batch plan.
    consumed_by: processes/loop.md
    grill: null
  - id: machine-and-inspection
    purpose: Preserve production parameters, failures, and dimensional evidence.
    source: CNC run notes and inspection records.
    access: Summarize each batch in work/LOG.md and retain native records by reference.
    consumed_by: processes/loop.md
    grill: null
  - id: assembly-feedback
    purpose: Learn whether conforming parts solve the consumer's actual fit and load problem.
    source: Assembly trials, operator discussions, and field reports.
    access: Retain the report or a topic summary linked from work/LOG.md.
    consumed_by: processes/loop.md
    grill: Ask about fit, rework, installation time, failure mode, load, frequency, and workaround.

uncertainty:
  discussion: Grill the designer, operator, inspector, or assembly engineer on ambiguous requirements and observed failures.
  research: Consult material, tooling, machining, and applicable engineering references when existing evidence is insufficient.
  experimentation: Run simulations, test coupons, trial toolpaths, prototype parts, destructive tests, or formal engineering calculations to generate evidence.

learning:
  compilation_process: processes/loop.md
  compiled_knowledge: knowledge/README.md
  changelog: knowledge/CHANGELOG.md
  adaptation_process: processes/loop.md

authority:
  execution: Operators may execute an approved batch plan within documented machine and safety limits.
  adaptation: The manufacturing lead approves changes to tooling, process parameters, validation, or subsystem structure.

health: null

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

# CNC part production

## Boundary

This example begins with an approved design and ends with a validated physical
part plus learning for the next batch. Product design approval, procurement,
machine maintenance, and the assembly team's wider production planning are
outside the boundary; a real organization could model them as related systems.

It qualifies as an adaptive system because it owns a primary physical artifact,
separate correctness and use outcomes, recurring evidence, compiled process
knowledge, and approved adaptation. A single toolpath calculation would be a
process or experiment inside this system, not another subsystem by default.

## Complete loop

The production request updates the durable plan. Operators review current
knowledge and uncertainty, create or revise the CAM/tooling approach, run the
part, inspect it, and hand a conforming sample to assembly validation. Machine,
inspection, and consumer evidence is logged. The compilation step updates the
manufacturing playbook; approved adaptations change the next plan or process.

Artifact inspection can finish before real-world outcome evidence arrives. The
batch is conforming only when artifact validation passes; the strategy is
supported only when outcome validation shows the conforming part solves fit and
load needs.

## Artifact contract

The bracket is the primary artifact. The inspection record is supporting
evidence, not the consumer outcome. A dimensionally correct bracket that needs
assembly rework or fails the load trial is evidence that the design/strategy or
outcome assumptions need adaptation—not evidence that inspection was useless.

## Learning and adaptation

The system retains source references and the work log, then compiles recurring
causes, successful resolutions, stable parameter windows, and validation
lessons into [knowledge/README.md](knowledge/README.md). The manufacturing lead
approves changes. A later trusted version could automate bounded parameter
adjustments, but this example starts human-approved.

## Relationships

This standalone example uses no parent or cross-system IDs. A concrete instance
would sit under its owning production system and declare design, procurement,
maintenance, safety, and assembly relations.

## Open design gaps

The example deliberately omits organization-specific tolerance values, safety
procedures, retention rules, and machine integrations. A real active system
must supply them in its own strategy and process.
