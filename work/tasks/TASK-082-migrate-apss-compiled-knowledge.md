---
id: TASK-082
title: Migrate APSS compiled knowledge and artifacts
status: abandoned
abandoned_reason: owner decision 2026-07-10 — retire the proposed Jazz Master APSS migration before fresh MVP grooming
depends_on: [TASK-081]
source: TASK-077
created: 2026-07-09
---

# TASK-082 — Migrate APSS compiled knowledge and artifacts

## Goal

Colocate compiled wiki knowledge and human-facing derived artifacts under
knowledge stewardship while preserving source authority and all old links.

## Exact old → new paths

| Old canonical path | New canonical path |
|---|---|
| `wiki/` | `systems/jazz-master/subsystems/knowledge/knowledge/wiki/` |
| `artifacts/` | `systems/jazz-master/subsystems/knowledge/artifacts/` |

## Compatibility/link update

Replace both old directories with relative symlinks. Update declarations and
current process references to the new canonical paths, but leave historical
source links untouched while compatibility paths resolve. Preserve the rule
that wiki/artifacts are derived and lose conflicts to their source systems.

## Acceptance criteria

- [ ] Wiki and artifact history/content move to the exact new paths.
- [ ] `wiki/` and `artifacts/` compatibility links resolve from the repository root.
- [ ] Wiki sources, index, log, and artifact README links resolve with no change of canonical authority.
- [ ] Knowledge-maintenance and artifact rendered-verification processes still operate.
- [ ] The APSS validator and generated views pass.
- [ ] Independent review and `bun run --cwd codebase check` pass.

## Verification

Run the wiki lint and source-link checks from the new canonical path and old
compatibility path; render/open any artifact whose reference changes; run the
APSS validator/generator twice, independent review, and
`bun run --cwd codebase check`.

## Log

### 2026-07-10 — abandoned

Owner retired all non-terminal tasks before fresh MVP grooming. Wiki and
artifact paths remain unchanged.
