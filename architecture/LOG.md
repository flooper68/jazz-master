# Engineering log

Chronological, append-only. One short entry per notable event: migrations, dead ends, gotchas, incidents, decisions too small for an ADR. Newest at the top.

---

## 2026-07-05 — RES-008/RES-009 fed forward into processes

Owner-directed research incorporation. From RES-008: problem-framing gate in triage, `## Problem brief` in the task template, measurable-aim preference in prioritization, baseline/target capture in QA review filing, and measurable-aim restatement in the dev-loop Plan step; remaining scope (product-practices.md, further research decision) stays with TASK-007. From RES-009: artifact-creation gained concrete design defaults, a mandatory rendered-QA verification loop, framework-avoidance and reveal.js boundaries, and a deferred trigger to extract a `visual-artifacts` skill at the next artifact request.

## 2026-07-05 — product direction expanded: guided-practice flow

Owner-directed strategy update (VIS-001, goals.md): the product's core promise is now a zero-tension guided flow — daily plan → guided lesson with notation/tabs → optional recording + scoring → history/dashboard. Recording/mic analysis moved from non-goal to staged riskiest bet; notation *rendering* is in scope (editing still out); "login" stays a local profile (ADR-002 unchanged). Added EPIC-008..012 (curriculum/lessons, notation & tabs, recording & scoring, adaptive planner, dashboard & history) and TASK-008..019, including research-first tasks for the two risky areas (notation rendering, audio scoring).

## 2026-07-05 — knowledge maintenance cleaned research links

Processed the current maintenance inbox: deferred INS-001 and INS-002 with revisit triggers, accepted/resolved INS-003, removed future research-ID reservations from backlog tasks, linked `RES-008` into TASK-007, and updated the relevant epic status notes. Future backlog research tasks now assign `RES-###` only when the research file is created.

## 2026-07-05 — artifact process and process-map presentation added

Added `processes/artifact-creation.md`, `artifacts/README.md`, and a standalone HTML/CSS/JS process-map presentation under `artifacts/process-map/`. `AGENTS.md` and `architecture/overview.md` now route human-facing rendered outputs to `artifacts/` while keeping Markdown docs canonical.

## 2026-07-05 — closed-loop process docs added

Added feedback intake, prioritization, security/privacy review, and knowledge-maintenance processes. Added `notes/` for raw source material and ADR-004 to record the closed-loop product process.

## 2026-07-05 — app shell shipped (TASK-001); react-router is v8, not v7

`bun add react-router` resolved to v8.1.0 (task text assumed v7); library-mode API is unchanged, so we're on v8 — docs referencing v7 remain applicable. Gotcha fixed en route: vitest runs without `globals`, so Testing Library's auto-cleanup never registered and test renders leaked into each other's DOM; `src/test/setup.ts` now calls `afterEach(cleanup)` explicitly.

## 2026-07-05 — project bootstrapped

Vite react-ts template scaffolded with Bun; Tailwind v4 (via `@tailwindcss/vite`, no config file) and Vitest/Testing Library added; `bun run check` established as the verification gate. Knowledge system (strategy/processes/architecture/work/research) created. Note: the current Vite template ships oxlint, not ESLint.
