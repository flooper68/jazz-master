# Process: knowledge maintenance

Keeps the repo's markdown knowledge system useful by pruning stale flow items, linting links/frontmatter by inspection, and feeding research or notes into concrete next actions. This is the repo's lightweight knowledge-pruning process from `research/RES-003-karpathy-llm-wiki-skill.md` and `research/RES-006-knowledge-pruning-and-triage.md`, implemented without a separate wiki or build system.

Use this after QA reviews, after owner-requested research, after raw notes are added, when the dev loop finds no actionable work, and periodically after about ten shipped tasks. The periodic cadence is enforced by `processes/heartbeat.md`, which schedules the sweep as a task when it comes due.

## Principles

- Markdown files are the source of truth; no generated site, dashboard, or external tracker is required.
- Preserve raw sources and citations. Summaries, tasks, and ADRs link back to notes, research, reviews, or source work.
- Keep `work/` actionable. Raw context belongs in `notes/`; lifecycle-managed work belongs in `work/`.
- Keep the queue small. Accepting an idea does not automatically mean creating a task today.
- Pruning means deciding, not deleting. Close, reject, defer, merge, or link with reasons.
- Do not rewrite completed research as the new source of truth; feed recommendations forward into explicit outcomes.

## Scope

- `notes/NOTE-*` raw notes with `processed: false`
- `work/insights/INS-*` with `status: new`
- `work/issues/ISSUE-*` with `status: open` or stale `confirmed`
- `work/tasks/TASK-*` stuck or no longer aligned
- `work/epics/EPIC-*` task lists and Done-when sections
- `research/RES-*` recommendations and `stale_when`
- `architecture/overview.md`, `architecture/LOG.md`, and ADRs
- `wiki/` pages, `wiki/index.md`, and `wiki/log.md`
- `processes/`, `AGENTS.md` (canonical agent index; `CLAUDE.md` is a symlink to it), and `work/README.md`

## Steps

1. **Inventory.** List recently changed docs and all open/new/blocked flow items.
2. **Check structure.** Verify filenames, sequential IDs, frontmatter status, required sections, and obvious broken links.
3. **Process notes.** For each unprocessed note, extract issues, insights, tasks, ADR candidates, or no-action decisions. Set `processed: true` only when every action is linked or explicitly dismissed.
4. **Run triage where needed.** Use `processes/triage.md` for new insights and open issues; do not duplicate its rules here.
5. **Feed research forward.** For each completed `RES-*`, confirm every recommendation is implemented, filed, rejected, deferred, or explicitly marked no-action. If `stale_when` has triggered, file a task or insight to refresh it.
6. **Lint the wiki.** Run the lint operation from `processes/wiki-maintenance.md`: page claims vs cited sources (canonical wins), staleness vs shipped work, orphan pages and index gaps, broken references, verbatim drift. Small fixes land in this sweep's commit; larger rewrites route through the table below.
7. **Refresh epics and tasks.** Attach orphan tasks to an epic or explain why they are standalone. Update epic task lists, last-reviewed notes, and Done-when assessments.
8. **Prune the actionable queue.** Reject stale ideas with reasons, defer with a concrete revisit trigger, merge duplicates by cross-linking, and keep the next-work list small.
9. **Lint the indexes.** Deterministic pass/fail checks, run every sweep (decisions in `notes/NOTE-003`). This sweep is the only enforcement point — there is no change-time obligation, so drift between sweeps is an accepted cost, not a finding about the process.
   - **Twins:** `AGENTS.md` is the canonical agent index and `CLAUDE.md` is a symlink to it (`ls -l CLAUDE.md` → `CLAUDE.md -> AGENTS.md`). If `CLAUDE.md` is ever a regular file again, that is a defect: merge any divergent content into `AGENTS.md` and restore the symlink.
   - **Process table, both directions:** every `processes/*.md` file has a row in the "Which process, when" table in `AGENTS.md`, and every row's path exists. No exceptions — a process file not worth a row is not worth being a separate file.
   - **Cited paths exist:** every path named in `AGENTS.md` (knowledge map + process table), `work/README.md`, `research/README.md`, and `architecture/overview.md` resolves to a real file or directory.
   - **Research index:** every existing `research/RES-*.md` file has one row in `research/README.md`'s index, and every row points to an existing RES file or the documented `RES-001` known gap.
   - **ID sequences:** `ADR/RES/NOTE/INS/ISSUE/TASK/EPIC/REV` numbering has no unexplained gaps. Known gaps (verified never-created in git history, 2026-07-06): `RES-001`. (`ADR-006` was a known gap until TASK-020 filled it on 2026-07-06.) Any new gap is a finding.
   - Fixes land in this sweep's commit, like the wiki lint's small fixes.

## Routing table

Classify each source fragment before creating or updating files:

| Source fragment | Output |
|---|---|
| Product idea, opportunity, friction, or unmet user need | `INS-###` or accept/reject/defer an existing insight |
| Reproducible product defect | `ISSUE-###` |
| One-session implementation unit | `TASK-###` |
| Pillar-sized product area | propose an epic; create `EPIC-###` only when authorized |
| System-shaping technical choice | `ADR-###` or a task to write one |
| Research recommendation not yet acted on | task, process edit, ADR, or explicit no-action note |
| Durable "how it works" synthesis worth keeping current | new or updated `wiki/` page per `processes/wiki-maintenance.md` |
| Meeting discussion, owner note, feedback batch, or observation context | `NOTE-###`, with extracted work linked |
| Duplicate, stale, or no-longer-relevant item | merge/reject/wontfix/defer with reason |

## Decision outcomes

Every inspected item should end in one of these states:

- Created or linked `TASK-###`
- Created or linked `ISSUE-###`, `INS-###`, `EPIC-###`, `ADR-###`, or `RES-###`
- Rejected or `wontfix` with reason
- Deferred with revisit trigger
- No action because already covered, with link
- Needs owner decision, with the exact question recorded

## Output

- Updated docs and flow items in one knowledge-maintenance commit, usually `work: maintain knowledge <date>`.
- A short summary of priority changes, stale research, and any owner decisions needed.

## Guardrails

- Never edit `strategy/`; propose changes to the owner.
- Never delete files to prune. Terminal statuses and cross-links are the archive.
- Do not rewrite research summaries as the new source of truth; link to the original `RES-*`.
- Do not create tasks for every accepted idea. Create tasks only when they are useful next work or unblock planned work.
- High-impact pruning, such as rejecting major product directions or creating epics, should get an independent review or owner confirmation before shipping.
