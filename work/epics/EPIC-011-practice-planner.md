---
id: EPIC-011
title: Adaptive practice planner — profile + history → today's plan
vision: VIS-001
status: backlog
created: 2026-07-05
---

# EPIC-011 — Adaptive practice planner

## Goal

Every day the app has a plan waiting: a sequence of lessons/drills sized to the user's available time, matched to their level and goals, and adapted to what their history says needs work.

## Why

This is the pillar that makes the product "zero-tension": the user never decides what to practice. Everything else (curriculum, runner, history) exists so the planner has something to schedule and evidence to schedule with.

## Scope

- **Practice profile & onboarding**: self-assessed level per area, goals (what they want to get better at), minutes per day — stored locally ("logging in" = local profile per VIS-001/ADR-002)
- **Plan generator v1 — deterministic rules, not ML**: fill the time budget from goal areas, rotate areas, prefer lessons at the user's level, resurface exercises graded shaky/missed, respect lesson prerequisites
- **Today's plan** surface: what's queued, start it (hands off to the EPIC-008 runner), see it tick off as sessions complete
- Adaptation loop: session results (self-grades, later EPIC-010 scores) shift what tomorrow looks like
- Plan explainability: each item can say *why* it was picked ("Dorian was shaky on Tuesday")

## Out of scope

- Machine learning / spaced-repetition tuning beyond simple rules (v2, once history data exists)
- Calendar/notification integrations

## Depends on

- EPIC-001 (persistence), EPIC-008 (lessons to schedule, runner, session records)

## Tasks

- TASK-016 — Practice profile & onboarding flow
- TASK-017 — Daily plan generator v1
- (more as discovered)

## Done when

A user with a saved profile opens the app on a fresh day and sees a plan that fits their time budget and level, starts it with one click, and tomorrow's plan visibly reacts to how today went.
