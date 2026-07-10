---
apss_version: "0.1"
id: jazz-master.delivery
name: Product delivery
status: proposed
parent: jazz-master

problem: Accepted work must become a coherent, tested, reviewable, deployed product increment without losing tracker, architecture, or operational context.
vision: Every accepted increment is small, resumable, standards-conforming, reviewed, verified, and shipped with its operating record.
goals:
  - Turn each actionable work item into one pushed increment.
  - Preserve code, tracker, architecture, and knowledge consistency throughout delivery.
strategy: Use the dev loop, development standards, isolated git shipping, appropriate tests, and independent quality participation.

roles:
  owner: [product owner]
  operators: [AI implementation agents]
  consumers: [Jazz Master users, product owner, jazz-master.product-learning]
  validators: [independent review agent, jazz-master.quality, product owner]
  adaptation_approvers: [product owner]

inputs:
  - Actionable work items selected by jazz-master.portfolio.
  - Product direction, architecture, compiled knowledge, code, and quality standards.

artifact:
  primary: A pushed Jazz Master product or operating-model increment with its tracker and architectural record.
  medium: digital
  supporting:
    - Tests, task verification evidence, commit, and deployment result when applicable.
  consumers: [Jazz Master users, product owner, jazz-master.product-learning]
  intended_outcome: Accepted work becomes usable capability safely and predictably while the repository remains operational for the next agent.

planning:
  process: processes/dev-loop.md
  plan: work/tasks/
  log: work/tasks/
  record_model: Each claimed delivery task contains its durable plan and append-only execution Log; work/tasks/ is the current shared registry for those records.

execution:
  process: processes/dev-loop.md
  invocation: A dependency-ready task or confirmed issue is claimed through the dev loop.

validation:
  artifact: Independent review, work-item verification, bun run --cwd codebase check, and git ship-state checks validate the increment.
  outcome: Product learning and QA observe whether the shipped capability solves its stated user or project problem; delivery currently compiles little evidence about whether its own process improves across tasks.

streams:
  - id: work-and-code
    purpose: Supply the accepted contract, current implementation, architectural constraints, and prior delivery history.
    source: work/tasks/, work/issues/, codebase/, architecture/, git history, and wiki/.
    access: Read from the checkout and append execution evidence to the work-item log.
    consumed_by: processes/dev-loop.md
    grill: processes/grilling.md
  - id: verification-and-review
    purpose: Expose correctness failures, process misses, and reusable delivery lessons.
    source: Command output, independent review, work/reviews/, issues, and architecture/LOG.md.
    access: Fix or file findings and retain material results in the task log.
    consumed_by: processes/dev-loop.md
    grill: null

uncertainty:
  discussion: Use processes/grilling.md for load-bearing owner decisions and focused collaborator questions.
  research: Invoke jazz-master.research when existing knowledge cannot safely guide implementation.
  experimentation: Use tests, prototypes, benchmarks, spikes, browser checks, and deployment probes appropriate to the task.

learning:
  compilation_process: processes/dev-loop.md
  compiled_knowledge: wiki/project/lifecycle-of-a-change.md
  changelog: architecture/LOG.md
  adaptation_process: processes/development-practices.md
  implementation_state: gap

authority:
  execution: Agents may implement accepted work within its contract and repository rules; scope expansion and strategy changes require owner authority.
  adaptation: human-approved

health:
  - bun run --cwd codebase check is green before push.
  - Work is independently reviewed and its verification executed.
  - No delivery-owned changes remain uncommitted or unpushed at handoff.

relations:
  feeds: [jazz-master, jazz-master.product-learning, jazz-master.knowledge]
  verifies: []
  verified_by: [jazz-master.quality, jazz-master.product-learning]
  invokes: [jazz-master.quality, jazz-master.research, jazz-master.knowledge]
  depends_on: [jazz-master.direction, jazz-master.portfolio]
  scheduled_by: [jazz-master.portfolio]
  governed_by: [jazz-master.governance]
  improves: []
---

# Product delivery

## Boundary

Delivery owns producing and shipping accepted increments. It does not choose
product direction, own the shared portfolio, independently certify quality, or
decide whether users achieved the intended product outcome. Its recurring
artifact, specialist processes, resumable work logs, and adaptation needs make
it an independent system.

## Complete loop

An agent claims ready work, records a plan, resolves uncertainty, implements a
small increment with tests, requests independent review, runs all verification,
records the result, commits, rebases, pushes, and reflects. Quality evidence and
later product learning should feed reusable delivery knowledge and adaptation
of the next run.

## Artifact contract

The artifact is the pushed increment together with synchronized tracker and
architecture state. Passing checks proves conformance to its contract; it does
not prove that the feature improves guitar practice or that the delivery method
is becoming more effective.

## Learning and adaptation

Task logs and `architecture/LOG.md` retain notable events, and processes change
when a miss is noticed. There is no explicit compilation step that revisits
delivery failures and successful resolutions across tasks, turns patterns into
knowledge, and verifies their use in the next run.

## Relationships

Portfolio schedules delivery; direction bounds it; quality independently
verifies it; product learning evaluates consumer effects; research and
knowledge are invoked as shared systems.

## Open design gaps

- **JM-GAP-07 — dev-loop learning is incomplete.** Retrospectives are optional
  prose inside tasks; recurring problems and successful resolutions are not
  systematically compiled into delivery knowledge or traced to a later process
  adaptation.
- **JM-GAP-08 — delivery outcome measures are absent.** The project does not
  compile lead time, rework, rollback, or escaped-contract data, so improvement
  of the delivery system itself is anecdotal.
- **JM-GAP-11 — quality lifecycle placement is provisional.** Quality is a
  root peer rather than delivery-owned so the verifier retains lifecycle
  independence.
- **JM-GAP-21 — planning records are not capsule-local.** Delivery uses the
  shared task registry. The retired TASK-079 migration would have created a
  capsule-local PLAN/LOG contract, but no replacement is currently planned.

## Open questions (deferred grill)

1. Which delivery evidence is worth compiling without turning a solo project
   into metric ceremony: reusable incidents only, lightweight flow measures,
   or both?
2. Should quality remain a root-level peer of delivery, or should delivery own
   it with a stronger operator-separation rule?
3. Should shared plans/logs remain a supported long-term model, or must delivery
   adopt capsule-local PLAN/LOG records before activation?
