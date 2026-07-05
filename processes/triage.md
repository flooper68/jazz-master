# Process: triage

Turns the raw inboxes — `work/insights/` (`status: new`) and `work/issues/` (`status: open`) — into actionable, prioritized work. Run when the inbox has items, after feedback intake, after every QA review, or when the dev loop finds nothing actionable.

## Steps

For each inbox item, oldest first:

### Insights (`status: new`)

1. Understand it; check it isn't already covered by an existing epic/task/rejected insight (search `work/` for keywords).
2. Judge against `strategy/`: does it serve the vision and current goals? Is now the time?
3. Check problem framing (RES-008): before an insight becomes a task, the **current condition, desired condition, affected user/workflow, and evidence** must be clear — from the insight itself or one quick round of investigation. If they aren't, defer the insight noting what's missing; do not fabricate implementation work around a vague symptom.
4. Decide:
   - **Accept** → create the task(s) (or propose an epic if it's pillar-sized) with `source: INS-###` in frontmatter; set the insight `status: accepted`, record `outcome: [TASK-###, ...]`. Product-facing tasks carry a `## Problem brief` (template in `work/README.md`).
   - **Reject** → `status: rejected`, with a written reason (the reason is the value — it prevents re-litigating the idea later).
   - **Defer** → stays `new` with a note on what would change the decision and when to revisit.
5. Never delete insight files.

### Issues (`status: open`)

1. Reproduce it (run the app / the failing case). Can't reproduce → note that in the file, ask the reporter, keep `open`.
2. Reproduced → `status: confirmed`, set `severity: blocker | major | minor`.
3. Sizing:
   - Trivial (< 1 session, obvious fix) → the issue itself is the work item; the dev loop picks it directly.
   - Bigger → create `TASK-###` with `source: ISSUE-###`, link it from the issue.
4. `blocker` severity jumps the queue — it outranks all tasks in the pick order.
5. Closing an issue as `wontfix` requires a written reason.

### Prioritize

After inbox items are processed, run `processes/prioritization.md` when new tasks/issues could affect next work. Keep the actionable queue small: do not create tasks for every accepted idea unless the task is genuinely useful now.

## Authority

Agents run triage end-to-end but **acceptance/rejection of insights is a proposal** until the user confirms — batch the proposals in the triage commit message and Log entries so confirmation is a one-glance affair. Issue confirmation/severity needs no approval (it's factual). The user can pre-authorize full autonomous triage at any point.

## Output

- Updated inbox item files + any created tasks, shipped as one `work: triage <date>` commit.
- If priorities shifted (new blocker, goal-relevant insight), say so explicitly to the user.
