---
id: RES-012
title: QA and testing best practices for Jazz Master
status: complete
task: TASK-006
created: 2026-07-06
stale_when: >
  Vitest 5, Playwright 2, Testing Library query guidance, WCAG 3, axe-core
  rule coverage, or Jazz Master's architecture changes materially; or the
  project adopts CI, a backend, production analytics, or regular external-user
  test sessions.
---

# RES-012 - QA and testing best practices for Jazz Master

## Research questions

1. What belongs in unit, component, integration, and end-to-end tests for a Vite React SPA with a pure TypeScript theory package?
2. What are current Testing Library best practices for React component tests: queries, user interactions, async behavior, and assertions to avoid?
3. Is Playwright end-to-end testing worth adopting before launch for a local-first SPA, and what is the smallest useful scope?
4. What pragmatic accessibility QA subset should this repo run manually and with tooling?
5. Is visual regression testing worth the cost now, later, or never?
6. What testing and review checks specifically reduce AI-generated-code failure modes?
7. What exploratory/manual QA structure should `REV-*` product reviews follow?

## Findings

### 1. Test levels should be named by defect class, cost, and boundary

The test pyramid remains useful if treated as a portfolio rule instead of a
literal taxonomy: use many small, fast tests, some coarser integration/component
tests, and few full end-to-end tests because higher-level tests are slower and
more expensive to maintain [1]. Google's "small / medium / large" framing is a
better operational definition than terminology debates: small tests avoid
network, database, filesystem, external systems, sleeps, and threading; medium
tests may use localhost/filesystem/database; large tests may cross full systems
and are slower [2].

For a React SPA, UI tests are not all "large." Vitest's component-testing guide
places component tests between unit and end-to-end tests: they verify component
contracts, interactions, edge/error states, and accessibility while remaining
faster and easier to debug than whole-app flows [3]. Testing Library adds the
user-facing contract: tests should resemble how the page is used and operate on
DOM nodes instead of component instances [4].

Our pick: Jazz Master should classify tests by the cheapest layer that catches
the defect. Pure music rules belong in `packages/theory` unit tests through the
public API. Reusable visual components belong in colocated React component tests.
Pages and route shells get workflow-level component/integration tests in jsdom.
Only cross-page, browser-only, or regression-prone user flows justify Playwright
end-to-end coverage.

### 2. Testing Library tests should use semantic queries and real interactions

Testing Library's query priority starts with accessible queries: `getByRole`
with accessible name is the preferred default, followed by labels for form
controls, text for non-interactive content, and only then alt/title/test IDs when
the user-visible contract cannot be expressed otherwise [5]. The same docs
recommend `screen`, distinguish `getBy`, `queryBy`, and `findBy` by absence and
async behavior, and warn that `querySelector` by CSS/id is an escape hatch rather
than a user-facing contract [5].

`user-event` simulates full user interactions rather than dispatching a single
low-level DOM event; it checks visibility/interactability and manipulates the DOM
more like the browser would. Its docs recommend `userEvent.setup()` inside the
test before rendering or interacting, while `fireEvent` remains only for cases
that `user-event` cannot model yet [6]. `jest-dom`/Vitest DOM matchers make
assertions read like DOM behavior (`toBeVisible`, `toBeInTheDocument`,
`toHaveAccessibleName`-style checks), and Testing Library notes that absence
assertions should use non-throwing `queryBy*` queries [7].

Our pick: keep the current React test style. Existing tests already use roles,
labels, text, `screen`, and `userEvent.setup()`. Improve future tests by avoiding
implementation assertions such as CSS classes, private state, or internal call
order unless that is the only stable contract.

### 3. Playwright is valuable, but the first suite should be tiny and triggered

Playwright's best-practice guide says end-to-end tests should verify
user-visible behavior, stay isolated with fresh storage/session state, avoid
third-party dependencies, use user-facing locators, and prefer web-first
assertions that auto-wait [8]. Playwright also provides trace viewer, UI mode,
codegen, browser projects, and console/network inspection; traces are useful for
debugging but expensive enough that the docs advise not recording them for every
test by default [8].

This project is currently local-first, has no backend, and has mostly foundation
surfaces. A large e2e suite before a real practice loop would add installation,
browser binary, and maintenance cost without protecting much user value. The
minimal valuable trigger is the first guided practice flow or planner/history
flow where browser behavior, routing, persistence, keyboard use, and responsive
layout interact.

Our pick: do not adopt Playwright as part of `bun run check` in TASK-006.
Instead, file a follow-up insight for a minimal e2e smoke suite when the first
real practice workflow exists. Until then, QA reviews should use Playwright MCP
manually to inspect the running app.

### 4. Accessibility QA needs both manual checks and automated support

WCAG 2.2's quick reference shows the breadth of the standard: text alternatives,
info/relationships, contrast, reflow, keyboard access, focus order/visibility,
target size, labels/instructions, name/role/value, and status messages are all
relevant to a music-practice UI [9]. W3C's Easy Checks are deliberately quick
and non-exhaustive; passing them can still leave significant barriers, so they
are a first review rather than a compliance claim [10].

