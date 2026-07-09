---
apss_version: "0.1"
id: jazz-master.quality
name: Product and delivery quality
status: proposed
parent: jazz-master

problem: A shipped increment can satisfy its implementer while containing defects, unsafe behavior, architectural drift, regression risk, or poor product usability.
vision: Jazz Master changes receive independent, risk-proportionate evidence about correctness, safety, usability, and regression before and after shipping.
goals:
  - Independently verify each delivery increment at the cheapest meaningful layer.
  - Maintain and exercise product-level regression, QA, and security coverage.
strategy: Combine independent diff review, automated tests/build, triggered browser regression, product QA, and security review while filing every finding.

roles:
  owner: [product owner]
  operators: [independent review agents, QA agents, automated test tools]
  consumers: [jazz-master.delivery, jazz-master.portfolio, product owner]
  validators: [independent review agent distinct from the quality operator, product owner]
  adaptation_approvers: [product owner]

inputs:
  - Delivery diffs and artifacts, work-item contracts, architecture, risks, prior regressions, and product behavior.

artifact:
  primary: A reproducible quality verdict with verification evidence and routed findings.
  medium: informational
  supporting:
    - Automated test/build results, review findings, QA reports, security findings, and regression-pack state.
  consumers: [jazz-master.delivery, jazz-master.portfolio, product owner]
  intended_outcome: Incorrect, unsafe, unusable, or regressive changes are prevented, fixed, or made visible before they harm users or future work.

planning:
  process: processes/testing-strategy.md
  plan: work/tasks/
  log: work/tasks/
  record_model: Scheduled quality tasks contain durable plans and execution Logs; work/REGRESSION.md and work/reviews/ are quality artifacts/evidence rather than substitutes for the work record.

execution:
  process: processes/code-review.md
  invocation: Every delivery increment, explicit QA/regression request, or risk trigger for security and browser coverage.

validation:
  artifact: A second independent reviewer checks that the verdict covered the stated contract, applicable standards and risks, that commands actually passed, and that findings were fixed or filed.
  outcome: Escaped defects, repeat findings, regression detection, and user-impact evidence should show whether quality work reduces harm; no quality-learning compilation currently measures this.

streams:
  - id: change-evidence
    purpose: Verify the current artifact against its contract and applicable standards.
    source: Git diff, task acceptance criteria, codebase tests/build, architecture, and process rules.
    access: Inspect locally, run commands, and retain results in the task or review report.
    consumed_by: processes/code-review.md
    grill: null
  - id: field-and-regression-evidence
    purpose: Detect problems visible only in integrated use, repeated runs, or later feedback.
    source: work/REGRESSION.md, work/reviews/, work/issues/, notes/, browser console/network, and user feedback.
    access: Preserve reports and filed findings in git; link raw evidence where external.
    consumed_by: processes/qa-product-review.md
    grill: processes/grilling.md

uncertainty:
  discussion: Grill the owner on risk acceptance or product-quality trade-offs; question implementers about unclear intent without accepting self-attestation as review.
  research: Invoke jazz-master.research for unfamiliar security, testing, accessibility, or platform risks.
  experimentation: Run unit/component/integration/e2e tests, browser probes, responsive/a11y exploration, fault injection, or security checks appropriate to the risk.

learning:
  compilation_process: processes/regression-testing.md
  compiled_knowledge: wiki/project/quality-loops.md
  changelog: architecture/LOG.md
  adaptation_process: processes/testing-strategy.md
  implementation_state: gap

authority:
  execution: Quality operators may inspect, test, report, and require fixes under accepted gates; the owner accepts residual product risk and process adaptation.
  adaptation: human-approved

health:
  - Required review and checks run before every push.
  - Triggered regression and security coverage is scheduled and visible.
  - Findings are fixed or filed, never silently dropped.

relations:
  feeds: [jazz-master.delivery, jazz-master.portfolio, jazz-master.product-learning]
  verifies: [jazz-master.delivery, jazz-master]
  verified_by: [jazz-master.governance]
  invokes: [jazz-master.research, jazz-master.product-learning]
  depends_on: []
  scheduled_by: [jazz-master.portfolio, jazz-master.delivery]
  governed_by: [jazz-master.governance]
  improves: [jazz-master.delivery]
---

# Product and delivery quality

## Boundary

Quality owns independent evidence and the verdict, not implementation of the
change or its product strategy. It qualifies as a system because it produces a
distinct artifact consumed by delivery/portfolio, owns multiple recurring
evidence streams, and must learn across releases. Individual test layers,
review, QA, regression, and security remain processes inside this boundary.

## Complete loop

Quality selects coverage from risk and contract, runs independent review and
checks, inspects integrated behavior when triggered, issues a verdict, and
routes every finding. Later escaped defects and repeat findings should be
compiled into quality knowledge and adapt future coverage, gates, and process.

## Artifact contract

The artifact is a reproducible verdict, not the test suite or a green command
alone. Correctness means the verdict accurately represents executed evidence
and applicable risks. Effectiveness means quality work prevents or exposes
meaningful harm; a large passing test count is not outcome proof.

## Learning and adaptation

The regression pack compiles scenarios and wiki pages explain quality loops,
but no process compiles defect escapes, flaky/missed coverage, repeated review
findings, or detection value into explicit testing-system adaptation.

## Relationships

Quality is a peer directly under the root so delivery does not own the
lifecycle of its verifier. Delivery invokes it; portfolio schedules broader
reviews; product learning supplies field evidence; governance audits adherence.

## Open design gaps

- **JM-GAP-09 — testing-system learning is incomplete.** New regressions can
  add scenarios, but there is no regular evidence-to-knowledge-to-test-strategy
  loop for escapes, false confidence, flaky checks, or repeated findings.
- **JM-GAP-10 — quality outcome validation is undefined.** No threshold or
  cadence tracks whether quality work reduces meaningful escaped defects or
  rework.
- **JM-GAP-11 — independent lifecycle ownership is provisional.** Quality is a
  root child to preserve independence from delivery, although the same owner
  ultimately approves both.
- **JM-GAP-21 — planning records are not capsule-local.** Quality uses the
  shared task registry until TASK-079 creates its accepted PLAN/LOG contract.

## Open questions (deferred grill)

1. Should quality remain a root-level peer of delivery for independent
   lifecycle ownership, or should delivery own it with a stronger verifier
   relation and separation-of-operator rule?
2. Which repeat signal should force quality adaptation: any escaped regression,
   a repeated finding pattern, or a cadence-based review of all evidence?
3. What escaped-harm or rework signal and review cadence should validate that
   quality work is effective rather than merely busy?
4. Should shared plans/logs remain a supported long-term model, or must quality
   adopt capsule-local PLAN/LOG records before activation?
