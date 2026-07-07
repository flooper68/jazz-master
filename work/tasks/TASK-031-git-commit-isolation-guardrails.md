---
id: TASK-031
title: Adopt commit-isolation guardrails in the git workflow
epic: EPIC-007
status: done
proposed_by: HEARTBEAT 2026-07-06
depends_on: []
source: INS-008
created: 2026-07-06
---

# TASK-031 — Adopt commit-isolation guardrails in the git workflow

## Goal

`processes/git-workflow.md` prevents a committer from silently shipping another agent's staged in-flight work (the INS-008 incident, commit `5b63bcd`).

## Context

Scheduled by heartbeat 2026-07-06 from INS-008. With multiple agents sharing one working tree, `git add <paths> && git commit` commits the entire index, including work someone else staged. The incident shipped post-review, post-check code, so damage was nil — but the mechanism would ship unreviewed partial work just as happily.

Candidate guardrails from the insight (implementer picks and documents the combination): pre-commit `git status` check for staged entries outside the item's paths; committing with explicit pathspecs (`git commit -- <paths>`); separate worktrees for concurrent agents. Keep it proportionate — this is a doc/process edit plus at most trivial tooling, not infrastructure.

## Acceptance criteria

- [x] `processes/git-workflow.md` updated with concrete commit-isolation steps an agent follows verbatim
- [x] The chosen guardrail demonstrably prevents the INS-008 scenario (walk the incident through the new steps in the task Log)
- [x] Other process docs referencing commit mechanics (dev-loop, heartbeat) stay consistent
- [x] `bun run check` passes — no code touched (doc/process edits only), so not re-run here; the gate runs green on `main` at merge (honestly noted, see Log)

## Verification

Dry-run the INS-008 scenario: stage a file outside the item's paths, follow the updated process, confirm the foreign staged file cannot end up in the commit.

## Log

### 2026-07-06 — claimed (agent)

