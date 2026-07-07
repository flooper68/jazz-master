# Process: git workflow

Trunk-based, push to `main`. Chosen for maximum loop speed while the project is young and single-owner; see the "later" section for the PR upgrade path.

## Rules

1. **One work item = one commit** on `main` (small follow-up fix commits referencing the same ID are acceptable).
2. **Commit message:** `TASK-###: <imperative summary>` / `ISSUE-###: ...` / `REV-###: ...`. Knowledge-only changes (triage, notes, insights, ADRs, process edits) use a `work:` prefix, e.g. `work: triage 2026-07-05, INS-003 -> TASK-011`.
3. **The gate before every push:** review done (`processes/code-review.md`) and `bun run --cwd codebase check` green. No exceptions — a red check never reaches `main`. If the change touches the practice flow, routing, or storage, also run the e2e smoke suite (`bun run --cwd codebase check:e2e`, TASK-035) — a push to `main` is a dev deploy (ADR-009).
4. Code and its tracker updates (task file status, Log, criteria) ship **in the same commit** — the repo is never in a state where code and tracker disagree.
5. Pull/rebase before pushing (`git pull --rebase`) — required when agents work in parallel.
6. Never force-push `main`. Never rewrite pushed history.
7. **Commit only your own work.** Follow the commit-isolation steps below. `git add -A` (or `git add .`, or a bare `git commit` of the whole index) is permitted only in a working tree you exclusively own — a dedicated worktree, or a shared tree whose `git status --short` you have just inspected and every entry is yours.

## Anatomy of a ship

```sh
git pull --rebase
bun run --cwd codebase check       # must be green
git status --short                 # isolation step 1: every entry must be yours
git add codebase/apps/web/src/fretboard work/tasks/TASK-003-fretboard.md
git commit -m "TASK-003: add fretboard model and SVG component" \
  -- codebase/apps/web/src/fretboard work/tasks/TASK-003-fretboard.md
git log -1 --stat                  # isolation step 4: only your paths in the commit
git push origin main
```

## Commit isolation — never sweep another agent's work

A bare `git commit` commits the **entire index**, not just the paths you `git add`-ed. In a shared working tree this silently ships whatever a concurrent agent had staged — the INS-008 incident: commit `5b63bcd` (a TASK-028 knowledge-only filing) swept TASK-008's staged implementation onto `main` while its task file still said `in-progress`. Guardrails, in order of preference:

**Structural: one agent, one worktree.** Concurrent agents work in separate `git worktree`s (see Parallel work in `processes/dev-loop.md`): `git worktree add <path> -b <branch>`. A tree with exactly one agent cannot contain foreign staged work. If you cannot positively confirm you are alone in the tree, treat it as shared and follow the steps below.

**Procedural: the pathspec-commit steps.** Mandatory in any shared or unconfirmed tree; cheap enough to follow everywhere.

1. **Inspect:** `git status --short`. Classify every entry, staged or unstaged: is it from *your* work item (or a file you created this session)? A foreign entry means a concurrent agent is mid-flight:
   - foreign entry **outside** your item's paths → leave it untouched, exactly as staged/unstaged as you found it, and continue with the pathspec steps;
   - foreign entry **inside** your item's paths → stop; you are colliding with another agent on the same files. Resolve ownership (check which item claims them) before committing anything.
2. **Stage by pathspec:** `git add <your paths>` — explicit files or directories only, never `git add -A` / `git add .` in a shared tree.
3. **Commit by pathspec:** `git commit -m "TASK-###: <summary>" -- <your paths>`. With a pathspec, git commits **only** the named paths and ignores the rest of the index — a foreign staged entry cannot land in your commit even if step 2 was botched. (Caveat: a pathspec commit takes the current working-tree content of the named paths, staged or not — safe precisely because step 1 confirmed nothing inside your paths is foreign.)
4. **Verify:** `git log -1 --stat` lists only your paths; `git status --short` still shows the foreign entries, untouched, for their owner to ship.

Steps 1 and 3 are independent layers: the inspection catches collisions inside your paths; the pathspec excludes everything outside them. Either one alone would have prevented INS-008.

**End-of-run caveat for shared trees:** in the end-of-run check below, "empty" means *empty of your entries*. Leftover entries belonging to a concurrent agent's claimed in-flight item are theirs to ship — never commit them, never clean them up.

## End-of-run check — every process, every session

Work is not shipped until it is on `origin/main`. Before reporting results to the owner or ending a session, verify both:

```sh
git status --short              # must be empty of YOUR entries — no uncommitted work of yours
git log origin/main..HEAD       # must be empty — no unpushed commits
```

If either shows anything of yours, commit (with the correct message prefix, via the commit-isolation steps above) and push first. Entries belonging to a concurrent agent's claimed in-flight item do not count — and are not yours to commit. Reporting "done" while changes sit uncommitted or unpushed is a process failure — this applies to knowledge-only work (heartbeat, triage, notes, insights) exactly as it does to code.

## When something bad ships anyway

- Broken `main` is a `blocker` issue: file `ISSUE-###`, fix forward immediately (revert commit is fine: `git revert <sha>`), note it in `architecture/LOG.md`.

## Later (not now)

When the project gains collaborators or CI, upgrade to: task branches (`task/TASK-###-slug`) → PR with template → agent review comment + CI green required → squash-merge. The dev loop is unchanged; only step 8 (Ship) swaps commit-to-main for open-PR-and-merge. Record the switch as an ADR when it happens.
