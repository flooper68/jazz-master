---
id: RES-016
title: Manual regression testing for agent-run browser passes
status: complete
created: 2026-07-08
stale_when: >
  Jazz Master adopts CI-enforced browser regression suites, a materially
  different release/deploy cadence, external QA, or a new test-management tool;
  or Playwright's recommended browser-driving patterns change materially.
---

# RES-016 - Manual regression testing for agent-run browser passes

## Research questions

1. What should a lightweight regression-testing pack contain for a solo-owner,
   AI-agent-run web app?
2. How should manual regression scenarios be selected and prioritized as the
   suite grows?
3. How should browser-agent execution be structured so results are repeatable
   without turning the process into brittle automation?
4. Where should this sit relative to heartbeat and QA/product review?

## Findings

### 1. Regression needs scripted repeatability, but not exhaustive retesting

Regression testing checks that previously working behavior still works after
change. The practical constraint is suite growth: regression-test selection is a
long-studied problem because retesting everything after every change is costly,
so useful regression work selects an appropriate subset based on the change and
risk [1][2].

For this repo, the right artifact is not another automated gate. `bun run check`
and `check:e2e` already cover fast automated proof. The missing artifact is a
living manual/browser regression pack compiled from shipped feature acceptance
criteria and task Verification steps, with enough detail for an agent to run it
through a browser tool without rereading every task file.

### 2. Select scenarios by user value, change impact, and failure risk

Risk-based testing uses risk assessment to steer test planning, implementation,
execution, and evaluation; recent code changes and high-value workflows should
therefore pull scenarios toward the front [3]. Recent regression-test research
also reinforces change-aware
selection: PR-specific changed lines and nearby test context are useful signals
for deciding which tests to add or run [4].

For Jazz Master, high-risk regression areas are: onboarding and local storage,
dashboard/planner/session history, guided practice runner, routing, notation,
audio/browser permissions, responsive layout, and any server/deploy surface. A
small always-run smoke set should cover app entry and the core practice loop;
the rest should be tiered and selected by changed areas.

### 3. Manual test steps need their own quality bar

Poorly written manual tests are a maintainability risk. A 2023 study cataloged
"test smells" in natural-language manual tests and found that unclear or poorly
structured manual cases can harm reliability and maintainability [5]. Test
charter research similarly treats the charter as the focusing vehicle for
exploratory sessions and recommends deliberate charter contents rather than
ad-hoc wandering [6].

For this project, a regression scenario should be specific enough to execute:
preconditions, viewport/data state, steps, observable expected results, and
source task IDs. It should avoid multi-purpose steps, hidden assumptions, and
expected results like "works" or "looks right" without visible evidence.

### 4. Browser-agent execution should use user-facing contracts

Playwright's current best-practice guidance is a good model even for manual
browser-agent runs: test user-visible behavior, keep tests isolated by controlling
storage/session state, avoid third-party dependencies, prefer user-facing
locators, use web-first waits/assertions when scripting, and use tooling such as
trace/screenshot only when it helps diagnosis [7].

The manual pack should therefore tell the agent how to set state, which viewport
to use, what visible controls/headings to interact with, what console/network
signals to watch, and what evidence to capture for failures. It should not encode
CSS selectors or private implementation details as the contract.

### 5. Accessibility and responsive checks belong in core scenarios

W3C's Easy Checks are explicitly a quick first review, not a complete
accessibility evaluation, but they cover the right manual smoke signals for this
repo: page title, headings, contrast, text resize, keyboard access/focus, form
labels/errors, moving content, multimedia alternatives, and basic structure [8].

Regression scenarios should include a small accessibility/responsive checklist
on every core path rather than leaving those checks only to full QA reviews.

### 6. Heartbeat should schedule regression tasks; it should not run them

The heartbeat process already owns cadence and explicitly schedules heavy work
as tasks instead of executing it inline. Regression testing is heavy browser work
with manual judgment and findings, so it belongs behind a normal task created by
heartbeat or by direct owner request. QA/product review can consume the latest
regression pack, but QA asks a broader product question; regression asks whether
previously shipped behavior still works.

## Recommendations

1. Add `processes/regression-testing.md` as the executable process for compiling
   and running a manual/browser regression pack.
2. Make the process output a living `work/REGRESSION.md` checklist compiled from
   task Acceptance criteria and Verification sections, deduplicated into
   scenario IDs with source task links.
3. Tier scenarios:
   - `P0`: always-run smoke for app entry, navigation, onboarding/state, and one
     full practice loop.
   - `P1`: core workflows tied to recently changed or high-value areas.
   - `P2`: broader edge/responsive/accessibility checks run periodically or when
     affected.
4. Update heartbeat to schedule a regression-testing task when the pack is
   missing/stale, after meaningful product surface changes accumulate, before or
   alongside a QA review, or after high-risk areas change.
5. Keep regression separate from QA/product review: regression is scripted
   continuity proof; QA review is exploratory product judgment. A QA task should
   read the latest regression pack/run, but heartbeat should be allowed to
   schedule either or both.
6. Require findings from regression runs to become `ISSUE-*` or `INS-*` files;
   the regression process observes and records, it does not fix inline.

## Considered and rejected

- Run regression inside heartbeat: rejected. It violates heartbeat's existing
  "schedule, don't execute" guardrail and would make a consolidation ritual
  depend on long browser sessions.
- Replace manual regression with more Playwright tests immediately: rejected.
  Automation should grow from repeated, stable scenarios. The missing need is a
  compiled human/agent-readable pack, not another always-on gate.
- Store regression scenarios only in completed task files: rejected. That is the
  current state and is too scattered for an agent to run as a coherent pass.

## Sources

[1] RES-012, "QA and testing best practices for Jazz Master" -
research/RES-012-qa-testing-best-practices.md (created 2026-07-06)

[2] Jones, "Addressing the Regression Test Problem with Change Impact Analysis
for Ada" - https://arxiv.org/abs/1606.04568 (submitted 2016-06-14, accessed
2026-07-08)

[3] Felderer and Schieferdecker, "A taxonomy of risk-based testing" -
https://arxiv.org/abs/1912.11519 (published 2019, accessed 2026-07-08)

[4] Zhou, Paltenghi, Kim, Pradel, "Change And Cover: Last-Mile,
Pull Request-Based Regression Test Augmentation" -
https://arxiv.org/abs/2601.10942 (submitted 2026-01-16, accessed 2026-07-08)

[5] Soares et al., "Manual Tests Do Smell! Cataloging and Identifying Natural
Language Test Smells" - https://arxiv.org/abs/2308.01386 (ESEM 2023, accessed
2026-07-08)

[6] Ghazi, Garigapati, Petersen, "Checklists to Support Test Charter Design in
Exploratory Testing" - https://arxiv.org/abs/1704.00988 (XP 2017, accessed
2026-07-08)

[7] Playwright Docs, "Best Practices" - https://playwright.dev/docs/best-practices
(accessed 2026-07-08)

[8] W3C WAI, "Easy Checks - A First Review of Web Accessibility" -
https://www.w3.org/WAI/test-evaluate/preliminary/ (accessed 2026-07-08)
