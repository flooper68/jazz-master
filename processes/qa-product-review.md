# Process: QA / product review

A periodic inspection of the *running product* that generates the raw material for the next round of work. This is where problems get identified — the counterpart to the dev loop, which only verifies what a task claimed.

## When

- After an epic reaches `done`
- Every ~5 shipped tasks (cadence enforced by `processes/heartbeat.md`, which schedules the review as a task when due), or
- On demand ("run a QA review")
- After security/privacy-sensitive product slices, such as storage, import/export, audio recording, or browser permissions

## Steps

### 1. Prepare

- List work shipped since the last `work/reviews/REV-###.md` (git log + task files).
- Read the in-progress epics' **Done when** sections and the vision's pillars (`strategy/VIS-001-jazz-master.md`).

### 2. Inspect the running app

- `bun run dev`, then drive the app — in Claude Code use the Playwright MCP tools (navigate, snapshot, screenshot each page).
- Walk **every** module/page, not just recently-changed ones (regressions hide in untouched screens).
- Re-verify recently shipped tasks' acceptance criteria *in the app*, not in the code.
- Quality sweep on each screen:
  - browser console clean (no errors/warnings)
  - relevant network panel clean; no unexpected external calls
  - usable at phone width (~375px) and desktop
  - keyboard navigation works for interactive elements; obvious a11y misses (missing labels, contrast)
  - empty states, loading states, nonsense input
  - stored/local data survives refresh and corrupt/missing data fails gracefully where relevant

### 3. Product judgment

Harder and more valuable than defect-hunting. Ask, per the vision:

- Is this feature a **practice loop** or has it drifted into reference material?
- Would an intermediate jazz guitarist actually use this four times a week? What's the friction?
- What's the smallest missing thing that would make the current state genuinely useful?
- Is progress visible to the user (mastery, streaks, tempo milestones)?

### 4. File the findings

- Defects → `work/issues/ISSUE-###.md` (with repro, severity)
- Product gaps, ideas, friction observations → `work/insights/INS-###.md`. Where the review produced enough evidence, record a **baseline observation** (the current condition as seen in this review) and a **candidate target state** — this seeds the problem brief triage needs (RES-008).
- Raw feedback batches or review notes worth preserving → `notes/NOTE-###.md`, with extracted work linked
- Do NOT fix anything during the review — the review only observes and files. Fixes go through the dev loop.

### 5. Write the report

`work/reviews/REV-###-<date>.md`:

```markdown
---
id: REV-003
date: 2026-07-05
scope: [TASK-005..TASK-009, EPIC-001]
filed: [ISSUE-004, ISSUE-005, INS-011, INS-012]
---

# REV-003 — QA/product review

## Inspected
What was walked through, with screenshots if useful.

## Health
Overall assessment: what's solid, what's fragile, vision alignment.

## Findings
One line per filed item with severity/rationale.

## Recommended next
Ordered suggestion for what triage should prioritize.
```

### 6. Hand off

Ship the report + filed items (`REV-###:` commit). Then run or request `processes/triage.md` and `processes/prioritization.md` so findings become ordered actionable work.

The handoff is not complete until the report lists:

- top defects
- top product frictions
- recommended next 1-3 work items
- anything that needs owner confirmation
