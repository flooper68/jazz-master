---
id: INS-018
title: Committed routeTree.gen.ts has no drift guard in the check gate
status: deferred
revisit_when: next task that touches TanStack route files or the shared check/build gate
created: 2026-07-06
source: TASK-022
---

TASK-022 commits the TanStack Router codegen output
(`apps/web/src/app/routeTree.gen.ts`) because `bun run build` runs `tsc -b`
before `astro build` regenerates the file — typecheck and tests consume the
committed copy. Nothing in `bun run check` verifies that copy is current:
`astro build` silently regenerates it into the working tree, so a stale
committed tree keeps the gate green.

Why it might matter (review finding, TASK-022): someone adds or renames a
route file, forgets to regenerate, and commits — `check` passes locally while
the committed tree ships stale. Typecheck only catches the subset of drift
where an existing `Link` references a path that vanished.

Possible fix: a `check` step that regenerates and runs
`git diff --exit-code apps/web/src/app/routeTree.gen.ts`, or a pre-`tsc`
generate step in the build script. Deferred from TASK-022 because it changes
the shared `check` gate, which is beyond a mechanical routing migration.

## Triage note

2026-07-08 heartbeat - Deferred. The risk is real, but no current route drift
has been observed and today's priority is the runner/notation practice loop.
Fold this into the next route-file or check-gate task rather than expanding the
queue now.
