---
apss_version: "0.1"
id: jazz-master.research
name: Applied research
status: proposed
parent: jazz-master

problem: Load-bearing product, technical, quality, or operating decisions sometimes depend on external knowledge that the repository and owner do not yet have.
vision: Important unknowns become bounded, cited, decision-ready evidence that is later checked for usefulness and staleness.
goals:
  - Produce decision-ready research for explicitly framed questions.
  - Preserve sources, limitations, disposition, and stale-when triggers.
strategy: Research only when requested by a consuming system, prefer primary evidence, synthesize into RES files, and require feed-forward disposition rather than report accumulation.

roles:
  owner: [product owner]
  operators: [AI research agents]
  consumers: [all proposed Jazz Master systems, product owner]
  validators: [requesting system operator, product owner, independent review agent]
  adaptation_approvers: [product owner]

inputs:
  - A bounded research question, consumer decision, existing repository research, and authoritative external sources.

artifact:
  primary: A cited RES research report with recommendation, limitations, disposition hooks, and staleness conditions.
  medium: informational
  supporting:
    - Source links, comparison tables, and reproducible evidence where applicable.
  consumers: [requesting Jazz Master system, product owner]
  intended_outcome: The consuming system resolves its uncertainty and makes a better decision without repeatedly rediscovering the same external evidence.

planning:
  process: processes/deep-research.md
  plan: work/tasks/
  log: work/tasks/
  record_model: Each commissioned research task contains its durable plan and execution Log; research/ contains the report artifacts and corpus index.

execution:
  process: processes/deep-research.md
  invocation: A consuming system records a load-bearing question that cannot be answered safely from current evidence.

validation:
  artifact: Check question fit, source authority/recency, claim-to-source traceability, alternatives, limitations, recommendation logic, and required research format.
  outcome: The consuming work records adopt, adapt, defer, or reject and later evidence can trigger refresh; usefulness and decision effects are not compiled across reports today.

streams:
  - id: research-demand
    purpose: Keep research bounded by a real decision and consumer.
    source: Work items, open questions, grills, QA/security findings, and stale-when triggers.
    access: Link the requesting artifact and research question from the RES file.
    consumed_by: processes/deep-research.md
    grill: processes/grilling.md
  - id: external-evidence
    purpose: Supply authoritative existing knowledge relevant to the question.
    source: Primary documentation, research papers, standards, and explicitly qualified secondary sources.
    access: Retrieve through approved tools and retain citations plus relevant summaries in the RES file.
    consumed_by: processes/deep-research.md
    grill: null
  - id: research-disposition
    purpose: Learn whether recommendations were used, helpful, contradicted, or stale.
    source: Consuming tasks, ADRs, process changes, later research, and product/delivery evidence.
    access: Follow bidirectional links and Outcome addenda in retained research.
    consumed_by: processes/knowledge-maintenance.md
    grill: processes/grilling.md

uncertainty:
  discussion: Grill the requesting owner/system to bound the decision and clarify evidence needs before broad searching.
  research: Use processes/deep-research.md to retrieve, compare, cite, and synthesize existing evidence.
  experimentation: Hand questions requiring new evidence back to the consuming system for a spike, benchmark, prototype, user trial, or formal test; research does not relabel new experimentation as literature evidence.

learning:
  compilation_process: processes/knowledge-maintenance.md
  compiled_knowledge: research/
  changelog: architecture/LOG.md
  adaptation_process: processes/deep-research.md
  implementation_state: partial

authority:
  execution: Research agents may collect and synthesize evidence within the scoped question; consuming-system and product decisions remain with their declared approvers.
  adaptation: human-approved

health:
  - Claims are traceable to appropriate sources and limitations are explicit.
  - Research has a consuming decision and an outcome disposition.
  - Triggered stale-when conditions are visible and routed.

relations:
  feeds: [jazz-master.direction, jazz-master.portfolio, jazz-master.delivery, jazz-master.quality, jazz-master.product-learning, jazz-master.governance, jazz-master.knowledge, jazz-master]
  verifies: []
  verified_by: [jazz-master.governance]
  invokes: []
  depends_on: []
  scheduled_by: [jazz-master.portfolio]
  governed_by: [jazz-master.governance]
  improves: []
---

# Applied research

## Boundary

Research owns synthesis of existing external evidence into a decision-ready
report. It does not own the consuming decision or experimentation that creates
new product/domain evidence. It is proposed as independent because it has a
stable artifact contract, specialist validation, retained corpus, staleness
loop, and multiple consuming systems. A small source lookup remains a capability
inside another system and need not invoke this full loop.

## Complete loop

A consuming system frames a bounded question and decision. Research checks the
existing corpus, gathers authoritative sources, synthesizes alternatives and
limitations, independently validates the report, and hands it back for an
explicit disposition. Later use, contradiction, and stale-when evidence should
compile into research-method and corpus adaptation.

## Artifact contract

The primary artifact is the cited RES report. Correctness means claims and
recommendations follow from relevant, authoritative evidence with limitations.
Effectiveness means the consumer resolves uncertainty and makes a better
decision; a long, well-cited report that is unused fails that outcome.

## Learning and adaptation

Research files retain Outcome addenda and staleness triggers, and knowledge
maintenance routes triggered work. The corpus lacks a compiled index of which
methods/sources produced useful recommendations or where research did not
change the decision.

## Relationships

Every child may invoke or consume research, but demand must name its owner and
decision. Research feeds those systems without taking lifecycle ownership of
their questions.

## Open design gaps

- **JM-GAP-18 — research effectiveness is not compiled.** Individual reports
  can record disposition, but the system does not synthesize adoption,
  contradiction, staleness, or decision value across the corpus.
- **JM-GAP-19 — independent-system threshold is provisional.** The current
  volume may not justify a separate system rather than a shared capability; the
  map proposes independence because the corpus and stale-when loop are durable.
- **JM-GAP-21 — planning records are not capsule-local.** Research uses the
  shared task registry. The retired TASK-079 migration would have created a
  capsule-local PLAN/LOG contract, but no replacement is currently planned.

## Open questions (deferred grill)

1. Should applied research remain an independent system now, or stay a
   governed capability until volume, staleness, or specialized validation
   crosses a declared threshold?
2. If research remains independent, what minimum review should compile report
   adoption, contradiction, staleness, and decision usefulness across the
   corpus?
3. Should shared plans/logs remain a supported long-term model, or must research
   adopt capsule-local PLAN/LOG records before activation?
