# Process: product practices

Product practice for Jazz Master: a solo owner directing AI agents toward a
useful jazz-practice app. Use this when writing tasks, triaging insights,
running product review, or choosing between plausible next features.

## Operating model

Work moves through this loop:

1. **Observe** - notes, QA/product reviews, dogfooding, user feedback, research.
2. **Frame** - current condition, desired condition, affected workflow, evidence,
   baseline, target, and how improvement will be known.
3. **Choose** - prioritize against strategy, practice-loop impact, evidence,
   risk, size, leverage, and measurable aim.
4. **Ship** - one small vertical slice through `processes/dev-loop.md`.
5. **Learn** - product review and usage/dogfooding decide whether to deepen,
   adjust, reject, or file follow-up work.

This is intentionally lighter than formal roadmap management. The product system
should prevent plausible scope from becoming work unless it is tied to a user
problem, product goal, or explicit risk-reduction bet.

## Prioritization

Default to `processes/prioritization.md`. Its ordering is authoritative:
blockers, owner instruction, dependencies, then practice-loop impact, current
goal, evidence, risk reduction, size, leverage, and measurable aim.

Use a RICE-like comparison only as a tie-breaker when several candidates are
otherwise comparable:

| Factor | Solo-scale interpretation |
|---|---|
| Reach | Which workflows or users are affected now? For this app, owner practice loops count, but mark them as single-user evidence. |
| Impact | How much would the work improve practice, feedback, return motivation, or learning? |
| Confidence | How strong is the evidence: strategy only, dogfooding, QA review, external user feedback, research, or reproduced defect? |
| Effort | Can it ship in one focused session? What dependency or review cost does it add? |

Do not turn this into a spreadsheet by default. If the numbers are mostly made
up, write the uncertainty instead and prefer a research spike, dogfood session,
or smaller task.

## Work-item quality bar

Product-facing tasks should satisfy this before implementation:

- **Outcome before output:** the task says what user behavior, product state, or
  workflow quality should improve, not only what will be built.
- **Problem brief present:** current condition, desired condition, affected
  workflow, evidence, baseline, target, and verification signal are clear.
- **Small and vertical:** the task can ship in one session and touches the
  smallest end-to-end path that proves the behavior.
- **Bounded:** out-of-scope items, risks, and no-gos are explicit when ambiguity
  could cause scope creep.
- **Testable:** acceptance criteria are objective; verification is executable by
  a future agent without relying on taste or memory.
- **Traceable:** source insight, issue, note, research, or strategy context is
  linked in frontmatter or Context.

If a task fails this bar, do not implement it yet. Improve the task, split it,
run research, run a QA/product review, or ask the owner for the missing product
decision.

## Validation

Validation scales with uncertainty:

| Situation | Minimum signal |
|---|---|
| Strategy/foundation work | Link to current goal, ADR, or enabling epic; normal dev-loop verification is enough. |
| Product flow for owner use | Owner dogfooding or QA/product review can be the first signal; label it as single-user evidence. |
| Unclear user value | File or run a small discovery step before implementation: interview, prototype, or product review. |
| Broadening a practice surface | After the guided practice loop exists, test with 3-5 target guitarists in repeated small sessions before expanding heavily. |
| Hard technical/user-risk bet | Research or spike first; record the decision in research/ADR/work before UI build-out. |

Validation is not a separate ceremony for every small task. It is a guard against
building reference material or polished workflows that do not make a guitarist
practice, get feedback, or return tomorrow.

## Idea inbox aging

Insights are cheap to file, but they are not a permanent promise to build.
During triage:

- Accept an insight only when the problem framing is clear enough to create a
  task or propose an epic.
- Defer an insight by leaving `status: new` and adding a dated note that states:
  missing evidence, revisit trigger, and what would change the decision.
- Reject an insight when it is solution-only, no longer aligned with current
  goals, duplicated by existing work, or still lacks evidence after two triage
  passes or roughly 60 days.
- Prefer deleting obligation, not history: rejected insights stay searchable
  with a reason.

Important ideas can return through fresh evidence. Keeping a stale insight open
because it once sounded useful makes prioritization worse.

## Product review standard

`processes/qa-product-review.md` is the main product-learning mechanism. Product
review should ask:

- Is the product more likely to produce practice, feedback, and return use?
- What current condition did the review observe?
- What target state would make the workflow meaningfully better?
- Is the evidence dogfooding, external user signal, reproduced behavior, or
  research?
- Does the finding need direct implementation, triage, discovery, or rejection?

Review observes and files. It does not fix. Fixes go through the dev loop so
scope, review, tests, tracker updates, and shipping remain tied together.

## Human + AI guardrails

AI agents can generate convincing tasks, docs, and UI quickly. The product
guardrails are:

- Do not invent work; discoveries become notes, insights, issues, or tasks
  through the documented processes.
- Do not let output volume substitute for evidence.
- Split ambiguous work before building.
- Keep owner confirmation for accepting/rejecting insights unless explicitly
  pre-authorized.
- Review product work for spec fit and standards fit before shipping.

## Research disposition

RES-008 is applied as follows:

- **Adopted:** problem briefs for product-facing tasks; output vs outcome
  distinction; measurable aims; baseline/target thinking in QA findings; GQM
  when the right metric is unclear.
- **Adapted:** DMAIC-lite becomes the repo's observe/frame/choose/ship/learn
  loop and the dev-loop plan/check discipline rather than a separate template;
  Double Diamond and Lean Startup become the validation guidance for uncertain
  user value rather than a mandatory discovery phase for every task.
- **Rejected for now:** full Balanced Scorecard, full Six Sigma/8D ceremony, and
  off-the-shelf KPI catalogs because they would add process weight before the
  app has enough users or product data.
- **Deferred:** a standalone problem-framing process. The guidance stays in
  this file, `work/README.md`, triage, prioritization, QA review, and dev-loop
  until repetition proves a separate process would reduce friction.

## Research basis

- `research/RES-008-organizational-problem-identification-measurement-solving-frameworks.md`
- `research/RES-011-product-best-practices.md`
