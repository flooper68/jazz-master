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
- Read the latest `work/REGRESSION.md` run if it exists. If it is missing or
  stale for the changed product areas, note that as a review setup gap and
  recommend/schedule `processes/regression-testing.md`.
- Read the in-progress epics' **Done when** sections and the vision's pillars (`strategy/VIS-001-jazz-master.md`).
- Choose 3-5 short review charters before opening the app. Default charters:
  practice-loop value, navigation/responsiveness, accessibility/keyboard,
  persistence/data resilience, and edge/error states. Add a specific charter for
  the most recently shipped product surface.

### 2. Inspect the running app

- First run the e2e smoke suite: `bun run --cwd codebase check:e2e` (TASK-035). A red suite is itself a finding; the manual pass then focuses on judgment, not on re-proving the covered happy paths.
- `bun run --cwd codebase dev`, then drive the app — in Claude Code use the Playwright MCP tools (navigate, snapshot, screenshot each page).
- Walk **every** module/page, not just recently-changed ones (regressions hide in untouched screens).
- Re-verify recently shipped tasks' acceptance criteria *in the app*, not in the code.
- Record browser console errors/warnings and unexpected network requests. For a
  local-first surface, any external request needs an explicit explanation.
- Check at least one phone-width viewport (~375px) and one desktop viewport.
- Quality sweep on each screen:
  - browser console clean (no errors/warnings)
  - relevant network panel clean; no unexpected external calls
  - usable at phone width (~375px) and desktop
  - keyboard navigation reaches interactive elements in a logical order, focus is visible, and there are no keyboard traps
  - semantic page structure: one clear page heading, useful page title if implemented, named controls/links, named diagrams/images, and no interactive element exposed only by color or position
  - obvious contrast, reflow, target-size, and label/instruction problems
  - empty states, loading states, nonsense input
  - stored/local data survives refresh and corrupt/missing data fails gracefully where relevant
- When a screen has forms or practice controls, check label text, error messages,
  disabled/enabled states, status feedback, keyboard operation, and refresh
  behavior.
- Take screenshots only when they clarify a finding or document a visual
  baseline; screenshots are evidence, not a substitute for written observations.

### 3. Product judgment

Harder and more valuable than defect-hunting. Ask, per the vision:

- Is this feature a **practice loop** or has it drifted into reference material?
- Would an intermediate jazz guitarist actually use this four times a week? What's the friction?
- What's the smallest missing thing that would make the current state genuinely useful?
- Is progress visible to the user (mastery, streaks, tempo milestones)?
- What product outcome should improve if this finding becomes work?
- What evidence supports the finding: dogfooding, external user feedback, reproduced app behavior, analytics, or research?
- Does this need direct implementation, a discovery/validation step, or rejection as not-now?

### 4. File the findings

- Defects → `work/issues/ISSUE-###.md` (with repro, severity)
- Product gaps, ideas, friction observations → `work/insights/INS-###.md`. Where the review produced enough evidence, record a **baseline observation** (the current condition as seen in this review), a **candidate target state**, the **affected practice workflow**, and the **validation need** (`dogfood`, `external user`, `research/spike`, or `direct task candidate`) — this seeds the problem brief triage needs (RES-008 / RES-011).
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
Charters run, pages/flows walked, viewports used, and screenshots if useful.

## Health
Overall assessment: what's solid, what's fragile, vision alignment.

## Findings
One line per filed item with severity/rationale, evidence, baseline observation,
candidate target, and validation need (`dogfood`, `external user`,
`research/spike`, or `direct task candidate`).

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

Product handoff quality bar: a future triage pass should be able to decide
accept / reject / defer from the report and filed items without reconstructing
the whole review session.
