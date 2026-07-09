---
id: ADR-013
title: Define Adaptive Problem-Solving Systems as a portable framework before migration
status: accepted
date: 2026-07-09
---

# ADR-013 — Define APSS before migrating Jazz Master's operating model

## Context

Jazz Master already has delivery, product, QA, research, grill, heartbeat, and
knowledge-maintenance loops/capabilities (ADR-003/004/007/008), but some
feedback loops are incomplete and their boundaries and learning
responsibilities are implicit across top-level document layers. The owner wants
a general framework that makes each problem-solving system's
problem, artifact, consumer outcome, full feedback loop, evidence, compiled
knowledge, validation, ownership, and adaptation explicit—and can later be
tested on problems outside software.

The NOTE-015 grill established the framework through one-question-at-a-time
decisions. Moving existing processes and wiki pages immediately would make the
entire repository depend on an unreviewed first draft.

## Decision

- Define **Adaptive Problem-Solving Systems (APSS)** as a reusable,
  domain-independent framework under `framework/apss/`.
- APSS standardizes system responsibilities and declarations, not the mechanics
  of their strategy. Every declared system owns a full adaptive loop: durable
  planning/work logging, execution and artifact production, separate artifact
  and outcome validation, raw evidence streams, knowledge compilation,
  human-approved adaptation by default, and continuation/termination.
- Every system names an inspectable primary artifact. Artifacts may be digital,
  informational, decisional, formal, physical, or recorded state changes.
- Every subsystem has one stable ID and one primary parent for lifecycle
  ownership. Cross-system participation uses typed relationships rather than
  multiple parents. Concrete system-owned material will be colocated in nested
  system capsules when Jazz Master migrates.
- Discussion/grilling, research, and experimentation are general
  uncertainty-resolution capabilities with system-specific protocols.
  Experimentation includes physical/user prototypes, simulations, benchmarks,
  feasibility work, and formal proof/theorem proving.
- Every system implements its own compilation process and owns its learning.
  Git may supply detailed provenance; compiled knowledge keeps a simple
  changelog. Exact triggers, storage, budgets, and incremental/full compilation
  strategy remain local decisions.
- Open-ended systems may declare health/homeostasis conditions; they are not
  mandatory for bounded systems.
- `SYSTEM.md` combines a machine-readable core YAML contract with explanatory
  Markdown and permits extensions. System maps should be derived from those
  declarations where practical.
- APSS is a framework specification for now, not an adaptive system instance.
  Its own recursive adaptation may be designed later.
- Do not migrate Jazz Master's current structure in this decision's commit.
  First review and ship the portable definition, then map and migrate the
  concrete project through separate work.

## Consequences

- The repository gains a portable framework package without invalidating the
  current canonical paths or dev loop.
- The next migration can assess current loops against an explicit contract
  instead of reorganizing files by intuition.
- APSS is intentionally broad and initially grounded in owner reasoning rather
  than external literature. The framework-local research item
  `work/research-foundations.md` records that validation gap.
- Colocation and recursive hierarchy will eventually require a substantial
  amendment to the current layer-oriented knowledge map (ADR-003/004/007), but
  that change is deferred until the concrete system design is reviewed.
- Declaring a subsystem carries real cost: it must own a complete adaptive loop.
  Smaller behaviors remain processes or capabilities.

## Related

- NOTE-015 — owner grill and full decision provenance.
- TASK-076 — portable framework definition.
- ADR-003 — current file-based knowledge system.
- ADR-004 — current closed-loop product process.
- ADR-007 — current derived wiki layer.
- ADR-008 — current grill loop.
