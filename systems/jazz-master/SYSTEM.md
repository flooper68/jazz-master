---
apss_version: "0.1"
id: jazz-master
name: Jazz Master
status: proposed
parent: null

problem: Intermediate guitarists learning jazz lack a low-friction, structured way to turn musical goals and practice history into focused daily practice with trustworthy feedback.
vision: Guitarists open Jazz Master, pick up the guitar, and complete an appropriate measurable practice session without deciding what to practice.
goals:
  - Deliver the current zero-tension guided-practice promise described by VIS-001.
  - Make product and operating feedback loops explicit before changing the repository structure.
strategy: Use owner-directed product strategy, small agent-delivered increments, independent quality checks, retained evidence, compiled knowledge, and human-approved adaptation.

roles:
  owner: [product owner]
  operators: [AI implementation agents, product owner]
  consumers: [intermediate guitarists learning jazz, product owner]
  validators: [product owner, independent review agents, target guitarists when recruited]
  adaptation_approvers: [product owner]

inputs:
  - strategy/VIS-001-jazz-master.md
  - strategy/goals.md
  - Product usage, practice results, owner feedback, QA evidence, research, and operating evidence.

artifact:
  primary: The usable Jazz Master web application.
  medium: digital
  supporting:
    - The repository operating record and system map.
  consumers: [intermediate guitarists learning jazz, product owner]
  intended_outcome: Guitarists practice jazz more consistently and improve measurable playing capability with less planning friction.

planning:
  process: processes/heartbeat.md
  plan: strategy/goals.md
  log: work/tasks/
  record_model: Root direction is planned in strategy/goals.md; relevant shared work items contain append-only execution Logs in work/tasks/ until system-local records exist.

execution:
  process: processes/dev-loop.md
  invocation: Owner request, an actionable work item, or a scheduled heartbeat recommendation.

validation:
  artifact: Code review, task verification, bun run --cwd codebase check, triggered browser regression, and QA/product review verify the application and repository increment.
  outcome: Owner dogfooding is the only recurring product-outcome signal today; repeated target-guitarist use and longitudinal practice improvement are not yet implemented.

streams:
  - id: product-and-practice-evidence
    purpose: Determine whether the product reduces practice friction and improves playing.
    source: notes/, work/reviews/, work/issues/, and future target-guitarist usage evidence.
    access: Retain native files in git and reference external observations from notes.
    consumed_by: processes/feedback-intake.md
    grill: processes/grilling.md
  - id: delivery-and-quality-evidence
    purpose: Determine whether the product and operating model are being produced correctly.
    source: Work-item logs, git history, test/build results, reviews, and architecture/LOG.md.
    access: Read the repository and command output; preserve notable results in work items and logs.
    consumed_by: processes/heartbeat.md
    grill: processes/grilling.md

uncertainty:
  discussion: Use processes/grilling.md for owner judgment and focused user discussions when available.
  research: Invoke jazz-master.research through processes/deep-research.md when existing evidence is insufficient.
  experimentation: Use product prototypes, dogfooding, target-user trials, technical spikes, and automated or browser tests appropriate to the uncertainty.

learning:
  compilation_process: processes/knowledge-maintenance.md
  compiled_knowledge: wiki/index.md
  changelog: wiki/log.md
  adaptation_process: processes/heartbeat.md
  implementation_state: partial

authority:
  execution: Agents may execute accepted work items within AGENTS.md and the applicable processes; the owner controls strategy and external product decisions.
  adaptation: human-approved

health:
  - bun run --cwd codebase check remains green before every push.
  - The actionable work queue and project knowledge remain resumable, reviewed, and pushed.
  - The owner retains strategy and adaptation authority.

relations:
  feeds: []
  verifies: []
  verified_by: [jazz-master.quality, jazz-master.product-learning]
  invokes: [jazz-master.direction, jazz-master.portfolio, jazz-master.delivery, jazz-master.quality, jazz-master.product-learning, jazz-master.governance, jazz-master.research, jazz-master.knowledge]
  depends_on: []
  scheduled_by: []
  governed_by: []
  improves: []
---

# Jazz Master

## Boundary

This root owns the product-level problem and the lifecycle of every proposed
child. It begins with the guitarist's practice problem and ends with a usable
product plus evidence about real practice outcomes. The public APSS framework,
Clerk, Cloudflare, Railway/Postgres, and users' wider musical study are outside
its control. They are inputs or operating environments, not child systems.

The root qualifies independently because it owns the product artifact and
guitarist outcome that no operational child owns. Its children solve narrower
direction, coordination, production, assurance, learning, governance,
research, and knowledge problems.

## Complete loop

The owner supplies direction; portfolio coordination chooses actionable work;
delivery produces product increments; quality validates them; product learning
captures use and feedback; research resolves selected unknowns; knowledge
compiles reusable understanding; and governance controls decisions and
adaptation. Evidence returns through heartbeat and owner judgment to the next
goals and plans. Today this loop closes strongly around artifact production but
only weakly around the guitarist outcome.

## Artifact contract

The web application is the primary artifact. A green build, reviewed commit,
or coherent repository proves artifact correctness, not musical effectiveness.
The outcome is consistent, low-friction practice that improves playing; this
requires repeated use and progress evidence distinct from engineering checks.

## Learning and adaptation

Raw product and operating evidence remains in notes, work items, reviews, git,
and research. Knowledge maintenance compiles it into the wiki and process
changes; heartbeat and owner grills can propose adaptations. Only the owner may
approve product direction, operating-system boundaries, or broader autonomy.

## Relationships

All eight proposed children have `jazz-master` as their sole parent. Quality
and product learning provide the root's two complementary validation views:
artifact/operating correctness and consumer outcome effectiveness.

## Open design gaps

- **JM-GAP-01 — product outcome validation is incomplete.** Owner dogfooding is
  single-user evidence; there is no recurring target-guitarist cohort or
  longitudinal measure for practice frequency, planning friction, or playing
  improvement.
- **JM-GAP-02 — root-level compilation is only partially implemented.** The
  wiki and maintenance processes compile project knowledge, but no explicit
  review connects all eight child outcomes to root strategy adaptation.
- **JM-GAP-03 — the hierarchy is unrun.** These declarations describe a
  proposed boundary model over current paths; no capsule has completed a full
  APSS loop in its proposed form.
- **JM-GAP-21 — child planning records are shared, not colocated.** Six children
  use `work/tasks/` for both plan and log; direction and portfolio use their
  specialized shared plans plus `work/tasks/` logs. Capsule-local
  `work/PLAN.md` and `work/LOG.md` contracts do not exist yet.

## Open questions (deferred grill)

1. Does the owner accept these eight child systems as the lifecycle boundaries,
   or should any pair be combined before migration?
2. What minimum recurring evidence should qualify Jazz Master as effective for
   target guitarists rather than merely correct and useful to its owner?
3. Should heterogeneous `work/` and `notes/` remain root-shared registries, or
   should a later item-by-item ownership audit split them across child capsules?
