---
id: TASK-076
title: Define the Adaptive Problem-Solving Systems framework
status: done
depends_on: []
source: NOTE-015
created: 2026-07-09
---

# TASK-076 — Define the Adaptive Problem-Solving Systems framework

## Goal

Create a reusable, domain-independent definition of Adaptive Problem-Solving
Systems (APSS) that can guide a later refactor of Jazz Master's operating model
and be moved into other projects.

## Context

The existing Jazz Master knowledge and delivery loops are strong but organized
by document layer rather than by explicitly declared adaptive systems. The owner
grill in NOTE-015 established the framework's terminology, system contract,
hierarchy, evidence/learning loop, artifact model, validation model, and staged
adoption approach. This task defines the framework only; migration of the
current repository follows in separate increments after this definition is
reviewed.

## Acceptance criteria

- [x] `framework/apss/README.md` defines what APSS is, why it exists, its full
      feedback loop, system boundaries, hierarchy, artifacts, streams,
      uncertainty-resolution routes, validation, learning, adaptation, and
      optional homeostasis.
- [x] A declarative `SYSTEM.md` template defines the required machine-readable
      contract while allowing extensions.
- [x] A domain-independent example demonstrates a physical artifact and the
      distinction between artifact and outcome validation.
- [x] Visualization guidance defines hierarchy, artifact-flow, and learning
      views derived from system declarations.
- [x] The deferred external-foundations research is recorded as local framework
      work.
- [x] ADR-013 and NOTE-015 preserve the decision and grill provenance; project
      indexes/maps acknowledge the framework without claiming Jazz Master has
      already migrated.
- [x] Independent review completed and `bun run --cwd codebase check` passes.

## Verification

1. Read `framework/apss/README.md`, `SYSTEM.template.md`, the example, and
   visualization guide as a new system designer; confirm the template can be
   completed without relying on this task or NOTE-015.
2. Confirm every relative path named by the framework docs exists.
3. Confirm the example covers the complete loop and both mandatory validation
   dimensions.
4. Run `bun run --cwd codebase check`.

## Log

### 2026-07-09 — claimed (agent)

Plan: turn the NOTE-015 decisions into a portable APSS specification, template,
physical-domain example, visualization guide, and local research follow-up;
record ADR-013 and the knowledge-map integration; independently review the full
diff and run the project gate before shipping. The Jazz Master system migration
is deliberately deferred to separately planned increments so it does not build
on an unreviewed first draft.

### 2026-07-09 — done

Defined APSS under `framework/apss/`: the main framework document, normative
JSON Schema plus schema guide, authoring template, three-view visualization
contract, complete proposed CNC-production capsule, simple changelogs, and the
deferred external-foundations research item. ADR-013 records the staged adoption;
NOTE-015 preserves the grill decisions; AGENTS, architecture, and project-wiki
maps now acknowledge the framework while stating that current paths remain
canonical. TASK-077 is the separately bounded Jazz Master mapping/migration-plan
follow-up.

Independent review found three issues before ship: “validated YAML” lacked an
authoritative schema, NOTE-015 was still unprocessed, and ADR-013 overstated the
existing loops as closed. Added `system.schema.json`/`SCHEMA.md`, linked the
schema from authoring and visualization guidance, marked the fully routed note
processed, and corrected the ADR. Re-review verdict: clean. Relative framework
links resolve; JSON and YAML parse; `git diff --check` is clean. Final
`bun run --cwd codebase check` passed: 46 test files, 683 tests, migration and
web builds green. Existing jsdom canvas messages and sandbox-only Wrangler
log-file EPERM warnings appeared; the command exited 0.

## Execution retrospective

### A declarative template was not enough to support validation

- Problem: the first draft promised validated machine-readable declarations but
  supplied only prose and a YAML template.
- Cause: structural requirements existed in multiple documents without one
  normative validation artifact.
- Resolution: added an extensible JSON Schema and a schema guide separating
  single-file structural checks from registry-level semantic checks.
- Evidence: schema JSON and example/template YAML parse; independent re-review
  found the contract coherent and complete.
- Reuse: framework knowledge — future generators and validators must consume the
  normative schema rather than inventing their own field list.

### Concurrent documentation changed patch anchors

- Problem: broad patches against the engineering/wiki logs failed after TASK-069
  landed concurrently.
- Cause: the patches assumed the previously read newest entries were unchanged.
- Resolution: re-read the live files and applied narrow contextual patches,
  preserving the concurrent work.
- Evidence: final diff contains both TASK-069's entries and TASK-076's additions;
  `git diff --check` is clean.
- Reuse: task-local confirmation of the existing shared-tree rule—re-read live
  context before patching frequently updated append-only indexes.
