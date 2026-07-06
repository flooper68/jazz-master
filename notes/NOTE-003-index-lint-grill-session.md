---
id: NOTE-003
title: Index consistency lint + AGENTS.md/CLAUDE.md twins (grill session)
created: 2026-07-06
source_type: grill-session
participants: [owner, agent]
processed: true
---

# NOTE-003 — Index consistency lint + AGENTS.md/CLAUDE.md twins (grill session)

## Context

The owner asked whether any process verifies that the agent index files know about the current `processes/` structure. Audit findings that triggered the session: `knowledge-maintenance.md` step 9 covered index updates only reactively ("if things changed"); AGENTS.md and CLAUDE.md had drifted divergently (CLAUDE.md had hard rule 7, the `grilling`/`development-practices` rows, and extended conventions that AGENTS.md lacked; AGENTS.md had a `testing-strategy` row CLAUDE.md lacked); `product-practices.md` was indexed in neither; and `ADR-006`/`RES-001` are ID gaps that never existed in git history. The drift itself was already on record as INS-006 (accepted, folded into TASK-030). The owner proposed making the check an explicit lint with all indexes consistent and the agent index files as twins; that decision-shaped call triggered this grill.

## Discussion

1. **Twins mechanism.** Options: symlink (drift structurally impossible, but symlinks can misbehave in some tooling/Windows), byte-identity lint over two real files, or pointer stub. Owner chose **symlink** — the twins-lint drops out of the design entirely.
2. **Direction.** CLAUDE.md-as-real minimizes citation churn; AGENTS.md-as-real matches the vendor-neutral agent-index standard. Owner chose **AGENTS.md is the real file**; content merged from the newer CLAUDE.md text; in-repo citations swept.
3. **Lint strictness.** Strict bidirectional (every `processes/*.md` has an index row) vs reachability-based escape for sub-playbooks. Owner chose **strict bidirectional** — a process file not worth a row is not worth being a separate file.
4. **Executable vs inspection.** Agent recommended a small script wired into `bun run check` (drift becomes unpushable; no reliance on the agent diligence that already failed once). Owner chose **inspection checklist** — no code, spec lives in one place.
5. **Cadence.** Given inspection-only, agent recommended a change-time same-commit rule (mirroring hard rules 4/6) with the sweep as backstop. Owner chose **sweep-only** — the knowledge-maintenance lint is the entire mechanism; up to ~10 tasks of index drift between sweeps is an accepted cost.
6. **Remediation.** Owner chose fixing the found drift **in this session** (in-session grill write-back, ADR-008) rather than filing a task.

## Decisions

- **`AGENTS.md` is the canonical agent index; `CLAUDE.md` is a symlink to it.** Never edit CLAUDE.md as a file; a regular-file CLAUDE.md is a defect. Merged content took the newer CLAUDE.md text plus the missing `testing-strategy` and `product-practices` rows.
- **Knowledge-maintenance step 9 is now a deterministic lint**: symlink intact; process table bidirectionally complete; all cited paths in `AGENTS.md`, `work/README.md`, `research/README.md`, `architecture/overview.md` exist; ID sequences gap-free (known never-created gaps: ADR-006, RES-001).
- **Sweep-only enforcement** — no change-time index obligation; inter-sweep drift is accepted, not a process failure.
- Living-doc citations of CLAUDE.md updated to AGENTS.md (`README.md`, `work/README.md`, `processes/code-review.md`, `processes/deep-research.md`, `wiki/project/overview.md` sources). Historical records (ADRs, notes, research, closed tasks/insights, LOG entries) intentionally untouched.

## Extracted work

- None — remediation shipped in-session. INS-006's duplication problem is resolved by the symlink (noted there); TASK-030 keeps the rest of the sweep scope.
