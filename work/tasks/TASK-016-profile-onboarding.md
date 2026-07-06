---
id: TASK-016
title: Practice profile & onboarding flow
epic: EPIC-011
status: done
depends_on: [TASK-008]
created: 2026-07-05
---

# TASK-016 — Practice profile & onboarding flow

## Goal

A first-run onboarding that captures who the guitarist is — level per area, goals, minutes per day — into a locally persisted practice profile the planner can consume.

## Context

"User logs in" in the desired flow maps to a local profile (ADR-002 — no accounts; unchanged by ADR-006, which keeps practice state local). Profile shape (the TASK-017 planner is the consumer, so agree the contract here): self-assessed level per area (`scales | arpeggios | chords | standards`, plus room for `ears`), ordered goal areas ("what do you want to get better at?"), and a daily time budget (e.g. 10/20/30/45 min). Stored via TASK-008 under a `profile` store.

UX: a short (~3-step) wizard on first visit — friendly, skippable with sensible defaults, editable later from a settings/profile surface. Keep it honest to the zero-tension promise: under a minute to complete.

## Acceptance criteria

- [x] Fresh browser (no stored profile) → onboarding wizard; completing it persists a typed profile
- [x] Skipping yields a usable default profile (documented defaults)
- [x] Profile editable afterwards (minimal settings page or dashboard entry point)
- [x] Returning user with a profile never sees onboarding again
- [x] Component tests: wizard happy path, skip path, edit path
- [x] `bun run check` passes

## Verification

`bun run test`. `bun run dev` in a clean profile (or after clearing storage) → wizard runs, profile persists across refresh.

## Log

### 2026-07-06 — claimed (agent)

Measurable aim: baseline = fresh visitor gets the dashboard with no notion of who they are and the TASK-017 planner has no profile to consume; target = first visit runs a ≤3-step, skippable wizard (under a minute: every field defaulted) that persists a typed `PracticeProfile`, editable later, never shown again once one exists.

Plan:
- `storage/profile.ts` — the TASK-017 contract: `PracticeArea` (`scales | arpeggios | chords | standards | ears`), `SkillLevel` (1–3, matching lesson `level` tiers), `PracticeProfile` { levels per area, ordered goalAreas, minutesPerDay, createdAt }. `profileStore = defineStore<PracticeProfile | null>` (null = onboarding not done), `defaultProfile()` documents the skip defaults (all levels 1, goals [scales, arpeggios] — the shipped lesson pack, 20 min/day).
- `components/OnboardingWizard.tsx` — 3 steps (levels → goal areas, selection order = priority → minutes), every step skippable, `onComplete(profile)` callback; App persists. Focus moves to the step heading on step change (don't reintroduce ISSUE-002 in new code).
- Shared field components (`components/ProfileFields.tsx`) reused by a minimal `pages/ProfilePage.tsx` (`/profile` route + nav link) for the edit path.
- App-level gate: no profile → wizard instead of routes (any path), so a fresh browser always onboards; returning users go straight in.
- Tests: profile defaults unit test; wizard happy/skip/goal-order component tests; ProfilePage edit-persists test; App gate tests (fresh → wizard, completed → dashboard, existing profile → no wizard). Storage touched → security-review checklist pass noted at record time.

### 2026-07-06 — done

Shipped a typed `PracticeProfile` store plus first-run onboarding, skip defaults, `/profile` editing, and app-level gating so users with no profile onboard before routes and returning users go straight to the app. Added focused tests for profile defaults/storage, wizard happy/skip/focus/back paths, profile edit persistence, and App route gating. Review checklist pass found one mobile overflow risk in the shared field rows; fixed with wrapping controls. Security/privacy checklist: no concerns — local-only typed store, no secrets, no network, missing/corrupt data falls back through `defineStore`. Note: an independent subagent review was not run because this session's tool policy disallows spawning subagents unless explicitly requested; local checklist review completed instead.

Verification: `bun run --cwd codebase check` passed (452 tests); `bun run dev` at `http://127.0.0.1:5173/practice` in a clean browser showed onboarding, skip entered Practice, refresh stayed on Practice without re-showing onboarding.
