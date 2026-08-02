---
id: ISSUE-012
title: Committed routeTree.gen.ts no longer matches codegen output, so every build dirties the tree
status: open
severity:
created: 2026-08-02
source: TASK-086
---

## Steps to reproduce

From a clean tree at `main`:

```sh
git status --short                      # empty
bun run --cwd codebase/apps/web build
git diff --stat codebase/apps/web/src/app/routeTree.gen.ts
```

## Expected

No diff. `routeTree.gen.ts` is committed precisely so the generated tree is
reviewable and stable, and `bun run --cwd codebase check` ends with a build.

## Actual

31 insertions, 31 deletions. The TanStack Router plugin emits the route imports
and `RouteImport.update({...})` declarations in a different order than the
committed file — `index`, `history`, `practice`, `profile` instead of the
committed `profile`, `practice`, `history`, `index`. The content is
semantically identical; only the ordering differs.

Reproduced from a clean `HEAD` with the TASK-086 diff stashed, so it is
pre-existing and not caused by that change. Something regenerated the file in a
different order than the last commit captured it — most likely a plugin version
change since the file was last committed.

## Why it matters

Every agent that runs `bun run --cwd codebase check` ends the run with a dirty
tree it did not create, which collides with hard rule 7 (finished work leaves
`git status --short` clean) and with the commit-isolation rules in
`processes/git-workflow.md` — the safe move is to revert a file you did not
intend to change, which means the drift never gets fixed and recurs forever.

INS-018 (deferred) already noted that the committed `routeTree.gen.ts` has no
drift guard in the check gate. This is that gap having produced actual drift, so
it is now a reproducible defect rather than a hypothetical. A fix probably means
committing the regenerated file once and then adding the guard INS-018 asks for,
so the next divergence fails the gate instead of quietly dirtying the tree.
