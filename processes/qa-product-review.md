# Process: QA / product review

A periodic inspection of the *running product* that generates the raw material for the next round of work. This is where problems get identified — the counterpart to the dev loop, which only verifies what a task claimed.

## When

- After an epic reaches `done`
- Every ~5 shipped tasks, or
- On demand ("run a QA review")

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
  - usable at phone width (~375px) and desktop
  - keyboard navigation works for interactive elements; obvious a11y misses (missing labels, contrast)
  - empty states, loading states, nonsense input

### 3. Product judgment

Harder and more valuable than defect-hunting. Ask, per the vision:

- Is this feature a **practice loop** or has it drifted into reference material?
- Would an intermediate jazz guitarist actually use this four times a week? What's the friction?
- What's the smallest missing thing that would make the current state genuinely useful?
- Is progress visible to the user (mastery, streaks, tempo milestones)?

### 4. File the findings

- Defects → `work/issues/ISSUE-###.md` (with repro, severity)
- Product gaps, ideas, friction observations → `work/insights/INS-###.md`
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

Ship the report + filed items (`REV-###:` commit). Then run or request `processes/triage.md` so findings become actionable work.
