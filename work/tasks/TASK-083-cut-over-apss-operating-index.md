---
id: TASK-083
title: Cut over the APSS operating index
status: gated
depends_on: [TASK-082]
gated_until: Owner explicitly accepts systems/jazz-master/MAP.md and all prior migration tasks are verified with compatibility paths intact.
source: TASK-077
created: 2026-07-09
---

# TASK-083 — Cut over the APSS operating index

## Goal

Make the root system capsule the canonical agent entry point and replace
layer-based current links with accepted system-owned paths without breaking
repository-root discovery.

## Exact old → new paths

| Old canonical path/state | New canonical path/state |
|---|---|
| `AGENTS.md` regular canonical file | `systems/jazz-master/AGENTS.md` canonical file |
| repository-root `AGENTS.md` | Relative symlink to `systems/jazz-master/AGENTS.md` |
| repository-root `CLAUDE.md` | Relative symlink to repository-root `AGENTS.md` (preserved) |
| Layer map and process table inside current `AGENTS.md` | System hierarchy, owning-capsule paths, compatibility policy, and APSS validator command inside `systems/jazz-master/AGENTS.md` |
| Live layer paths in current wiki/architecture/work/process references | Accepted canonical `systems/jazz-master/...` paths from TASK-079 through TASK-082 |

## Compatibility/link update

The root `AGENTS.md` symlink is permanent discovery compatibility. Keep all
other old top-level compatibility links for at least TASK-084. Rewrite live
instructions and generated indexes; do not bulk rewrite historical provenance
whose old links still resolve.

## Acceptance criteria

- [ ] Root AGENTS.md and CLAUDE.md both resolve to the new canonical index.
- [ ] Every process has one indexed system owner and one current canonical path.
- [ ] All live repository links use accepted system paths or an explicitly documented compatibility entry.
- [ ] No strategy authority, source-of-truth, ship gate, or dev-loop behavior changes accidentally during path cutover.
- [ ] A cold-start agent can select, implement, review, verify, commit, and push a task from the new index.
- [ ] The APSS validator/generator, independent review, and `bun run --cwd codebase check` pass.

## Verification

Start a context-free review agent at repository root and have it report the
system map, current task-selection path, dev-loop path, strategy authority, and
check/ship commands using only root AGENTS.md. Run all old/new link checks,
knowledge-index lint, the APSS validator/generator twice, independent review,
and `bun run --cwd codebase check`.

