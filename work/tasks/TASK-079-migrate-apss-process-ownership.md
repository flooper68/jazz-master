---
id: TASK-079
title: Migrate APSS process ownership with compatibility links
status: gated
depends_on: [TASK-077]
gated_until: Owner explicitly accepts systems/jazz-master/MAP.md and resolves its deferred boundary questions.
source: TASK-077
created: 2026-07-09
---

# TASK-079 — Migrate APSS process ownership with compatibility links

## Goal

Make the proposed system capsules the canonical owners of every current process
while preserving every old `processes/*.md` entry point and adding repeatable
schema/map validation before later material moves.

## Context

This is the first migration step. Do not start it merely because TASK-077 is
done: the owner must first accept `systems/jazz-master/MAP.md`. Declarations
remain `proposed`; current `AGENTS.md` continues to route through old paths.

## Exact old → new paths

| Old canonical path | New canonical path |
|---|---|
| `processes/product-practices.md` | `systems/jazz-master/subsystems/direction/processes/product-practices.md` |
| `processes/heartbeat.md` | `systems/jazz-master/subsystems/portfolio/processes/heartbeat.md` |
| `processes/prioritization.md` | `systems/jazz-master/subsystems/portfolio/processes/prioritization.md` |
| `processes/status-report.md` | `systems/jazz-master/subsystems/portfolio/processes/status-report.md` |
| `processes/dev-loop.md` | `systems/jazz-master/subsystems/delivery/processes/dev-loop.md` |
| `processes/development-practices.md` | `systems/jazz-master/subsystems/delivery/processes/development-practices.md` |
| `processes/git-workflow.md` | `systems/jazz-master/subsystems/delivery/processes/git-workflow.md` |
| `processes/code-review.md` | `systems/jazz-master/subsystems/quality/processes/code-review.md` |
| `processes/qa-product-review.md` | `systems/jazz-master/subsystems/quality/processes/qa-product-review.md` |
| `processes/regression-testing.md` | `systems/jazz-master/subsystems/quality/processes/regression-testing.md` |
| `processes/security-review.md` | `systems/jazz-master/subsystems/quality/processes/security-review.md` |
| `processes/testing-strategy.md` | `systems/jazz-master/subsystems/quality/processes/testing-strategy.md` |
| `processes/feedback-intake.md` | `systems/jazz-master/subsystems/product-learning/processes/feedback-intake.md` |
| `processes/triage.md` | `systems/jazz-master/subsystems/product-learning/processes/triage.md` |
| `processes/grilling.md` | `systems/jazz-master/subsystems/governance/processes/grilling.md` |
| `processes/deep-research.md` | `systems/jazz-master/subsystems/research/processes/deep-research.md` |
| `processes/artifact-creation.md` | `systems/jazz-master/subsystems/knowledge/processes/artifact-creation.md` |
| `processes/knowledge-maintenance.md` | `systems/jazz-master/subsystems/knowledge/processes/knowledge-maintenance.md` |
| `processes/wiki-maintenance.md` | `systems/jazz-master/subsystems/knowledge/processes/wiki-maintenance.md` |

Add exact new tools `systems/jazz-master/tools/validate.ts` and
`systems/jazz-master/tools/generate-map.ts`; wire an exact command path without
adding a new package root. The generator may replace only explicitly marked
derived sections in `systems/jazz-master/MAP.md`.

Create the following exact new durable-record pairs (there is no old-path move
for these new files):

- `systems/jazz-master/work/PLAN.md` and `systems/jazz-master/work/LOG.md`
- `systems/jazz-master/subsystems/direction/work/PLAN.md` and `systems/jazz-master/subsystems/direction/work/LOG.md`
- `systems/jazz-master/subsystems/portfolio/work/PLAN.md` and `systems/jazz-master/subsystems/portfolio/work/LOG.md`
- `systems/jazz-master/subsystems/delivery/work/PLAN.md` and `systems/jazz-master/subsystems/delivery/work/LOG.md`
- `systems/jazz-master/subsystems/quality/work/PLAN.md` and `systems/jazz-master/subsystems/quality/work/LOG.md`
- `systems/jazz-master/subsystems/product-learning/work/PLAN.md` and `systems/jazz-master/subsystems/product-learning/work/LOG.md`
- `systems/jazz-master/subsystems/governance/work/PLAN.md` and `systems/jazz-master/subsystems/governance/work/LOG.md`
- `systems/jazz-master/subsystems/research/work/PLAN.md` and `systems/jazz-master/subsystems/research/work/LOG.md`
- `systems/jazz-master/subsystems/knowledge/work/PLAN.md` and `systems/jazz-master/subsystems/knowledge/work/LOG.md`

Each declaration must switch its `planning.plan`/`planning.log` to its own pair
in this task. Preserve `work/tasks/` as the compatibility registry for current
in-flight and historical item records until TASK-081.

## Compatibility/link update

After each `git mv`, replace the exact old path with a relative symlink to the
new canonical file. Verify `AGENTS.md`, current tasks, and old git-era links can
still open every `processes/*.md` path. Update declarations to the new paths in
the same commit; do not update the root process index yet.

## Acceptance criteria

- [ ] All 19 process files have exactly one new canonical owner matching MAP.md.
- [ ] Every old process path resolves through a relative compatibility symlink.
- [ ] Every system has a real capsule-local PLAN.md and LOG.md contract; no
      index, compiled artifact, or changelog is mislabeled as its work record.
- [ ] The validator checks APSS schema, unique IDs, one acyclic parent tree,
      resolved relations/local references, exactly one root, proposed status,
      and exact-once process ownership.
- [ ] The three marked MAP views regenerate deterministically from declarations.
- [ ] A cold-start agent following current AGENTS.md can still run the dev loop.
- [ ] Independent review and `bun run --cwd codebase check` pass.

## Verification

Run the new validator/generator twice and confirm the second run has no diff.
Compare `find processes -maxdepth 1 -type l` with the 19-row table; resolve and
read every link. Run the knowledge-maintenance process-index lint through the
old paths, complete an independent review, and run
`bun run --cwd codebase check`.
