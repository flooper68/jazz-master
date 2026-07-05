---
id: RES-011
title: Product practices for solo-owner + AI-agent software work
status: complete
task: TASK-007
created: 2026-07-06
stale_when: >
  Jazz Master has regular external users, a collaborator/PR workflow, production
  analytics, or enough shipped product reviews that local evidence should replace
  generic product-practice guidance.
---

# RES-011 - Product practices for solo-owner + AI-agent software work

## Research questions

1. Which lightweight prioritization methods survive at solo scale?
2. What makes a work item good enough for implementation by AI agents?
3. What validation cadence is appropriate before this practice app has many users?
4. How should a small project manage an idea inbox without building every plausible idea?
5. What human+AI product failure modes should the process counter?

## Findings

### 1. Prioritization should be explicit, but scoring should stay advisory

The Scrum Guide makes product value and ordering explicit: the Product Owner is
accountable for communicating the Product Goal, creating clear backlog items, and
ordering them. It also defines the Product Backlog as an emergent ordered list of
work needed to improve the product, with items refined until they are small and
clear enough to select [1].

RICE is useful because it separates reach, impact, confidence, and effort, and
specifically uses confidence to temper exciting but weakly supported ideas [2].
However, its own guidance says the score should not be treated as an absolute
rule: dependencies, table-stakes work, and deliberate tradeoffs can justify doing
lower-scoring work first [2].

Shape Up is a useful counterweight for solo work because it starts from appetite
and shaped scope rather than estimating every idea in a large backlog. Its shaping
ingredients include problem, appetite, solution, risks, and explicit no-gos; its
betting guidance asks whether the problem matters, the appetite is right, the
solution is attractive, and the timing is right [3].

For Jazz Master, a full RICE spreadsheet is too heavy while the owner is the only
known user and there are few usage metrics. The durable practice is the decision
structure: goal fit, user/practice-loop impact, evidence, confidence, size, and
dependency order. Numeric scoring should be reserved for cases where several
similarly sized options remain after the existing prioritization process.

### 2. Good work items are outcome-oriented, small, testable, and bounded

Agile Alliance summarizes INVEST as a checklist for user-story quality:
independent, negotiable, valuable/vertical, estimable, small, and testable [4].
Bill Wake's original formulation also distinguishes stories from SMART tasks,
where implementation tasks should be specific, measurable, achievable, relevant,
and time-boxed [5].

The Scrum Guide reinforces that backlog items become selectable only after
refinement gives them enough transparency, such as description, order, and size
[1]. RES-008 adds the missing product framing for this repo: current condition,
desired condition, affected workflow, evidence, baseline, target, and how
improvement will be known [6].

RES-005 adds the agentic-coding constraint: ambiguous work should be grilled
before building, implementation should proceed in tracer-bullet vertical slices,
and reviews should split spec-fit from standards-fit [7].

For Jazz Master, a good product-facing task is not just "build X." It says which
practice behavior or product state should improve, why now, what is out of scope,
and how a reviewer can tell it worked without guessing.

### 3. Validation should be small, repeated, and tied to product outcomes

Opportunity Solution Trees start from a desired outcome, map customer needs and
pain points, explore solutions, and test assumptions before committing to a build
[8]. Product Talk's guidance explicitly says an OST needs a target customer,
value proposition, clear outcome, and three to four story-based customer
interviews before it has good inputs [8].

Nielsen Norman Group's classic usability-testing advice favors repeated small
tests over one large study: test with a handful of users, fix what is found, and
test again. The important solo-builder lesson is not the exact number; it is that
zero users gives zero signal, and repeated rounds reduce the risk of documenting
weaknesses without improving the design [9].

Lean Startup, already cited in RES-008, uses the same product-learning shape:
build the smallest version that tests an assumption, measure actionable response,
and decide whether to persevere or change direction [6].

For Jazz Master, validation should begin with the owner dogfooding practice flows
and then move to lightweight sessions with a few guitarists when the guided
practice loop exists. Until then, product review findings should mark which
assumptions were only self-reviewed and which need external signal.

### 4. Idea inboxes need aging and kill criteria

Shape Up argues against treating a backlog as a permanent obligation list; the
notable lesson for this repo is that important ideas can be rediscovered from
current goals, user evidence, and product pain rather than preserved forever as
stale implementation promises [3].

Scrum's Product Backlog is emergent and ordered, not a static archive [1]. RES-006
already gives this project a knowledge-maintenance rhythm; RES-008 adds that
vague symptoms should remain raw material until they have enough current
condition, desired condition, workflow, and evidence to become work [6].

