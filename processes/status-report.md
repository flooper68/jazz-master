# Process: status report

Use this when the owner asks "what's happening", "status report", "what's active",
or similar. The report is read-only and advisory: it writes no ledger, schedules
nothing, and does not triage the inbox. The heartbeat remains the recorder and
scheduler.

## Steps

1. Run the facts command:

   ```sh
   bun run --cwd codebase work:status
   ```

2. Run `processes/prioritization.md` against the current facts for the one
   judgment section: next 1-3 recommended work items.
3. Read `strategy/goals.md` and map in-progress and next epics against the
   "Now" goals so the report explains why the recommendation matters.
4. Narrate the result to the owner, leading with next-up work and cadence flags.
   State that the report is fresher advice than `work/HEARTBEAT.md` when they
   disagree, while the heartbeat remains the durable ledger.

## Required sections

- Next up: fresh prioritization, with one-sentence rationale for each item.
- Cadence flags: heartbeat, QA/product review, knowledge maintenance, security
  review, and exam grill.
- Active/proposed/blocked work.
- High-priority issues: non-terminal issues ordered by severity.
- Initiative map: active and next epics aligned to `strategy/goals.md` "Now".
- Inbox summary: insights, issues, and unprocessed notes by status.
- Recently shipped work since the last heartbeat.
- Repo hygiene: dirty tree, unpushed commits, untracked files, and stray
  untracked files outside expected project directories.

## Narration rules

- Titles first, IDs last. Use "Practice history page (TASK-018)", never
  "TASK-018 Practice history page", and never lead a sentence or list item with
  an ID.
- Keep facts and judgment separate. The command output is deterministic; next-up
  ranking is the agent's current judgment via `processes/prioritization.md`.
- Do not mutate tracker files during a status report. If the report exposes stale
  states, say so and recommend heartbeat or knowledge maintenance as appropriate.

## Verification

A valid report can be audited by rerunning `bun run --cwd codebase work:status`
and checking that every factual claim came from the command output, frontmatter,
`strategy/goals.md`, or git.
