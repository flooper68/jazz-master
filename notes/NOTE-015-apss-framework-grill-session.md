---
id: NOTE-015
title: Adaptive Problem-Solving Systems framework grill session
created: 2026-07-09
source_type: grill-session
participants: [owner, agent]
processed: true
---

# NOTE-015 — Adaptive Problem-Solving Systems framework grill session

## Context

The session began with a proposed improvement to the development loop: record
problems encountered and successful resolutions, compile them into reusable
knowledge, and feed that knowledge back into the loop. The discussion widened
into a general framework for hierarchical, adaptive problem-solving systems.

The owner explicitly requested a one-question-at-a-time grill before any
implementation. A long agenda was useful internally but felt like a batch of
questions without enough context; subsequent questions were asked individually.

## Decisions

### Scope and name

- The framework is domain-independent, intended for software, companies,
  research, mathematics, physical production, and systems that improve other
  problem-solving systems.
- Its name is **Adaptive Problem-Solving Systems (APSS)**.
- APSS itself is a framework specification for now, not an adaptive-system
  instance. Recursive self-improvement of the framework may be added later.
- The portable definition lives initially under `framework/apss/`; the owner may
  move it to another repository later.

### What qualifies as a system

- A declared system owns a distinct problem, boundary, roles, strategy,
  planning, execution loop, primary artifact, consumer/outcome, validation,
  evidence streams, compiled knowledge, and adaptation loop.
- Every declared subsystem is adaptive and owns its learning. Smaller reusable
  behavior that cannot justify its own full loop is a process or capability,
  not a subsystem.
- Every system has one stable unique ID/name independent of its filesystem path.
- Every subsystem has exactly one primary parent responsible for lifecycle
  ownership. Cross-cutting participation uses typed relationships such as
  `feeds`, `verifies`, `invokes`, and `scheduled_by` rather than multiple
  parents.
- Child systems are physically nested under their owning parent. System-owned
  definitions, processes, validation, work, streams, and compiled knowledge are
  colocated in the system capsule; shared evidence may remain in an external or
  shared source and be referenced.

### Artifact and outcome

- Every system names a primary artifact. An artifact may be software, a plan,
  decision, wiki, report, proof, recorded state transition, physical object, or
  another inspectable output.
- Artifact correctness and real-world outcome effectiveness are distinct,
  mandatory validation dimensions whose exact methods depend on the problem.
  A CNC part can match its CAD tolerances yet fail in use; both questions must
  be answered separately.

### Full adaptive loop

- Every system implements a complete execution and feedback loop. The loop must
  cover planning, execution/artifact production, artifact validation, outcome
  validation, evidence capture, knowledge compilation, adaptation, and the next
  invocation.
- The framework requires these responsibilities but does not prescribe their
  sequence. Systems may combine, reorder, parallelize, schedule, or continuously
  run them according to their strategy.
- Strategy includes how the loop currently works and may itself evolve. A
  system may create or retire subsystems as it learns.
- Planning is mandatory. Every system keeps a durable plan and work log so work
  is resumable and auditable. APSS recommends general work types but does not
  force them.

### Evidence, streams, and knowledge

- Raw evidence should remain recoverable so it can be recompiled when the
  strategy, schema, or important questions change. Copying data versus keeping
  an external reference is an implementation decision.
- Meetings, discussions, grills, customer threads, runtime logs, work logs, and
  other heterogeneous sources can all be streams. For a meeting, a durable
  topic summary can be the source record.
- A lightweight stream declaration records its ID, purpose, source/location,
  capture/access method, consumer, and optional source-specific discussion or
  grill protocol. Privacy, retention, and normalization are system-specific,
  not mandatory APSS fields.
- Every system implements its own knowledge-compilation process. That process
  owns its triggers, resource budget, and incremental/full-recompilation
  strategy.
- Git supplies detailed provenance for repository-backed systems. Compiled
  knowledge needs only a simple changelog for catch-up; APSS does not require a
  per-compilation manifest.

### Resolving uncertainty

- All systems can invoke three general evidence routes through shared
  interfaces with system-specific protocols:
  1. discussion/grilling to elicit human or agent knowledge and judgment;
  2. research to compile existing external evidence;
  3. experimentation to generate new evidence.
- Experimentation is broad: prototypes, user tests, simulations, benchmarks,
  feasibility spikes, formal proofs, and theorem proving all qualify when they
  deliberately generate evidence and capture feedback.

### Roles, authority, health, and visualization

- Every system declares owner, operators, artifact consumers, validators, and
  adaptation approvers. A person or agent may hold multiple roles.
- Adaptation authority is system-specific. The initial default is human
  approval by the responsible owner; sufficiently trusted future systems may
  become autonomous within declared boundaries.
- Open-ended or continuously operating systems may declare health/homeostasis
  conditions and adapt to remain viable. This is optional, not universal.
- `SYSTEM.md` uses validated YAML frontmatter for the core machine-readable
  contract and Markdown for explanation; extensions are allowed.
- Hierarchy, artifact-flow, and learning maps should be generated from system
  declarations where practical. Manual diagrams are derived views, never a
  second source of truth.

### Delivery sequence

- First ship the portable APSS definition, template, example, visualization
  rules, and deferred-research work as one reviewed increment.
- Refactor Jazz Master's current layer-based operating system only afterward,
  through separate planned increments using the accepted definition.
- Focused comparison with systems engineering, cybernetics/control theory,
  OODA/PDCA, double-loop learning, the Viable System Model, and evidence-based
  experimentation is deferred as local framework work.

## Unresolved questions

None blocking the initial framework definition. The external-foundations study
and Jazz Master migration are intentionally deferred work.

## Extracted work

- TASK-076 — define and ship the APSS framework.
- [APSS foundations research](https://github.com/flooper68/adaptive-problem-solving-systems/blob/main/work/research-foundations.md)
  — compare APSS with established problem-solving and adaptive-systems literature.
- TASK-077 — map Jazz Master's concrete APSS hierarchy and plan its migration.

Relocation follow-up: TASK-078 moved the framework from its initial local path
to `flooper68/adaptive-problem-solving-systems` as decided in NOTE-016.
