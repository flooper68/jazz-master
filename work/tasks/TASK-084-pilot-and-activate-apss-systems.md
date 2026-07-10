---
id: TASK-084
title: Pilot and activate conforming APSS systems
status: abandoned
abandoned_reason: owner decision 2026-07-10 — retire the proposed Jazz Master APSS migration before fresh MVP grooming
depends_on: [TASK-083]
source: TASK-077
created: 2026-07-09
---

# TASK-084 — Pilot and activate conforming APSS systems

## Goal

Prove the migrated system model in operation, resolve or explicitly accept its
gaps, activate only systems that meet APSS conformance, and retire temporary
compatibility links only when agents remain operational without them.

## Exact old → new paths/states

For each exact declaration below, change frontmatter `status: proposed` to
`status: active` only after that declaration's full loop has produced,
validated, compiled, adapted, and run again using the adaptation:

- `systems/jazz-master/SYSTEM.md`
- `systems/jazz-master/subsystems/direction/SYSTEM.md`
- `systems/jazz-master/subsystems/portfolio/SYSTEM.md`
- `systems/jazz-master/subsystems/delivery/SYSTEM.md`
- `systems/jazz-master/subsystems/quality/SYSTEM.md`
- `systems/jazz-master/subsystems/product-learning/SYSTEM.md`
- `systems/jazz-master/subsystems/governance/SYSTEM.md`
- `systems/jazz-master/subsystems/research/SYSTEM.md`
- `systems/jazz-master/subsystems/knowledge/SYSTEM.md`

During this task, present each pilot's evidence to the owner and obtain a
separate activation approval before changing that declaration's status. A
failed or incomplete pilot leaves the declaration `proposed` without blocking
pilots of other systems.

Temporary old compatibility paths created by TASK-079 through TASK-082 may be
removed only after all live references use the exact new paths and a cold-start
agent succeeds. Repository-root `AGENTS.md` and `CLAUDE.md` discovery symlinks
remain.

The exact retirement candidates and their canonical targets are:

| Compatibility path that may be removed | Canonical target that must remain |
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
| `strategy/VIS-001-jazz-master.md` | `systems/jazz-master/subsystems/direction/strategy/VIS-001-jazz-master.md` |
| `strategy/goals.md` | `systems/jazz-master/subsystems/direction/strategy/goals.md` |
| `architecture/overview.md` | `systems/jazz-master/subsystems/governance/architecture/overview.md` |
| `architecture/decisions/` | `systems/jazz-master/subsystems/governance/architecture/decisions/` |
| `architecture/LOG.md` | `systems/jazz-master/subsystems/governance/architecture/LOG.md` |
| `work/` | `systems/jazz-master/work/registry/` |
| `notes/` | `systems/jazz-master/streams/notes/` |
| `research/` | `systems/jazz-master/subsystems/research/artifacts/reports/` |
| `wiki/` | `systems/jazz-master/subsystems/knowledge/knowledge/wiki/` |
| `artifacts/` | `systems/jazz-master/subsystems/knowledge/artifacts/` |

## Compatibility/link update

Maintain a link-retirement checklist naming every old symlink and its search,
resolver, history, and cold-start evidence. A link with any current consumer
stays. Historical references may keep compatibility links indefinitely when
rewriting them would damage provenance or offer no operational benefit.

## Acceptance criteria

- [ ] Each activated system has evidence for all APSS conformance questions and one complete adaptation cycle.
- [ ] Unresolved systems remain `proposed`; no batch activation hides a missing loop.
- [ ] Owner decisions resolve or explicitly accept every MAP gap and deferred question.
- [ ] Generated hierarchy, artifact, and learning views match final declarations.
- [ ] Link retirement preserves root discovery, historical provenance, and agent operation.
- [ ] Independent review and `bun run --cwd codebase check` pass before every activation/retirement push.

## Verification

For each declaration, record the plan/log, artifact, artifact validation,
outcome evidence, compiled knowledge change, owner-approved adaptation, and
next run that used it. Run APSS schema/semantic validation and regenerate MAP;
search and resolve every current link; run the context-free cold-start agent
test; independently review; run `bun run --cwd codebase check`; and verify clean,
pushed git state.

## Log

### 2026-07-10 — abandoned

Owner retired all non-terminal tasks before fresh MVP grooming. No proposed
Jazz Master APSS system was activated and no compatibility link was created or
removed.
