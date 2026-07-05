---
id: RES-008
title: Organizational problem identification, measurement, and solving frameworks
status: complete
created: 2026-07-05
stale_when: "A specific Jazz Master operating process is created from this research, or major new evidence changes common practice in strategy execution / continuous improvement frameworks."
---

# RES-008 — Organizational problem identification, measurement, and solving frameworks

## Research questions

1. How do organizations identify real problems rather than symptoms or vague opportunities?
2. How do they turn problems into measurable goals, indicators, and baselines?
3. Which frameworks guide teams from measurement to root cause and solution?
4. Which frameworks are strongest for discovery/innovation problems where the problem itself is uncertain?
5. What should a solo owner + AI-agent software project adapt from these frameworks?
6. How well do Jazz Master's current process docs already cover this, and where should they improve?

## Findings

### 1. Organizations separate discovery, framing, and solution selection

Credible frameworks consistently warn against jumping from a symptom to a solution. The Design Council's Double Diamond explicitly starts with broad discovery to understand the issue instead of assuming the problem, then narrows into a defined challenge before developing and testing solutions [1]. Lean A3 similarly forces a concise statement of the current situation, nature of the issue, countermeasures, owner, action plan, and evidence that the issue was addressed [2].

The common pattern is:

- Gather evidence from people affected by the work, customers, operations, data, support, sales, failures, or product usage.
- State the current condition and desired condition.
- Narrow scope until there is an accountable owner and an observable gap.
- Delay solution choice until the current condition and causes are understood.

### 2. Measurement starts with the goal, then derives indicators

The strongest measurement frameworks do not begin with "what can we measure?" They begin with "what are we trying to accomplish?" The IHI Model for Improvement asks three questions: what are we trying to accomplish, how will we know a change is an improvement, and what change can we make that will result in improvement [3]. IHI also says aims should be time-bound and measurable, specify the affected population, and name where improvement is taking place [3].

KPIs are useful when they are quantifiable measures of progress toward a desired result, balancing leading indicators that predict future performance with lagging indicators that confirm outcomes [4]. Balanced Scorecard expands this at the strategy level by linking mission/strategy to objectives, KPIs, targets, initiatives, and daily work across financial, customer/stakeholder, internal process, and organizational capacity perspectives [5].

For software-intensive or data-heavy work, Goal-Question-Metric / GQM+Strategies is especially relevant. It translates business strategy into operational goals, then measurement goals, so collected data is justified by decision needs rather than metric availability [6].

### 3. Improvement frameworks usually follow a Define/Measure/Analyze/Improve/Control rhythm

DMAIC is the canonical quality-improvement structure: Define the problem and goal, Measure the real process and baseline, Analyze root causes, Improve through tested solutions, and Control through monitoring and standardization [7]. ASQ positions DMAIC for existing processes that miss standards or customer expectations, especially complex or high-risk problems [7].

The IHI Model for Improvement is lighter-weight but similar in spirit: set an aim, establish measures, select changes, then test changes using Plan-Do-Study-Act cycles [3]. Lean Startup applies the same experimental logic to uncertain product/business assumptions: build a minimum viable product, measure customer response with actionable metrics, and learn whether to pivot or persevere [8].

### 4. Root cause work is a separate phase, not just brainstorming

Root cause tools appear across DMAIC, A3, 8D, CAPA, Lean Startup, and quality management. ASQ's DMAIC page lists root cause analysis and FMEA in Analyze, design of experiments and kaizen in Improve, then control plans, statistical process control, 5S, and mistake-proofing in Control [7].

The main practical tools are:

- 5 Whys: fast causal drill-down, useful but too shallow if used alone.
- Fishbone/Ishikawa: maps multiple cause categories.
- Pareto analysis: finds the few causes or defect types creating most impact.
- Process mapping / value stream mapping: exposes handoffs, waits, rework, and failure points.
- FMEA: anticipates failure modes, effects, severity, likelihood, and detection.
- Control plan / SPC / dashboards: prevents regression after the fix.

