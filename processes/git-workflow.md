# Process: git workflow

Trunk-based, push to `main`. Chosen for maximum loop speed while the project is young and single-owner; see the "later" section for the PR upgrade path.

## Rules

1. **One work item = one commit** on `main` (small follow-up fix commits referencing the same ID are acceptable).
2. **Commit message:** `TASK-###: <imperative summary>` / `ISSUE-###: ...` / `REV-###: ...`. Knowledge-only changes (triage, notes, insights, ADRs, process edits) use a `work:` prefix, e.g. `work: triage 2026-07-05, INS-003 -> TASK-011`.
3. **The gate before every push:** review done (`processes/code-review.md`) and `bun run check` green. No exceptions — a red check never reaches `main`.
4. Code and its tracker updates (task file status, Log, criteria) ship **in the same commit** — the repo is never in a state where code and tracker disagree.
5. Pull/rebase before pushing (`git pull --rebase`) — required when agents work in parallel.
6. Never force-push `main`. Never rewrite pushed history.

## Anatomy of a ship

```sh
git pull --rebase
bun run check                 # must be green
git add -A
git commit -m "TASK-003: add fretboard model and SVG component"
git push origin main
```

## When something bad ships anyway

- Broken `main` is a `blocker` issue: file `ISSUE-###`, fix forward immediately (revert commit is fine: `git revert <sha>`), note it in `architecture/LOG.md`.

## Later (not now)

When the project gains collaborators or CI, upgrade to: task branches (`task/TASK-###-slug`) → PR with template → agent review comment + CI green required → squash-merge. The dev loop is unchanged; only step 8 (Ship) swaps commit-to-main for open-PR-and-merge. Record the switch as an ADR when it happens.
