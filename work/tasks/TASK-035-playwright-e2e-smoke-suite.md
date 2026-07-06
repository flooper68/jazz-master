---
id: TASK-035
title: Add a minimal Playwright e2e smoke suite over the guided-practice slice
status: backlog
proposed_by: TASK-030 knowledge sweep 2026-07-06
depends_on: [TASK-024]
source: INS-009
research: RES-012
created: 2026-07-06
---

# TASK-035 — Add a minimal Playwright e2e smoke suite over the guided-practice slice

## Goal

The most valuable user path — onboard → today's plan → run a lesson → history/dashboard reflect it — is covered by a small real-browser suite that fails on broken routing, lost persistence, or console errors.

## Problem brief

Current condition: `bun run check` has no real-browser coverage; browser behavior is verified only by manual Playwright-MCP passes during QA reviews.
Desired condition: the automated gate catches regressions on the finished guided-practice vertical slice without a human driving a browser.
Affected user/workflow: practicing guitarist starting, completing, and resuming guided practice.
Evidence: RES-012 findings 3 and 7 (add Playwright only once a high-value workflow exists — it now does); INS-009.
Baseline: zero automated browser tests.
Target: a smoke suite (~4–6 specs) running locally via a `bun run --cwd codebase` script.
How we will know it improved: deliberately breaking the runner route or the `sessions` store makes the suite fail.

## Context

Scope per INS-009: one happy path (start a lesson, grade through it, see it in history), one refresh/persistence path (state survives reload), one phone-width smoke (ties to ISSUE-001), console/network error assertions, traces only on failure. Decide and document whether the suite joins `bun run check` or stays a separate script (RES-012 favors keeping the gate fast). Keep it minimal — this is a smoke suite, not a browser port of the unit tests.

Standalone (no epic) deliberately: EPIC-007's scope explicitly excludes tooling/infrastructure work, and no other epic covers test infrastructure; the suite spans several epics' shipped surfaces (EPIC-008/011/012).

## Resolved questions (grill session 2026-07-06, NOTE-005)

- **Acceptance confirmed by the owner**, sequenced **after** the EPIC-013 migration (`depends_on: TASK-024`) — the suite is written once against the final Astro/Workers platform; the migration itself is verified manually. All routes in the criteria read as post-migration paths (`/app/*`).
- **Gate placement decided: separate `check:e2e` script, not part of `bun run check`** — the owner wants the gate kept fast. Named trigger points (QA reviews, deploys, practice-flow-touching tasks) are written into the process docs.
- Spec ceiling stays ~5; accessibility flows arrive later via INS-010's own trigger.

## Acceptance criteria

- [ ] Playwright installed in the workspace with a documented run script
- [ ] Happy-path spec: onboard/skip → start a plan lesson → grade to summary → session appears in `/history` and on the dashboard
- [ ] Persistence spec: reload mid-flow keeps profile/plan/session records
- [ ] Phone-width smoke: no horizontal overflow on the core pages (guards ISSUE-001's fix)
- [ ] Specs assert no console errors / failed requests on the covered paths
- [ ] Suite runs via a separate `check:e2e` script (owner decision, NOTE-005 — `bun run check` stays fast); its trigger points added to the QA-review and deploy process docs
- [ ] `bun run check` passes

## Verification

Run the suite green; then break the runner route (or rename the `sessions` store key) locally and confirm the suite fails; revert.