### 5. Different frameworks fit different problem types

There is no single best framework. The best choice depends on uncertainty and scale:

- Strategy-level alignment: Balanced Scorecard, OKRs, GQM+Strategies.
- Existing operational process is underperforming: DMAIC, A3, 8D.
- Product or customer need is uncertain: Double Diamond, Lean Startup.
- Metric design is the main challenge: KPI design, GQM.
- Repeated incident or defect: 8D/CAPA-style corrective action with root cause verification and recurrence prevention.

The shared failure mode is metric theater: measuring what is easy, selecting vanity metrics, or treating output as outcome. Lean Startup explicitly distinguishes actionable learning from vanity metrics [8]. KPI.org similarly warns that effective KPIs must reflect the organization's unique strategy, goals, and context rather than being copied off the shelf [4].

### 6. Jazz Master's current processes cover work control better than measurable problem framing

Current process audit, 2026-07-05:

- `processes/feedback-intake.md` already captures raw observations without prematurely deciding priority.
- `processes/triage.md` already separates insights, issues, tasks, and epics, and prevents raw feedback from becoming unexamined implementation work.
- `processes/prioritization.md` already values evidence, practice-loop impact, risk reduction, leverage, and small shippable slices.
- `processes/qa-product-review.md` is the strongest existing problem-identification process. It asks whether the app is a practice loop, whether an intermediate guitarist would return, what friction exists, and what missing thing would make the current product useful.
- `processes/dev-loop.md` is strong once a task exists: claim, plan, implement, review, test, record, ship, reflect.
- `processes/knowledge-maintenance.md` already ensures research recommendations feed forward into tasks, process edits, ADRs, or explicit no-action decisions.

The gap is that measurement is not first-class. A task can be well-scoped, tested, reviewed, and shipped while still being loosely connected to a measured user or product problem. The system has good work-management hygiene, but the "problem -> measurable aim -> validated improvement" layer is implicit.

The current product-practices task (`work/tasks/TASK-007-product-practices.md`) is the natural place to absorb this research. That task already states that triage and the product half of QA review run on intuition, and it asks for researched guidance on discovery, prioritization, work-item quality, and validation.

## Recommendations

For Jazz Master and similar solo-owner + AI-agent work, adapt a compact operating model rather than adopting a heavyweight corporate method.

### Adopt

1. Add a short problem brief before solving substantial product-facing issues:
   - Symptom / signal
   - Current condition
   - Desired condition
   - Affected user or workflow
   - Evidence
   - Baseline metric or observable state
   - Target metric or target observable state
   - Owner
   - Decision deadline

   Suggested markdown:

   ```markdown
   ## Problem brief
   Current condition:
   Desired condition:
   Affected user/workflow:
   Evidence:
   Baseline:
   Target:
   How we will know it improved:
   ```

2. Convert each problem into one measurable aim:
   - "Improve X for Y users/workflow from baseline A to target B by date C."
   - Include one lagging outcome metric and one or two leading/process indicators.

3. Make product-facing work distinguish output from outcome:
   - Output: what will be built or changed.
   - Outcome: what user behavior, product state, or workflow quality should improve.
   - Evidence: why this is worth doing now.
   - Metric or verification signal: how the improvement will be recognized.

4. Use DMAIC-lite for implementation tasks:
   - Define: problem, scope, user, target.
   - Measure: baseline and reproduction.
   - Analyze: likely cause, evidence, alternatives.
   - Improve: smallest tested fix.
   - Control: regression test, check command, docs/log update.

5. Use Double Diamond / Lean Startup when the problem is user-value uncertainty:
   - Discover from notes, product review, user feedback, or observed friction.
   - Define the user problem before filing tasks.
   - Test small changes rather than building broad feature sets.

6. Use GQM when metrics are ambiguous:
   - Goal: what decision or improvement matters?
   - Question: what would we need to know?
   - Metric: what evidence answers it?

