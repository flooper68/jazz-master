---
id: TASK-035
title: Add a minimal Playwright e2e smoke suite over the guided-practice slice
status: done
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

- [x] Playwright installed in the workspace with a documented run script
- [x] Happy-path spec: onboard/skip → start a plan lesson → grade to summary → session appears in `/history` and on the dashboard
- [x] Persistence spec: reload mid-flow keeps profile/plan/session records
- [x] Phone-width smoke: no horizontal overflow on the core pages (guards ISSUE-001's fix)
- [x] Specs assert no console errors / failed requests on the covered paths
- [x] Suite runs via a separate `check:e2e` script (owner decision, NOTE-005 — `bun run check` stays fast); its trigger points added to the QA-review and deploy process docs
- [x] `bun run check` passes

## Verification

Run the suite green; then break the runner route (or rename the `sessions` store key) locally and confirm the suite fails; revert.

## Log

### 2026-07-07 — claimed (agent)

Plan: `@playwright/test` as a devDep of `@jazz-master/web`; suite in `apps/web/e2e/*.spec.ts`
(the path `processes/testing-strategy.md` already reserves) against `astro dev` via Playwright's
`webServer`. ~5 specs: (1) Astro landing renders and links into `/app`; (2) happy path —
skip onboarding → start the planned lesson → grade to "Lesson complete" → session visible in
History and on the Dashboard (streak, "Done today"); (3) persistence — reload after one grade
keeps profile (no wizard), the incomplete session, and today's plan; (4) phone-width (375px)
no-horizontal-overflow sweep over the core pages (guards ISSUE-001). Console-error and
failed-request assertions run as an auto-fixture on every spec rather than a fifth spec.
Wiring: `e2e` script in apps/web + `check:e2e` in the codebase root (owner decision NOTE-005 —
not in `bun run check`); vitest excludes `e2e/**`; a dedicated `tsconfig.e2e.json` typechecks the suite;
trigger points documented in `processes/qa-product-review.md` (run before a QA review) and
`processes/git-workflow.md` (run before pushing practice-flow-touching changes — push = dev
deploy per ADR-009). Measurable aim (from the brief): zero automated browser tests → a suite
that fails when the runner route or the `sessions` store key is deliberately broken; that
break-it check is the verification signal.

### 2026-07-07 — done

Shipped as planned: 4 specs in `apps/web/e2e/` (landing→app link, happy path,
mid-flow-reload persistence, 375px overflow sweep), console-error/failed-request
assertions as an auto-fixture in `e2e/fixtures.ts`, `check:e2e` script at the
codebase root, trigger points in `processes/testing-strategy.md`,
`processes/qa-product-review.md`, and `processes/git-workflow.md`. Verified: suite
green (~8s); deliberately disabling the runner's `upsertSession` effect failed the
happy-path and persistence specs (reverted) — the suite catches broken session
persistence and, via the same specs, a broken runner route. `bun run check` green
(527 tests) with e2e excluded from vitest and typechecked by a dedicated
`tsconfig.e2e.json`. Independent code-review pass: no must-fix; applied its four
worthwhile findings (documented `bunx playwright install chromium` as one-time
setup, scoped the HTTP-status assertion to app-origin responses, made
`gradeThroughLesson` wait for the runner to settle between clicks, corrected this
Log's tsconfig reference). Gotcha for posterity: Astro 7 auto-daemonizes
`astro dev` when it detects an agentic environment, which Playwright's `webServer`
reads as the server dying — `ASTRO_DEV_BACKGROUND=1` in the webServer env forces
foreground (commented in `playwright.config.ts`). Not logged in
`architecture/LOG.md` this commit: a concurrent agent has uncommitted changes
there (TASK-036 abandonment); the gotcha lives here and in the config comment
instead. Deviation: none. For the next QA review: run `check:e2e` first; the
covered happy paths no longer need manual re-proving.
