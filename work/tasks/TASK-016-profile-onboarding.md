---
id: TASK-016
title: Practice profile & onboarding flow
epic: EPIC-011
status: backlog
depends_on: [TASK-008]
created: 2026-07-05
---

# TASK-016 — Practice profile & onboarding flow

## Goal

A first-run onboarding that captures who the guitarist is — level per area, goals, minutes per day — into a locally persisted practice profile the planner can consume.

## Context

"User logs in" in the desired flow maps to a local profile (ADR-002 — no accounts). Profile shape (the TASK-017 planner is the consumer, so agree the contract here): self-assessed level per area (`scales | arpeggios | chords | standards`, plus room for `ears`), ordered goal areas ("what do you want to get better at?"), and a daily time budget (e.g. 10/20/30/45 min). Stored via TASK-008 under a `profile` store.

UX: a short (~3-step) wizard on first visit — friendly, skippable with sensible defaults, editable later from a settings/profile surface. Keep it honest to the zero-tension promise: under a minute to complete.

## Acceptance criteria

- [ ] Fresh browser (no stored profile) → onboarding wizard; completing it persists a typed profile
- [ ] Skipping yields a usable default profile (documented defaults)
- [ ] Profile editable afterwards (minimal settings page or dashboard entry point)
- [ ] Returning user with a profile never sees onboarding again
- [ ] Component tests: wizard happy path, skip path, edit path
- [ ] `bun run check` passes

## Verification

`bun run test`. `bun run dev` in a clean profile (or after clearing storage) → wizard runs, profile persists across refresh.
