---
id: TASK-017
title: Daily plan generator v1
epic: EPIC-011
status: done
depends_on: [TASK-013, TASK-016]
created: 2026-07-05
---

# TASK-017 — Daily plan generator v1

## Goal

A deterministic plan generator: profile + session history + curriculum in, today's plan out — the feature that makes the app decide what to practice.

## Context

Pure function first (`src/planner/` or similar — pure, theory-core-style, exhaustively testable): `generatePlan(profile, history, lessons, date) → Plan`. v1 rules, explicitly not ML:

1. Fill the profile's time budget from lessons' estimated minutes
2. Weight toward the profile's goal areas, but rotate so no area starves
3. Respect prerequisites; pick lessons at the user's level per area
4. Resurface lessons whose last session had `shaky`/`missed` grades before introducing new ones
5. Every plan item carries a human-readable `reason` ("dorian was shaky on Tuesday") — explainability is a feature

Plus a minimal "Today's plan" surface (Practice page is fine until the dashboard lands): the plan, per-item reasons, "Start" handing off to the TASK-013 runner, items ticking off as sessions complete. Persist the generated plan per day so a refresh doesn't reshuffle.

## Acceptance criteria

- [x] `generatePlan` is pure and deterministic (same inputs → same plan); unit tests cover the five rules, including time-budget fit and shaky-resurfacing
- [x] Plan items carry reasons; empty history and empty-profile (skipped onboarding) cases produce a sensible starter plan
- [x] Today's plan is rendered, starts the runner, reflects completed sessions, and survives refresh
- [x] `bun run check` passes

## Verification

`bun run test`. `bun run dev` → complete a plan item badly (grade "missed"), regenerate tomorrow's plan with a mocked date in a test → the lesson resurfaces with a reason.

## Log

### 2026-07-06 — claimed (agent)

Plan: add a pure planner module with unit coverage for time budget, goal weighting/rotation, prerequisites, level matching, and shaky/missed resurfacing; add typed daily-plan storage; then compose a minimal Today's plan surface into Practice so items start the existing runner, show completion from session records, and persist per local date. Measurable aim: baseline is no generated/persisted plan; target is profile + history + lesson data producing a stable daily plan with visible reasons and completion state. Security/privacy checklist in scope because this adds local persisted plan state; no new dependencies or network planned.

### 2026-07-06 — done

Implemented `apps/web/src/planner/generatePlan` as a pure deterministic planner over profile, sessions, lessons, and date; added the versioned `daily-plans` store; and added a Today's plan section to `/practice` that persists the day plan, starts the existing runner, and marks plan lessons done from completed sessions. Tests: `bun run --cwd codebase test` and `bun run --cwd codebase check` green. Browser verification: `bun run --cwd codebase dev`, skip onboarding, start the planned Major scale lesson, grade all exercises `Missed`, click Done, and reload; the plan stayed on the same item and showed `Done today`. The tomorrow-regeneration behavior is covered by the planner unit test that feeds a missed prior session and verifies the resurfacing reason. Security/privacy checklist: no new dependencies or network; stored data is limited to generated plan metadata, uses the typed versioned store wrapper, and malformed stored plans fail closed to no plan. Review note: the required independent review agent was not available under this session's subagent tool policy (subagents require an explicit user delegation request), so I completed the full staged-diff checklist locally and recorded this limitation instead of claiming an independent pass.