`axe-core` is a practical automated engine for HTML-based interfaces. It can run
inside existing functional tests, covers WCAG 2.0/2.1/2.2 rule sets and best
practices, and reports "incomplete" when manual review is required. Deque's own
README says axe-core finds an average of 57% of WCAG issues automatically, which
is strong enough to catch common regressions but not enough to replace manual
keyboard, focus, labeling, and screen-reader-oriented review [11].

Our pick: add manual a11y structure to QA now: page title/heading, keyboard-only
navigation, visible focus, semantic names for controls/diagrams, contrast,
reflow at phone width, form labels/errors, and status messages. File automated
axe checks as a follow-up tied to the future browser/e2e harness rather than
adding another dependency in this documentation task.

### 5. Visual regression should wait for stable visual contracts

Vitest Browser Mode can run tests in real browsers and supports screenshots via
`toMatchScreenshot`. Its docs describe reference screenshots committed in
`__screenshots__`, environment-specific names, baseline review, update flows, and
stable screenshot detection for images, animations, and layout settling [12].
The same docs warn that stable visual tests need a stable environment and
recommend cloud services or Docker containers for consistency [12].

Jazz Master currently has simple SVG components and no CI-controlled browser
environment. Manual screenshots during QA are cheaper than committed visual
baselines until there are visual components whose pixel-level regression risk is
high: notation/tab rendering, responsive fretboards, chord diagrams with many
variants, or generated visual artifacts.

Our pick: skip automated visual regression now. Revisit when notation/tabs or a
browser test harness creates enough visual surface to justify baselines.

### 6. AI-generated code and tests need execution plus behavioral review

Vitest's AI testing guide is directly applicable to this repo's agent workflow:
give the AI source files, existing tests, config, dependencies, and `AGENTS.md`;
ask for edge cases explicitly; tell it what not to do; and review generated
tests as first drafts, not finished work [13]. It calls out common failure modes:
shallow assertions, implementation-detail coupling, tests that do not run, missing
edge cases, Jest APIs in Vitest tests, leaked mocks, and verbose hard-to-scan
test names [13].

Recent empirical work reinforces the need to execute and inspect. One study of
LLM coding agents found only 68.3% of generated projects executed out of the box
and found large hidden dependency gaps [14]. Another 2026 study found
AI-generated tests can improve coverage comparably to human-written tests, but
they show distinct structural patterns, including longer tests with more
assertions and linear logic [15]. RES-005 and RES-010 already add the local
process answer: reviews must split spec-fit from standards-fit, and tests are
part of the contract rather than a coverage ornament [16][17].

Our pick: every agent-written test must be run, reviewed for behavior value, and
checked for over-mocking, fake APIs, missing edge cases, and leakage. Coverage is
useful signal later, but this repo should first preserve meaningful assertions
and a green `bun run check`.

### 7. Exploratory QA should be chartered and auditable

Exploratory testing is simultaneous learning, test design, and test execution,
not random clicking [18]. Session-Based Test Management was created to make
exploratory work accountable: a focused mission/charter, time-boxed session,
notes on what was tested, bugs/issues found, obstacles, and follow-up outlook
[19]. This fits Jazz Master's `REV-*` process: the review is not a fix-it
session; it observes the running product and files issues/insights.

Our pick: `qa-product-review.md` should require short charters and tours:
practice-loop tour, navigation/responsiveness tour, accessibility tour,
persistence/data tour, and error/edge-case tour. Each finding should record
evidence, severity or product impact, baseline, candidate target, and validation
need.

## Recommendations

1. Add `processes/testing-strategy.md` as the repo's test standard: layer
   definitions, file locations, command conventions, Testing Library style,
   task-specific coverage expectations, and what is deliberately not tested
   yet [1][2][3][4][5][6][17].
2. Keep `bun run check` as the only automated gate for now. It already runs
   typecheck, lint, Vitest, and build; Playwright/axe/visual baselines are not
   adopted until their triggers fire [8][11][12][17].
3. Require theory-core work to remain test-first or at least test-led through
   public exports, with exhaustive music edge cases when spelling or fretboard
   math changes [1][17].
4. Require React component/page tests for meaningful UI behavior, especially
   interaction, routing, storage-facing workflows, empty/error states, keyboard
   paths, and accessible names. Use `screen`, semantic queries, `user-event`,
   and DOM matchers; avoid implementation coupling [4][5][6][7].
5. File a follow-up insight for minimal Playwright e2e once the first real
   practice workflow exists. Scope should be one happy path plus one persistence
   refresh path, not a broad suite [8].
6. Upgrade `processes/qa-product-review.md` with chartered exploratory tours,
   console/network checks, responsive checks, manual a11y checks, persistence
   checks, and better evidence fields [9][10][18][19].
7. File a follow-up insight for automated axe checks after a browser/e2e harness
   exists; manual a11y review starts now [9][10][11].
