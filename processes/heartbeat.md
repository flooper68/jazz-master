# Process: heartbeat

The manually triggered consolidation ritual. The owner says "do the heartbeat"; the agent sweeps everything that accumulated since the last beat, schedules due hygiene work as tasks, and recommends the next 1–3 work items. The heartbeat is the conductor — it **schedules and recommends, it does not execute heavy work**. QA reviews, deep knowledge sweeps, and research happen later, as tasks picked up by "do next task".

The intended rhythm: `do next task` × a few → `do heartbeat` → repeat.

## What it owns

The cadence triggers that other processes state but nothing enforces:

- `processes/qa-product-review.md` — "every ~5 shipped tasks / after an epic is done"
- `processes/knowledge-maintenance.md` — "periodically after about ten shipped tasks"
- `processes/security-review.md` — when shipped work touched sensitive surfaces without one
- research `stale_when` conditions going stale unnoticed

The heartbeat is the only process that counts shipped work and turns "periodically" into an actual scheduled task.

## State

`work/HEARTBEAT.md` is an append-only ledger; the newest entry is the baseline for "since the last beat". Everything else is derived from the repo at beat time — `git log` since the last beat, inbox file statuses, `work/reviews/` dates — never from a separately maintained counter.

## Steps

### 1. Take stock

- Read the last ledger entry in `work/HEARTBEAT.md` (first beat: baseline is repo start).
- Derive since-last-beat facts: shipped tasks/issues (`git log`), new/changed files in `notes/`, `work/insights/`, `work/issues/`, `research/`, in-progress or blocked items, last `REV-*` date, last knowledge-maintenance commit.

### 2. Sweep intake (inline — this part is cheap)

- Unprocessed `notes/NOTE-*`: run `processes/feedback-intake.md` extraction if quick, else count them toward scheduling a knowledge-maintenance task in step 3.
- Inbox items (`INS-*` `status: new`, `ISSUE-*` `status: open`): run `processes/triage.md` inline. Its authority rules apply unchanged — insight accept/reject remains a proposal for the owner, batched into this beat's report.

### 3. Cadence check — schedule due hygiene as tasks

For each rule that fires, create a normal `TASK-###` (template in `work/README.md`) so the dev loop can pick it up like any other work. **Never execute the underlying process during the heartbeat.**

| Hygiene work | Due when | Scheduled task |
|---|---|---|
| QA / product review | ≥5 tasks/issues shipped since last `REV-*` or last scheduled QA task; or an epic reached `done`; or a security/privacy-sensitive slice shipped unreviewed | "Run QA/product review of <areas shipped since last review>" per `processes/qa-product-review.md` |
| Knowledge maintenance (deep sweep) | ≥10 tasks shipped since the last sweep; or unprocessed notes / stale `RES-*` piled beyond what step 2 handled inline | "Run knowledge maintenance sweep" per `processes/knowledge-maintenance.md` |
| Security review | Work since the last beat touched storage, dependencies, user input, permissions, or import/export without a security pass in its Log | "Security review of <surface>" per `processes/security-review.md` |
| Research refresh | A `RES-*` `stale_when` condition has triggered | Task or insight to refresh, per `processes/knowledge-maintenance.md` routing |

Scheduling rules:

- Check first that an equivalent task or open item doesn't already exist — never duplicate.
- Hygiene tasks are standalone (no epic) and record provenance in Context: "Scheduled by heartbeat YYYY-MM-DD".
- Cadence thresholds are ceilings, not quotas. A borderline "due" with an empty product surface change is a skip, noted in the ledger with the reason.

### 4. Retro

One explicit question: **did any process chafe, fail, or get skipped since the last beat?** (review missed a bug, red check reached main, task blew past one session, a process step felt wasteful). File findings as `INS-*` or `NOTE-*` via `processes/feedback-intake.md`; process-doc edits are proposals for the owner unless trivial.

### 5. Prioritize

Run `processes/prioritization.md` over the now-current queue (including any hygiene tasks just scheduled — they rank by the same rules, they don't automatically jump the queue). Output: recommended next 1–3 items, in order, with a short auditable rationale.

### 6. Record and report

Append a ledger entry to `work/HEARTBEAT.md`:

```markdown
## YYYY-MM-DD

- Since last beat: <n> shipped (TASK-…, ISSUE-…), <n> notes, <n> insights, <n> issues
- Triage: <accepted/rejected/deferred proposals — or "inbox empty">
- Scheduled: <TASK-### …, or "nothing due" with skipped rules + reasons>
- Retro: <finding + filed item, or "no friction">
- Next up: 1. TASK-### — <why> 2. … 3. …
- Owner decisions needed: <batched questions, or "none">
```

Commit everything the beat produced — ledger entry, inline triage edits, scheduled tasks, filed retro items — as one commit, `work: heartbeat YYYY-MM-DD`, and **push it to `main`** per `processes/git-workflow.md`. Run its end-of-run check: the beat is not done while `git status` is dirty or the commit sits unpushed.

Only after the push succeeds, report to the owner: the same digest, leading with **next up** and **decisions needed**.

## Guardrails

- **Schedule, don't execute.** The only processes run inline are feedback-intake extraction and triage; everything heavier becomes a task.
- **No invented work.** Only the cadence table and the intake sweep may create items; anything else discovered goes through `processes/feedback-intake.md` as usual.
- Keep the actionable queue small — triage's rule applies to the heartbeat too. A beat that schedules nothing and confirms priorities is a successful beat.
- Never edit `strategy/`; batch strategy-shaped observations as owner questions in the report.
- The ledger records decisions and skips *with reasons* so a future beat (or the owner) can audit the cadence without reconstructing history.
- **The report comes after the push.** A beat that ends with uncommitted or unpushed changes is incomplete — the end-of-run check in `processes/git-workflow.md` is part of step 6, not optional.
