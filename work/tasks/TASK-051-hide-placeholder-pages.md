---
id: TASK-051
title: Hide unfinished placeholder pages from the app shell
epic: EPIC-001
status: done
depends_on: []
source: NOTE-011
created: 2026-07-08
---

# TASK-051 - Hide unfinished placeholder pages from the app shell

## Goal

The app navigation only exposes usable practice surfaces, not empty
"coming soon" pages.

## Problem brief

Current condition: the app shell links to ear training, progressions, and
repertoire pages that only say coming soon; voicings is a sample-only stub.
Desired condition: unfinished modules are hidden or clearly removed from primary
navigation until they have usable workflows.
Affected user/workflow: anyone exploring the app after opening the guided
practice product.
Evidence: NOTE-011 owner feedback: empty pages are confusing and should be
ditched for now.
Baseline: primary nav includes placeholder routes.
Target: primary nav contains only the real current surfaces; direct unfinished
routes either redirect to a useful page or show a not-found/temporarily hidden
state that is not promoted in navigation.
How we will know it improved: a user cannot wander from Practice/Dashboard into
empty product promises.

## Context

Likely touches `Layout.tsx`, route files, tests, and generated
`routeTree.gen.ts`. Preserve future epic files; this is product surface cleanup,
not abandoning those roadmap areas.

## Acceptance criteria

- [x] Primary navigation removes unfinished placeholder modules
- [x] Tests assert the current navigation set
- [x] Direct visits to hidden unfinished routes behave deliberately (redirect,
      not found, or a minimal hidden-state decision documented in the task log)
- [x] Generated TanStack route tree is current if route files change
- [x] `bun run --cwd codebase check` passes
- [x] `bun run --cwd codebase check:e2e` passes

## Verification

- `bun run --cwd codebase check`
- `bun run --cwd codebase check:e2e`
- Manual browser pass: inspect app nav at desktop and phone width and verify no
  empty pages are exposed.

## Log

### 2026-07-08 - claimed (agent)

Plan: remove unfinished module links from primary navigation, delete their
TanStack route/page stubs so direct visits intentionally render the existing
not-found view, update router/layout tests to pin the current usable nav set,
and run `check`, `check:e2e`, plus desktop and phone-width browser nav checks.

### 2026-07-08 - done

Primary nav now exposes only Dashboard, Practice, History, and Profile. Removed
the unfinished voicings, progressions, repertoire, and ear-training route/page
stubs, so direct visits intentionally render the existing not-found view. Added
router tests for the current nav set and hidden-route behavior; updated layout
regression tests to use `/practice`. Independent review found no issues.
Verification: focused router/layout tests passed (21 tests), `bun run --cwd
codebase check` passed, `bun run --cwd codebase check:e2e` passed after
escalating past sandbox port binding, and a headless browser pass confirmed the
same four nav links at 1280x720 and 375x812 with no hidden labels and no
horizontal overflow.