8. Skip automated visual regression for now. Revisit when notation/tab rendering,
   generated visual assets, or a stable browser test environment creates enough
   visual risk to justify screenshot baselines [12].
9. Strengthen code review and task verification for AI-generated tests: run the
   tests, reject shallow assertions, inspect over-mocking and fake APIs, cover
   edge cases explicitly, and keep test names scannable [13][14][15][16].

## Considered and rejected

- Add Playwright to `bun run check` now: rejected. There is no real practice
  workflow yet, so it would add browser/dependency cost before protecting a
  high-value path [8].
- Add axe-core now: rejected for this task because the repo has no browser test
  harness. Manual a11y review is upgraded immediately, and automated axe is filed
  behind the harness trigger [10][11].
- Add Vitest Browser Mode now: rejected. Current jsdom component tests are
  adequate for foundation UI behavior; Browser Mode becomes attractive for
  focus/layout/browser-API defects once interactive controls grow [3].
- Add visual regression now: rejected. Screenshot baselines need stable browser
  environments and meaningful visual contracts; current QA screenshots are
  enough until notation/tabs or similarly visual features arrive [12].
- Track test coverage thresholds now: rejected. Coverage would be easy to game
  while the suite is young. Meaningful behavior coverage and review discipline
  matter more until CI and a larger code surface exist [13][17].
- Snapshot-test React output broadly: rejected. Broad DOM snapshots are noisy and
  encourage implementation coupling; use explicit semantic assertions, with
  narrow snapshots only for stable serialized domain outputs when they improve
  readability [4][5][13].

## Sources

[1] Ham Vocke / Martin Fowler, "The Practical Test Pyramid" - https://martinfowler.com/articles/practical-test-pyramid.html (published 2018-02-26, accessed 2026-07-06)

[2] Google Testing Blog, "Test Sizes" - https://testing.googleblog.com/2010/12/test-sizes.html (published 2010-12-13, accessed 2026-07-06)

[3] Vitest Docs, "Component Testing" - https://vitest.dev/guide/browser/component-testing (Vitest v4.1.9 docs, accessed 2026-07-06)

[4] Testing Library Docs, "Guiding Principles" - https://testing-library.com/docs/guiding-principles/ (last updated 2020-11-04, accessed 2026-07-06)

[5] Testing Library Docs, "About Queries" - https://testing-library.com/docs/queries/about/ (last updated 2024-03-19, accessed 2026-07-06)

[6] Testing Library Docs, "user-event Introduction" - https://testing-library.com/docs/user-event/intro/ (last updated 2023-11-23, accessed 2026-07-06)

[7] Testing Library Docs, "jest-dom" - https://testing-library.com/docs/ecosystem-jest-dom/ (last updated 2022-08-09, accessed 2026-07-06)

[8] Playwright Docs, "Best Practices" - https://playwright.dev/docs/best-practices (accessed 2026-07-06)

[9] W3C WAI, "How to Meet WCAG (Quick Reference)" - https://www.w3.org/WAI/WCAG22/quickref/ (WCAG 2.2 quick reference, accessed 2026-07-06)

[10] W3C WAI, "Easy Checks - A First Review of Web Accessibility" - https://www.w3.org/WAI/test-evaluate/easy-checks/ (draft page, accessed 2026-07-06)

[11] Deque Labs, "axe-core README" - https://github.com/dequelabs/axe-core (accessed 2026-07-06)

[12] Vitest Docs, "Visual Regression Testing" - https://vitest.dev/guide/browser/visual-regression-testing (Vitest v4.1.9 docs, accessed 2026-07-06)

[13] Vitest Docs, "Writing Tests with AI" - https://vitest.dev/guide/learn/writing-tests-with-ai (Vitest v4.1.9 docs, accessed 2026-07-06)

[14] Vangala et al., "AI-Generated Code Is Not Reproducible (Yet): An Empirical Study of Dependency Gaps in LLM-Based Coding Agents" - https://arxiv.org/abs/2512.22387 (submitted 2025-12-26, revised 2026-03-23, accessed 2026-07-06)

[15] Yoshimoto et al., "Testing with AI Agents: An Empirical Study of Test Generation Frequency, Quality, and Coverage" - https://arxiv.org/abs/2603.13724 (submitted 2026-03-14, MSR 2026, accessed 2026-07-06)

[16] RES-005, "Matt Pocock's recent agentic coding workflow patterns" - research/RES-005-matt-pocock-agentic-coding-workflow.md (created 2026-07-05)

[17] RES-010, "React 19 + TypeScript + Vite/Bun development best practices" - research/RES-010-development-best-practices.md (created 2026-07-06)

[18] Cem Kaner, "Exploratory Testing" - http://www.testingeducation.org/a/nature.pdf (2004, accessed 2026-07-06)

[19] James Bach, "Session-Based Test Management" - https://www.satisfice.com/download/session-based-test-management (created 2000-11-01, last updated 2021-07-07, accessed 2026-07-06)
