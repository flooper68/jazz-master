---
id: INS-006
title: CLAUDE.md and AGENTS.md are hand-maintained duplicates and drift
status: accepted
outcome: [TASK-030, NOTE-003]
created: 2026-07-05
---

Discovered during TASK-027: AGENTS.md is a near-copy of CLAUDE.md that had silently drifted — it was missing hard rule 7 (committed-and-pushed end-of-run check, added to CLAUDE.md in e3ce87c) and the ADR-005 in-migration marker. TASK-027 synced the path/command sections in both files, but the rule-7 gap remains and every future CLAUDE.md edit can reintroduce drift.

Options when triaged: make AGENTS.md a symlink to CLAUDE.md (both tools read plain markdown; check nothing depends on them differing), generate one from the other, or add a check to the review checklist. Until then, any edit to shared sections of CLAUDE.md must be mirrored by hand.

## INS-001 relation

Independent of CI, but a `bun run check`-style guard could diff the shared sections if the two files are kept separate on purpose.

## Triage note

2026-07-06 (heartbeat) — Accepted (owner confirmation pending, batched in the
heartbeat report). A known drift already exists (rule 7 missing from AGENTS.md),
so this is a live defect in the agent-instruction layer, not a hypothetical.
Folded into TASK-030 (knowledge maintenance sweep) rather than a standalone
task — resolving doc duplication is squarely that process's remit.

## Resolution

2026-07-06 (grill session, NOTE-003) — the symlink option won: `AGENTS.md` is
now the canonical file and `CLAUDE.md` a symlink to it, so drift is structurally
impossible. The divergent content (rule 7, grilling/development-practices rows,
extended conventions vs the testing-strategy row) was merged into AGENTS.md and
the missing `product-practices.md` row added. Symlink integrity is checked by
the index lint in `processes/knowledge-maintenance.md` step 9; TASK-030 retains
the rest of the sweep scope.
