# Process: the dev loop

The core iteration for shipping any piece of work (task or small issue). Designed so an agent pointed at the repo with "do the next task" produces a reviewed, tested, pushed increment.

## The loop

```
┌─> 1. PICK      choose the next actionable work item
│   2. CLAIM     set status: in-progress
│   3. PLAN      read item + epic + relevant code; note approach in the item's Log
│   4. IMPLEMENT small steps, tests alongside code
│   5. REVIEW    per processes/code-review.md
│   6. TEST      bun run check + the item's Verification steps
│   7. RECORD    tick acceptance criteria, write the Log, set status
│   8. SHIP      commit + push to main (per processes/git-workflow.md)
└── 9. REFLECT   file insights/issues/notes for anything discovered; loop
```

### 1. Pick

- Candidates: `work/tasks/*.md` with `status: backlog` whose `depends_on` are all `done`, plus `work/issues/*.md` with `status: confirmed` and no linked task.
- Priority order: `blocker` issues → owner instruction → `processes/prioritization.md` ranking → tasks in in-progress epics (lowest ID first) → `major` issues → the rest.
- If nothing is actionable: run `processes/triage.md` on the insights/issues inbox, then `processes/knowledge-maintenance.md` if notes/research/stale docs may contain work, or report "no actionable work" with the reason.

### 2. Claim

- Set frontmatter `status: in-progress`. This is the lock — never pick an item another agent has claimed.

### 3. Plan

- Read the item fully, its epic, and any linked research (`research/RES-*.md`) or ADRs.
- Read the code the task touches. Reuse before writing new — check `src/theory/` and `src/components/` first.
- If the task has a research phase, run `processes/deep-research.md` first; findings land in `research/`.
- If the task touches storage, dependencies, user input, browser permissions, import/export, or data-loss risk, include `processes/security-review.md` in the plan.
- Append a short plan to the item's **Log**. If the item is too large, split it: narrow to a shippable slice, file follow-up tasks.

### 4. Implement

- Small increments; keep `bun run test:watch` running.
- Theory-core (`src/theory/`) work is test-first: failing case, then make it pass.
- Stay in scope. Ideas, discovered bugs, tempting refactors → `work/insights/` or `work/issues/` in step 9, not now.

### 5. Review

- Run the review process (`processes/code-review.md`) on the full diff before it ships. Fix findings or file them as issues with justification.

### 6. Test

- `bun run check` must pass: typecheck, lint, tests, production build.
- Execute the item's **Verification** section literally, including manual `bun run dev` checks.
- Tick a criteria checkbox only after actually verifying it — never because the code "should" satisfy it.

### 7. Record

- Tick completed acceptance criteria; append a Log entry (what, key decisions, deviations); set status `done` (or `blocked` with an explicit reason — never silently abandon).
- If an architectural decision was made, write the ADR (`architecture/decisions/`) now, in the same change.
- If this completes an epic's last task, update the epic's status and Done-when assessment.
- Anything notable for posterity (migration, gotcha, dead end) → one line in `architecture/LOG.md`.

### 8. Ship

- Follow `processes/git-workflow.md`: one work item = one commit, `TASK-###: <summary>` (or `ISSUE-###:`), pushed to `main`. Code and tracker updates move together in that commit. Never ship with a red `bun run check`.

### 9. Reflect

- File new insight/issue/task/note files for everything discovered via `processes/feedback-intake.md`. Loop back to 1 if in a multi-iteration session.

## Log format (inside work items)

Append entries under a `## Log` heading (create it on first claim):

```markdown
## Log

### 2026-07-05 — claimed (agent)
Plan: implement Note as {letter, accidental}; interval table keyed by name; spellChord composes them.

### 2026-07-05 — done
All qualities spelled correctly incl. flat keys; 48 tests. Deviation: slash-chord parsing
deferred — filed TASK-009. bun run check green, pushed.
```

**Honesty rule:** the Log reflects reality. Failing tests, skipped verification steps, or partial criteria are stated outright, never smoothed over.

## Definition of done

1. All acceptance criteria checked, honestly.
2. Reviewed per `processes/code-review.md`.
3. `bun run check` green; new logic has tests (theory core: exhaustive — all twelve keys, enharmonics).
4. No scope creep; discoveries filed.
5. Pushed to `main`; the work item's Log tells a reviewer what happened without reading the diff.
6. Meaningful product work states what changed for the user and what should be watched in the next QA review.

## Roles

- **Human (product owner):** owns `strategy/`, confirms triage decisions, reviews shipped work via `work/reviews/` and git history, sets priorities.
- **Agent (implementer):** executes this loop; may create task/insight/issue files freely; creates epics only when asked; never edits `strategy/`.

## Parallel work

Claiming is the lock. Parallel agents pick items touching different areas (check `depends_on` and affected files) or work in separate worktrees; last to ship rebases.
