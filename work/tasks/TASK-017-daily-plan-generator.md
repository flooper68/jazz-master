---
id: TASK-017
title: Daily plan generator v1
epic: EPIC-011
status: backlog
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

- [ ] `generatePlan` is pure and deterministic (same inputs → same plan); unit tests cover the five rules, including time-budget fit and shaky-resurfacing
- [ ] Plan items carry reasons; empty history and empty-profile (skipped onboarding) cases produce a sensible starter plan
- [ ] Today's plan is rendered, starts the runner, reflects completed sessions, and survives refresh
- [ ] `bun run check` passes

## Verification

`bun run test`. `bun run dev` → complete a plan item badly (grade "missed"), regenerate tomorrow's plan with a mocked date in a test → the lesson resurfaces with a reason.