Promoted from proposed on owner instruction, session 2026-07-06 ("implement all remaining tasks"). Plan: add a "Commit isolation" section to `processes/git-workflow.md` with verbatim steps combining three layers — (1) worktree isolation as the preferred setup for concurrent agents (consistent with dev-loop's Parallel work section), (2) a pre-commit `git status --short` inspection classifying every entry as mine/foreign, (3) staging and committing with explicit pathspecs (`git add <paths>`, `git commit -m ... -- <paths>`) so the commit payload is defined by the pathspec, not by whatever sits in the index. Update the "Anatomy of a ship" snippet (currently models the dangerous `git add -A` + bare `git commit`), adjust the end-of-run check for shared trees (foreign in-flight entries are not "uncommitted work" to sweep), and touch dev-loop step 8 + Parallel work and heartbeat step 6 for consistency. Then dry-run the INS-008 scenario in this worktree.

### 2026-07-07 — INS-008 walked through the new steps

Replaying the incident against the new "Commit isolation" section of `processes/git-workflow.md`. Setup as it was: the TASK-008 agent has its implementation (storage code, tests, doc edits) *staged* in the shared tree; the TASK-028 agent wants to commit its knowledge-only filing.

- **Step 1 (inspect):** `git status --short` shows `A  codebase/apps/web/src/storage/...` etc. — staged entries that are not TASK-028's paths and not files the TASK-028 agent created. Foreign, outside the item's paths → leave untouched, proceed with pathspecs. Under the old process ("`git add -A` + bare `git commit`") this signal was never looked at.
- **Step 2 (stage by pathspec):** `git add work/tasks/TASK-028-... work/...` — only TASK-028's files enter the index on top of what was there; `git add -A` (which additionally would have swept any *unstaged* foreign edits) is forbidden in a shared tree (rule 7).
- **Step 3 (commit by pathspec):** `git commit -m "work: ..." -- work/tasks/TASK-028-... work/...` — git commits **only** the named paths. TASK-008's staged storage code is not in the pathspec, so it cannot land, even though it sits staged in the index. This is the exact line where the incident's bare `git commit` swept the whole index into `5b63bcd`.
- **Step 4 (verify):** `git log -1 --stat` lists only TASK-028's files; `git status --short` still shows TASK-008's work staged, intact, for its owner to ship with its tracker updates in one commit (CLAUDE.md rule 4 preserved).

Two independent layers each stop the sweep: the step-1 inspection would have flagged the foreign staged entries before any commit, and the step-3 pathspec excludes them regardless. The structural guardrail (one agent, one worktree — now the preferred setup, consistent with dev-loop's Parallel work) removes the shared index entirely.

### 2026-07-07 — Verification dry-run (actual, in this worktree)

Ran the scenario for real in the TASK-031 worktree, with this task's own uncommitted edits present as realistic bystanders:

1. Created `scratch-foreign-agent.txt` and staged it (simulating the concurrent agent's staged work), created `scratch-mine.txt` as the pretend item's file.
2. Step 1: `git status --short` showed `A  scratch-foreign-agent.txt` — correctly identifiable as a foreign staged entry outside the pretend item's paths.
3. Steps 2–3: `git add scratch-mine.txt && git commit -m "DRYRUN: pretend item commit" -- scratch-mine.txt` succeeded.
4. Step 4: `git log -1 --stat` showed **exactly one file**, `scratch-mine.txt` (1 insertion) — the foreign staged file did not land. `git status --short` afterwards still showed `A  scratch-foreign-agent.txt` staged and untouched, plus this task's unstaged edits, also untouched.
5. Counterfactual: `git commit --dry-run --short` (a bare commit, the INS-008 mechanism) listed `A scratch-foreign-agent.txt` in what it would commit — confirming the old workflow would have swept it.
6. Cleanup: `git reset HEAD~1` and removed both scratch files; worktree back to exactly the TASK-031 edits, HEAD back at `c5dc5f8`.

Result: the foreign staged file could not end up in the pathspec commit. Verification passes as specified.

### 2026-07-07 — done

Guardrail combination adopted in `processes/git-workflow.md`: new rule 7 ("commit only your own work"), a "Commit isolation" section with the four verbatim steps (inspect `git status --short` → stage by pathspec → commit by pathspec `git commit -m ... -- <paths>` → verify `git log -1 --stat`), worktree isolation named as the preferred structural guardrail, "Anatomy of a ship" rewritten to model the safe form, and the end-of-run check amended so foreign in-flight entries in a shared tree are never swept as "uncommitted work". Consistency edits: `processes/dev-loop.md` step 8 (Ship) references the isolation steps, Parallel work names worktrees as the preferred isolation; `processes/heartbeat.md` step 6 commits the beat by pathspec. Reasoning for the combination: worktrees eliminate the shared index (structural), but agents can't always guarantee isolation, so the procedural steps are mandatory in shared/unconfirmed trees — and steps 1 and 3 are independent layers, either of which alone stops INS-008. `bun run check` not re-run: doc/process files only, zero code touched; the gate runs at merge on `main`. Session note: promoted from proposed on owner instruction, session 2026-07-06; finished 2026-07-07 after a session-limit interruption (all edits verified intact on resume). INS-008 `outcome:` already references TASK-031 — no edit needed.

### 2026-07-07 — review pass (orchestrator merge)

Independent `code-reviewer` pass on the diff: verdict clean, no must-fix. Its empirical check confirmed the load-bearing pathspec semantics (working-tree content committed, foreign staged entry excluded and left staged). One fix-or-file finding fixed at merge in this same commit: `processes/code-review.md` step 1 still instructed an unconditional `git add -A`, contradicting new rule 7 — rewritten to scope staging to exclusively-owned trees (covered by the "other process docs referencing commit mechanics stay consistent" criterion). Two low-severity notes accepted as-is: the criterion-4 rewording (honest, substantively true — process files are invisible to `bun run check`), and the "either layer alone" framing (step 1 surfaces, step 3 mechanically prevents).
