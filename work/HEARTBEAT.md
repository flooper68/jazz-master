# Heartbeat ledger

Append-only record of `processes/heartbeat.md` runs, newest last. The latest entry is the baseline for the next beat's "since last beat" facts. Entry format is defined in the process doc.

## 2026-07-06

First beat; baseline is repo start.

- Since last beat: 11 shipped (TASK-001, 002, 003, 004, 005, 007, 008, 009, 010, 026, 027; EPIC-001 done), 0 notes, 8 insights, 1 issue
- Triage: INS-006 accepted → TASK-030; INS-008 accepted → TASK-031 (both acceptances are proposals pending owner confirmation). INS-005 and INS-007 deferred with dated notes (EPIC-002 grip-data decisions / next window-taking function, respectively). INS-001/002/004 remain deferred — their 2026-07-05 revisit triggers (PR flow, first real practice page, alternate tunings) have not fired; not re-annotated to avoid churn. ISSUE-001 confirmed, severity minor, sized trivial — the issue is the work item, no task.
- Scheduled: TASK-029 (QA/product review of foundation — 11 shipped ≥ 5, zero REV-*, EPIC-001 done), TASK-030 (knowledge maintenance sweep — 11 ≥ 10, never run; absorbs INS-006 and the tripped RES-008 `stale_when`). Skipped: security review (TASK-008's log records a security/privacy checklist pass over the only sensitive surface touched — localStorage persistence); research refresh as a separate item (the one tripped condition, RES-008, routes through TASK-030).
- Retro: process friction since repo start = the INS-008 index-sweep incident (already filed pre-beat, now accepted → TASK-031). Also found trivial template drift: ISSUE-001 was filed with `status: new` instead of `open`; fixed in place during triage, no item filed.
- Next up: 1. TASK-006 — finishes goal 1 (EPIC-007) and upgrades the QA process that TASK-029 will then run; do it first for sequencing leverage. 2. TASK-029 — doubly-overdue review cadence; inspect the foundation before goal 3 builds on it. 3. TASK-011 — opens the goal-3 critical path (TASK-012/013/017 all depend on it). ISSUE-001 (minor, trivial) is a direct-pick filler for any spare session.
- Owner decisions needed: confirm the two insight acceptances (INS-006 → TASK-030, INS-008 → TASK-031) and the INS-005/INS-007 deferrals.

## 2026-07-08

- Since last beat: 34 task/issue commits (unique shipped work: TASK-006, TASK-011 through TASK-024, TASK-029 through TASK-035, TASK-037 through TASK-040, TASK-045 through TASK-047, ISSUE-001, ISSUE-002), 1 new owner-feedback note captured in-session (NOTE-011), 15 new insights in the inbox before triage, 1 open issue.
- Triage: NOTE-011 produced TASK-048 (notation focus/display modes), TASK-049 (play-gated timer/grading), TASK-050 (volume controls + 200 BPM), and TASK-051 (hide placeholder pages). INS-034, INS-035, INS-030, and the notation-render e2e INS-031 accepted into TASK-048. INS-017, INS-023, and INS-026 accepted into TASK-053. INS-025 accepted and fixed directly in AGENTS.md. INS-018, INS-019, INS-024, INS-027, INS-028, INS-032, and INS-033 deferred with concrete revisit triggers. ISSUE-003 confirmed minor. Deferred-aging beyond these touched items is scheduled into TASK-053 rather than expanded inline.
- Scheduled: TASK-052 (QA/product review of runner, notation, audio, and recent practice flow surfaces), TASK-053 (knowledge maintenance sweep round 2), TASK-054 (security review of storage, server, sample-loading, and microphone-permission surfaces). Skipped: exam grill (not due).
- Retro: no new process failure found. Existing process drift from INS-025 was fixed in AGENTS.md so the end-of-run rule matches git-workflow.md's shared-tree caveat. The duplicate INS-031 ID is scheduled for TASK-053 cleanup rather than fixed ad hoc during the heartbeat.
- Next up: 1. TASK-048 — owner explicitly called notation fullscreen + staff/TAB toggles a really big problem and ASAP; it directly blocks readable practice. 2. TASK-049 — makes the runner follow the intended play -> assess -> continue loop and stops setup time from counting as practice. 3. TASK-050 — fixes play-along control gaps from NOTE-011: separate guitar/click volume and tempo up to 200 BPM. TASK-051 is the small follow-up for confusing placeholder pages; TASK-052/TASK-053/TASK-054 are due hygiene but rank behind the owner-reported practice blockers.
- Owner decisions needed: none blocking this beat. The moving-exercise/JSON-pack arc (INS-032/INS-033) is intentionally deferred until the urgent runner usability fixes ship.