For Jazz Master, insights can remain cheap to file, but "new" should not mean
"accepted someday." A triage pass should either accept, reject, or leave a dated
deferral note that names the missing evidence and the revisit trigger. Repeatedly
deferred, goal-irrelevant, or solution-only insights should be rejected so they
stop distorting prioritization.

### 5. Human+AI product work tends to over-produce plausible outputs

RES-005's agentic-workflow findings are directly relevant to product practice:
agents are good at producing coherent artifacts quickly, so the risk is not lack
of output but excess plausible work that is not tied to a validated problem [7].
RES-008 names the matching organizational failure mode as metric theater and
solution jumping: measuring what is easy, building outputs instead of outcomes,
or selecting countermeasures before the current condition is understood [6].

The practical countermeasures are process-level: require problem framing before
accepting product work, prefer measurable aims, keep tasks small and bounded,
force discoveries into insights/issues instead of scope creep, and run product
review as an observation process rather than a fix-it session.

## Recommendations

1. Create `processes/product-practices.md` as the product operating model. It
   should define the product decision loop, prioritization rules, work-item
   quality bar, validation expectations, and idea-inbox aging.
2. Keep the existing prioritization process as the default. Add RICE-like
   scoring only as an optional tie-breaker when several goal-relevant candidates
   are otherwise comparable and evidence is strong enough to score confidence.
3. Require product-facing tasks to satisfy a compact bar: clear current and
   desired condition, affected workflow, evidence, baseline/target or observable
   before/after state, out-of-scope boundary, and verification signal.
4. Add explicit insight-aging rules to triage: dated deferral notes, revisit
   triggers, and rejection for stale solution-only or goal-irrelevant ideas.
5. Upgrade QA/product review so each product finding records practice-loop
   impact, current baseline, candidate target, and whether it needs dogfooding,
   external user validation, or direct implementation.
6. Use owner dogfooding as the first validation source, but mark it honestly as
   single-user evidence. Once the guided practice loop works, recruit three to
   five target guitarists for repeated lightweight sessions before expanding
   product surface area.
7. Preserve human judgment at the product boundary: agents can propose tasks and
   process changes, but acceptance/rejection of insights remains owner-confirmed
   unless the owner explicitly authorizes autonomous triage.

## Considered and rejected

- Full RICE spreadsheet for every task: rejected. It creates false precision
  while user reach and impact are mostly unknown. Keep the factors, not the
  ceremony.
- ICE scoring: rejected for now. It is simpler than RICE, but this repo already
  has a qualitative prioritization process, and confidence is the main useful
  scoring concept to preserve.
- Full Shape Up cycles: rejected. The repo's task system and trunk-based dev loop
  are already the operating cadence; adopt appetite, boundaries, and no-gos
  without replacing the tracker.
- Treat every insight as backlog: rejected. Cheap capture is good; obligation
  creep is not.
- External validation before every task: rejected. Early foundation and tooling
  work can proceed from strategy. External validation becomes important for
  user-value uncertainty and before broadening practice features.

## Sources

[1] Scrum Guide - https://scrumguides.org/scrum-guide.html (2020 edition, accessed 2026-07-06)

[2] Intercom, "RICE: Simple prioritization for product managers" - https://www.intercom.com/blog/rice-simple-prioritization-for-product-managers/ (published 2018-01-05, accessed 2026-07-06)

[3] Ryan Singer / Basecamp, "Shape Up" - https://basecamp.com/shapeup (accessed 2026-07-06)

[4] Agile Alliance, "INVEST" - https://agilealliance.org/glossary/invest/ (accessed 2026-07-06)

[5] Bill Wake, "INVEST in Good Stories, and SMART Tasks" - https://xp123.com/invest-in-good-stories-and-smart-tasks/ (updated 2023-03-27, accessed 2026-07-06)

[6] RES-008, "Organizational problem identification, measurement, and solving frameworks" - research/RES-008-organizational-problem-identification-measurement-solving-frameworks.md (created 2026-07-05)

[7] RES-005, "Matt Pocock's recent agentic coding workflow patterns" - research/RES-005-matt-pocock-agentic-coding-workflow.md (created 2026-07-05)

[8] Product Talk, "Opportunity Solution Trees" - https://www.producttalk.org/opportunity-solution-trees/ (published 2023-12-06, accessed 2026-07-06)

[9] Nielsen Norman Group, "Why You Only Need to Test with 5 Users" - https://www.nngroup.com/articles/why-you-only-need-to-test-with-5-users/ (published 2000-03-18, accessed 2026-07-06)
