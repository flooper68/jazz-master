---
id: NOTE-002
title: Work-status visibility — report over archiving (grill session)
created: 2026-07-06
source_type: grill-session
participants: [owner, agent]
processed: true
---

# NOTE-002 — Work-status visibility — report over archiving (grill session)

## Context

The owner raised a setup problem: it is not clear which tasks are active vs finished, what work is in flight, and there is no way to get a report of what is happening. Agent assessment established the facts: frontmatter `status:` is well-maintained across all ~60 work items (it IS the source of truth), but nothing aggregates it; the only digest (`work/HEARTBEAT.md`) is a point-in-time ledger whose "Next up" was already stale hours after the first beat (all three recommended tasks had shipped); and three real states are inexpressible in the status vocabulary, hiding in prose or YAML comments instead.

The owner then proposed adding `archived/` subfolders under `work/tasks|insights|issues` to move terminal-status items out of the active directories. That proposal triggered this grill.

## Discussion

1. **Archiving vs reporting.** Grill question: given a report solves *knowing* what's active, the only marginal value of `archived/` is directory *browsing* — is the friction owner-scrolling or agent-context? Costs surfaced: physical location becomes a second representation of "done" that can drift from frontmatter; the ID-allocation convention ("list the directory for the next free one") breaks when done items leave the directory; someone has to move files, and a lazily-moved archive is worse than either extreme because the active folder can no longer be trusted. **Owner conceded: the report is enough.** Proposal rejected.
2. **Report scope.** Owner wants an "intelligent" report: what is in progress, what are the next tasks, what finished lately, what insights/issues are new, and whether pruning/heartbeat is due. Agent folded in the status-vocabulary fix (deferred insights, gated tasks, pending-confirmation tasks) since without it the day-one report misreports exactly the inbox counts the owner asked for — e.g. 8 insights shown as awaiting triage when the real number is 3.
3. **Fresh judgment vs recorded judgment.** Everything in the report is a deterministic fact except "next tasks," which is a prioritization judgment. Options grilled: (A) report shows the last heartbeat's recorded ranking, honestly aged, and flags when a new beat is due — one judge, fully deterministic; (B) report re-runs prioritization every time — always fresh, but two processes rank work and the report becomes an agent session, not a pure lookup. Agent recommended A. **Owner chose B.**

## Decisions

- **No `archived/` subfolders.** `work/` directories stay flat; frontmatter `status:` remains the single source of truth; terminal items stay in place per the existing "never deleted, searchable history" convention. Visibility is solved by a report, not by file moves.
- **Build a work-status report** covering: in-progress/blocked work, next tasks, recently finished, new insights/issues, and cadence flags (heartbeat / knowledge-pruning due).
- **The report re-runs prioritization on every run** (owner chose fresh judgment over recorded-judgment-plus-staleness-flag). The report is read-only and advisory: it schedules nothing, triages nothing, and writes no ledger. The heartbeat remains the sole process that records recommendations, schedules hygiene tasks, and runs triage — if report and ledger disagree, the report is the fresher advice, the ledger the durable record.
- **Status-vocabulary gaps are fixed in the same task** (agent recommendation, unobjected): `deferred` insight status with `revisit_when:`, a structured gating/blocked field for tasks replacing YAML comments, and a status for tasks pending owner confirmation.

## Extracted work

- `work/tasks/TASK-034` — work-status report: facts script, status-report process, status-vocabulary fixes.