7. Feed this research into `TASK-007-product-practices.md`:
   - Add problem-framing guidance to the future `processes/product-practices.md`.
   - Update `work/README.md` task/insight templates with the problem brief or a trimmed variant.
   - Update `processes/triage.md` so accepted insights require enough problem framing before they become tasks.
   - Update `processes/qa-product-review.md` so its findings include baseline/target thinking where practical.

### Adapt

- Balanced Scorecard is useful as a mental model, but too heavy for this project as a full process. Adapt its balance: do not measure only engineering output; include user learning, practice effectiveness, quality, and maintainability.
- A3 is useful for complex decisions or recurring problems. Keep it as a one-page markdown structure, not a literal A3 artifact.
- 8D is overkill for normal product work, but useful for serious recurring defects where containment, root cause verification, and recurrence prevention matter.
- A standalone `processes/problem-framing.md` may be worthwhile if the product-practices doc becomes too broad, but the first attempt should probably keep the rule near triage/task creation so agents actually use it.

### Skip

- Full Six Sigma bureaucracy, certification roles, and months-long project structures. The useful part here is the disciplined DMAIC sequence, not the organizational overhead.
- Off-the-shelf KPI catalogs. They risk creating metrics that look professional but do not drive better product decisions.
- Full Balanced Scorecard, OKR rollout, RICE spreadsheet, or formal metric hierarchy for the current repo. The overhead would likely exceed the value until there is more real user feedback.

### Suggested process changes to consider

These are deliberately small enough for a solo-owner + AI-agent workflow:

1. `work/README.md`: add optional `## Problem brief` to task and insight templates, required only for product-facing work or ambiguous problem statements.
2. `processes/triage.md`: before accepting an insight into a task, ask whether the current condition, desired condition, affected workflow, and evidence are clear. If not, keep it as an insight or note rather than fabricating implementation work.
3. `processes/prioritization.md`: keep the current evidence/risk criteria, but prefer work with a measurable aim over equally sized work with only an output description.
4. `processes/qa-product-review.md`: when filing a product friction insight, include a baseline observation and candidate target state when the review produced enough evidence.
5. `processes/dev-loop.md`: during plan, product-facing tasks should restate the measurable aim and identify the verification signal before implementation.

Example task framing:

```markdown
## Goal
Let the owner complete a guided practice run and find it in history after refresh.

## Problem brief
Current condition: practice runs are not visible as durable progress after completion.
Desired condition: a completed run appears in history and survives refresh.
Affected user/workflow: owner completes daily guided practice and reviews progress.
Evidence: current goals call for an end-to-end guided practice loop with history.
Baseline: no persisted session appears after a run.
Target: one completed session appears in history with date, lesson, and self-grade.
How we will know it improved: manual run completion plus refresh shows the session.
```

## Sources

[1] Design Council, "The Double Diamond" — https://www.designcouncil.org.uk/resources/the-double-diamond/ (accessed 2026-07-05)

[2] Lean Enterprise Institute, "A3 Report" — https://www.lean.org/lexicon-terms/a3-report/ (accessed 2026-07-05)

[3] Institute for Healthcare Improvement, "Model for Improvement" — https://www.ihi.org/library/model-for-improvement (accessed 2026-07-05)

[4] KPI.org / Balanced Scorecard Institute, "What Is a Key Performance Indicator (KPI)?" — https://www.kpi.org/KPI-Basics/ (accessed 2026-07-05)

[5] Balanced Scorecard Institute, "Balanced Scorecard Basics" — https://balancedscorecard.org/bsc-basics-overview/ (accessed 2026-07-05)

[6] Victor Basili et al., "GQM+Strategies: A Comprehensive Methodology for Aligning Business Strategies with Software Measurement" — https://arxiv.org/abs/1402.0292 (submitted 2014-02-03; conference reference 2007; accessed 2026-07-05)

[7] ASQ, "DMAIC Process: Define, Measure, Analyze, Improve, Control" — https://asq.org/quality-resources/dmaic (accessed 2026-07-05)

[8] Eric Ries / The Lean Startup, "Methodology" — https://theleanstartup.com/principles (accessed 2026-07-05)
