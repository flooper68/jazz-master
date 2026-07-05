---
id: EPIC-012
title: Dashboard & history — momentum at a glance
vision: VIS-001
status: backlog
created: 2026-07-05
---

# EPIC-012 — Dashboard & history

## Goal

The dashboard is the app's front door: today's plan, streak, recent scores, and what's improving — and behind it a full, browsable history of every practice session.

## Why

"Progress you can see" is a vision pillar, and the dashboard is the first thing the user meets in the desired flow. History is also the planner's memory (EPIC-011) — the same session records power both.

## Scope

- **Session record model** (shared contract with EPIC-008's runner and EPIC-011's planner): when, what lesson/exercises, duration, self-grades, scores (once EPIC-010 lands)
- **History page**: sessions by day, drill into a session's exercises and grades; simple filters (area, date range)
- **Dashboard page** (replaces the `/` stub): today's plan + start button, streak, minutes this week, per-area trend (accuracy/scores), "needs attention" callouts
- Empty states that guide a fresh user into onboarding (EPIC-011) and their first lesson

## Out of scope

- Social sharing, exports; heavy charting libraries (start with simple SVG/CSS visuals)

## Depends on

- EPIC-001 (persistence), EPIC-008 (session records exist), EPIC-011 (a plan to display)

## Tasks

- TASK-018 — Practice history page (session record model is defined by TASK-013's runner)
- TASK-019 — Dashboard v1
- (more as discovered)

## Done when

Opening the app shows, in one glance, what to practice now and how the last few weeks went; every past session is findable and inspectable.
