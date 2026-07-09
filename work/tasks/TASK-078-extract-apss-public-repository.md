---
id: TASK-078
title: Extract APSS into a public repository
status: done
depends_on: [TASK-076]
source: NOTE-016
created: 2026-07-09
---

# TASK-078 — Extract APSS into a public repository

## Goal

Publish APSS as an independent public GitHub repository with a sibling local
checkout, then make Jazz Master consume it by reference instead of carrying a
vendored framework copy.

## Context

TASK-076 deliberately made the framework portable. The owner now wants that
separation immediately. Use the authenticated `gh` CLI, repository name
`flooper68/adaptive-problem-solving-systems`, and local path
`/Users/premylsciompa/dev_personal/adaptive-problem-solving-systems`. This is a
documentation/framework extraction, not the TASK-077 Jazz Master system-model
migration.

## Acceptance criteria

- [x] `flooper68/adaptive-problem-solving-systems` exists as a public GitHub
      repository with the APSS specification at repository root on `main`.
- [x] The sibling local checkout has the GitHub repository as `origin`, is clean,
      and has no unpushed commits.
- [x] Jazz Master no longer tracks `framework/apss/` and current references link
      to the public repository; no git submodule or duplicate framework copy is
      introduced.
- [x] ADR-013, architecture/wiki maps and logs, AGENTS, and TASK-077 accurately
      describe the external framework boundary.
- [x] Historical TASK-076 provenance remains understandable after relocation.
- [x] Independent review completes and `bun run --cwd codebase check` passes.
- [x] Both repositories are committed, pushed, and clean.

## Verification

1. `gh repo view flooper68/adaptive-problem-solving-systems --json nameWithOwner,visibility,url,defaultBranchRef`
   reports a public repository with default branch `main`.
2. `git -C ../adaptive-problem-solving-systems status --short` and
   `git -C ../adaptive-problem-solving-systems log origin/main..HEAD` are empty.
3. Search Jazz Master for live `framework/apss` references; only historical
   statements that explicitly record the former location may remain.
4. Verify all current APSS links target the public repository and run
   `bun run --cwd codebase check`.

## Log

### 2026-07-09 — claimed (agent)

Plan: move the already-reviewed framework package into a clean sibling git
repository, publish it publicly with `gh`, verify remote visibility/default
branch, replace Jazz Master's live local-path references with external links,
record the boundary change, independently review the extraction diff, run the
project gate, and push Jazz Master with both repositories clean.

### 2026-07-09 — done

Moved the exact 15-file TASK-076 framework tree to sibling checkout
`../adaptive-problem-solving-systems`, committed it at `4badd59`, created the
public GitHub repository `flooper68/adaptive-problem-solving-systems`, and
pushed `main`. Jazz Master now deletes the vendored copy and links the public
repository from AGENTS, ADR-013, architecture, project wiki, and TASK-077; no
submodule was introduced. TASK-076/NOTE-015 retain explicitly historical local
paths plus relocation links.

Independent review verified byte-for-byte equality with the TASK-076 framework
tree, public visibility, default branch `main`, remote configuration, clean git
state, and coherent Jazz references. Its one ship-blocking finding was that a
public repository without a license was visible but not legally reusable. The
owner chose MIT; commit `2e27b8b` added `LICENSE`, GitHub now reports
`licenseInfo.key: mit`, and re-review was clean. `bun run --cwd codebase check`
passed: 46 test files, 683 tests, migration and web builds green; the existing
jsdom canvas and sandbox-only Wrangler log warnings remained non-fatal.

## Execution retrospective

### Public did not automatically mean reusable

- Problem: the extracted public repository had no license while APSS claimed it
  could be reused by other projects.
- Cause: repository visibility and reuse permission were treated as the same
  property during the initial extraction.
- Resolution: asked the owner to choose a license, added the MIT License under
  the `flooper68` notice, committed, and pushed it.
- Evidence: GitHub reports the repository public on `main` with
  `licenseInfo.key: mit`; independent re-review passed.
- Reuse: knowledge candidate for future public-artifact publication processes—
  explicitly validate licensing, not only visibility.
