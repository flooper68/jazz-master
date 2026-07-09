---
apss_version: "0.1"
id: jazz-master.knowledge
name: Knowledge stewardship
status: proposed
parent: jazz-master

problem: Product and project understanding is scattered across canonical layers and evidence, so owners and agents can repeatedly re-derive context, follow stale synthesis, or lose reusable lessons.
vision: Every operator can orient quickly from current, traceable compiled knowledge while raw evidence and canonical authority remain intact.
goals:
  - Keep the derived wiki current, traceable, concise, and navigable.
  - Detect stale/orphaned knowledge and feed durable lessons into future work.
strategy: Treat canonical repository sources as evidence, compile cross-layer synthesis into wiki pages, lint provenance and drift, and create human-facing artifacts only as derived companions.

roles:
  owner: [product owner]
  operators: [AI knowledge-maintenance agents]
  consumers: [product owner, all proposed Jazz Master systems, future agents]
  validators: [independent review agents, source-owning system operators]
  adaptation_approvers: [product owner]

inputs:
  - strategy/, processes/, architecture/, work/, notes/, research/, codebase/, git history, and system artifacts.

artifact:
  primary: A current, source-linked compiled knowledge map in wiki/.
  medium: informational
  supporting:
    - Knowledge-maintenance dispositions and human-facing derived artifacts under artifacts/.
  consumers: [product owner, all proposed Jazz Master systems, future agents]
  intended_outcome: Operators resume and decide with less re-derivation and fewer stale-context errors while canonical sources remain authoritative.

planning:
  process: processes/knowledge-maintenance.md
  plan: work/tasks/
  log: work/tasks/
  record_model: Knowledge-maintenance and artifact tasks contain their durable plan and execution Log; wiki/index.md and wiki/log.md are the compiled artifact index and changelog.

execution:
  process: processes/wiki-maintenance.md
  invocation: Shipped change to how the product/project works, completed research, scheduled knowledge sweep, explicit artifact request, or detected drift.

validation:
  artifact: Lint source paths, canonical conflicts, index coverage, staleness, duplication, navigation, and rendered output when a human-facing artifact is produced.
  outcome: Observe whether agents orient correctly with less repeated discovery and fewer stale-context mistakes; no recurring usability or re-derivation measure exists.

streams:
  - id: canonical-repository-knowledge
    purpose: Supply authoritative facts and detailed provenance for compilation.
    source: strategy/, processes/, architecture/, work/, notes/, research/, codebase/, systems/, and git history.
    access: Read repository-native sources; cite exact paths from derived knowledge.
    consumed_by: processes/wiki-maintenance.md
    grill: processes/grilling.md
  - id: knowledge-use-and-drift
    purpose: Reveal stale pages, missing context, repeated re-discovery, and ineffective presentation.
    source: Agent task logs, owner feedback, review findings, dead links, knowledge sweeps, and artifact use.
    access: File findings through work/ or update derived knowledge in the triggering commit.
    consumed_by: processes/knowledge-maintenance.md
    grill: processes/grilling.md

uncertainty:
  discussion: Grill source owners when canonical sources conflict or a synthesis choice is load-bearing.
  research: Invoke jazz-master.research when compilation requires external evidence not already retained.
  experimentation: Test navigation, retrieval tasks, generated views, or rendered artifacts with agents/owner before changing the knowledge strategy.

learning:
  compilation_process: processes/knowledge-maintenance.md
  compiled_knowledge: wiki/index.md
  changelog: wiki/log.md
  adaptation_process: processes/wiki-maintenance.md
  implementation_state: partial

authority:
  execution: Agents may compile and correct derived knowledge from canonical sources; they may not overwrite source-owner authority or edit strategy.
  adaptation: human-approved

health:
  - Derived pages cite current canonical sources and lose conflicts to them.
  - Indexes and links resolve; stale evidence is routed rather than silently discarded.
  - Compiled knowledge stays smaller and more navigable than its source corpus.

relations:
  feeds: [jazz-master.direction, jazz-master.portfolio, jazz-master.delivery, jazz-master.quality, jazz-master.product-learning, jazz-master.governance, jazz-master.research, jazz-master]
  verifies: []
  verified_by: [jazz-master.governance]
  invokes: [jazz-master.research]
  depends_on: []
  scheduled_by: [jazz-master.portfolio, jazz-master.delivery]
  governed_by: [jazz-master.governance]
  improves: [jazz-master]
---

# Knowledge stewardship

## Boundary

Knowledge stewardship owns derived synthesis, its provenance, navigation, and
maintenance. Source systems retain canonical facts and decisions. This is an
independent system because its compiled artifact serves every other system and
has a distinct drift/maintenance/adaptation loop. Artifact creation remains a
process here: it changes presentation for a human audience but does not own a
distinct recurring problem and learning loop by default.

## Complete loop

A trigger identifies changed or stale understanding. The system reads canonical
sources and raw evidence, resolves conflicts with source owners, updates/lints
the wiki or a derived artifact, records the compilation, and validates links,
provenance, and presentation. Use, drift, and re-discovery evidence should adapt
page schema, compilation cadence, or navigation.

## Artifact contract

The primary artifact is the compiled wiki map. Correctness means traceable,
current synthesis that never supersedes canonical sources. Effectiveness means
operators orient faster and make fewer stale-context errors; a complete but
unusable wiki is not successful.

## Learning and adaptation

Wiki maintenance, the append-only wiki log, and periodic knowledge sweeps form
the strongest explicit compilation loop in the current project. Outcome
evidence remains weak: the system does not measure re-derivation, retrieval
success, or errors caused by stale knowledge.

## Relationships

Every system feeds canonical evidence and consumes compiled knowledge.
Governance retains authority over rules and decisions; knowledge only
synthesizes them. Research remains the source for new external evidence.

## Open design gaps

- **JM-GAP-20 — knowledge outcome validation is missing.** There is no recurring
  evidence about agent/owner retrieval success, re-derivation cost, or
  stale-context failures.
- **JM-GAP-17 — governance versus knowledge boundary is provisional.** Shared
  use of knowledge maintenance can obscure whether a change is an authority
  decision or derived synthesis.
- **JM-GAP-21 — planning records are not capsule-local.** Knowledge stewardship
  uses the shared task registry until TASK-079 creates its accepted PLAN/LOG
  contract.

## Open questions (deferred grill)

1. What lightweight signal would prove compiled knowledge is helping—fewer
   repeated searches, successful cold-start questions, fewer stale-source
   errors, or a periodic owner/agent retrieval check?
2. Does the owner accept governance as owner of canonical decisions/rules and
   knowledge stewardship as owner only of derived synthesis when both invoke
   knowledge maintenance?
3. Should shared plans/logs remain a supported long-term model, or must
   knowledge stewardship adopt capsule-local PLAN/LOG records before
   activation?
