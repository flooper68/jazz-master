---
id: INS-006
title: CLAUDE.md and AGENTS.md are hand-maintained duplicates and drift
status: new
created: 2026-07-05
---

Discovered during TASK-027: AGENTS.md is a near-copy of CLAUDE.md that had silently drifted — it was missing hard rule 7 (committed-and-pushed end-of-run check, added to CLAUDE.md in e3ce87c) and the ADR-005 in-migration marker. TASK-027 synced the path/command sections in both files, but the rule-7 gap remains and every future CLAUDE.md edit can reintroduce drift.

Options when triaged: make AGENTS.md a symlink to CLAUDE.md (both tools read plain markdown; check nothing depends on them differing), generate one from the other, or add a check to the review checklist. Until then, any edit to shared sections of CLAUDE.md must be mirrored by hand.

## INS-001 relation

Independent of CI, but a `bun run check`-style guard could diff the shared sections if the two files are kept separate on purpose.
