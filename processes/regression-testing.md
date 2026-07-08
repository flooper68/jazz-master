# Process: regression testing

Compile and run the manual/browser regression pack: a repeatable checklist that
proves previously shipped Jazz Master features still work in the running app.
This complements `processes/testing-strategy.md` and `processes/qa-product-review.md`.

Regression testing is not product judgment and not implementation. It answers:
did an existing user workflow regress?

## When

- On demand: "run regression testing" or "compile the regression pack".
- Scheduled by `processes/heartbeat.md` when due. Heartbeat schedules a normal
  task; it does not run this process inline.
- Before or alongside a QA/product review when product surface changed since the
  last regression pass.
- After high-risk changes to routing, storage, onboarding, dashboard/planner,
  practice runner, notation, audio/browser permissions, server/deploy behavior,
  or responsive layout.

## Inputs

- Completed product task files in `work/tasks/`, especially their
  **Acceptance criteria**, **Verification**, and **Log** sections.
- Recent git history since the last regression pack/run.
- Current app map from `architecture/overview.md` and `wiki/product/`.
- Existing automated checks: `bun run --cwd codebase check` and, when practice
  flow/routing/storage are in scope, `bun run --cwd codebase check:e2e`.

## Output

`work/REGRESSION.md` is the living regression pack. Create it if missing.

It contains:

- global setup: commands, app URL, storage reset conventions, viewports, and
  browser-tool notes;
- scenario table: ID, priority, area, source tasks, preconditions, steps,
  expected result, and evidence to collect on failure;
- run matrix: which scenarios are always run, which are selected by changed
  area, and which are periodic;
- latest run notes: date, commit, commands, scenarios run/skipped, findings,
  and follow-up issue/insight IDs.

Findings go to `work/issues/ISSUE-*` or `work/insights/INS-*`. Do not fix
product defects during the regression pass.

## Scenario priorities

| Priority | Meaning | Default cadence |
|---|---|---|
| P0 | Core smoke: app entry, navigation, onboarding/state, one full practice loop | Every regression run |
| P1 | Core feature workflows and areas touched by recent changes | When area changed; before QA review |
| P2 | Broader edge, responsive, accessibility, persistence, and polish checks | Periodically or when affected |

Prefer a small pack that agents actually run over a broad checklist that goes
stale. When a P2 scenario repeatedly catches defects or protects a high-value
workflow, promote it.

## Compile or refresh the pack

1. **Find the baseline.** Read `work/REGRESSION.md` if it exists; otherwise
   start a new pack.
2. **Inventory shipped behavior.** Read completed product tasks and recent logs.
   Extract only user-visible workflows and high-risk project workflows; do not
   create manual scenarios for pure unit-tested internals unless they surface in
   the app.
3. **Deduplicate.** Merge task-level Verification steps into scenario-level
   checks. A scenario may cite multiple source tasks.
4. **Classify by risk.** Prioritize high-use, high-impact, recently changed,
   browser-specific, storage-backed, and historically fragile workflows.
5. **Write executable steps.** Each scenario must state:
   - source task IDs;
   - preconditions and data setup, including local storage expectations;
   - viewport(s): desktop, phone width, or both;
   - browser-tool-friendly steps using visible text, roles, labels, and routes;
   - observable expected results;
   - what evidence to capture if it fails.
6. **Avoid manual-test smells.** Do not use vague expected results such as
   "works"; split unrelated checks; avoid hidden state dependencies; keep steps
   short enough that a future agent can tell which assertion failed.
7. **Mark coverage honestly.** If a shipped workflow cannot be tested manually
   yet, add a gap note with the blocker and route it to an insight or task if it
   matters.

## Run the pack

1. **Prepare.**
   - `git status --short` to understand local state.
   - `bun run --cwd codebase check`.
   - `bun run --cwd codebase check:e2e` when the run covers practice flow,
     routing, or storage, or when `work/REGRESSION.md` says it is required.
   - Start the dev server with `bun run --cwd codebase dev`.
2. **Drive the app with a real browser.** Prefer Playwright/browser tooling.
   Use visible user-facing locators and routes; avoid implementation selectors.
3. **Keep scenarios isolated.** Reset or seed local storage exactly as the
   scenario says. Do not let one scenario's state silently satisfy another.
4. **Check the standard signals.** For each scenario, watch:
   - visible expected result;
   - console errors/warnings;
   - failed or unexpected network requests;
   - keyboard reachability and visible focus for interactive controls;
   - desktop and phone-width layout where requested;
   - persistence across refresh when storage is part of the workflow.
5. **Record failures precisely.** Capture route, viewport, steps, expected,
   actual, console/network evidence, screenshots only when useful, and whether
   the failure reproduces after a fresh reload/storage reset.
6. **File findings.** Reproducible broken behavior becomes an `ISSUE-*`;
   product friction or coverage gaps become `INS-*`. Link them from the run
   notes.

## Report

Append/update the latest run notes in `work/REGRESSION.md`:

```markdown
## Latest run - YYYY-MM-DD

- Commit tested:
- Commands:
- Browser/viewport:
- Scenarios run:
- Scenarios skipped:
- Findings filed:
- Result: pass | pass with findings | fail/blocking
```

Then commit the updated pack and filed findings as normal work (`work:` prefix)
and push per `processes/git-workflow.md`.

## Relationship to QA/product review

Regression testing is scripted continuity proof. QA/product review is broader:
it inspects the running product for defects, usability, accessibility, product
fit, and new opportunities.

A QA review should read the latest `work/REGRESSION.md` run before opening the
app. If the pack is stale or missing, heartbeat should schedule a regression
task before or alongside the QA task, depending on urgency.
