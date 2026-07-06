---
id: TASK-013
title: Guided practice session runner
epic: EPIC-008
status: done
depends_on: [TASK-008, TASK-012]
created: 2026-07-05
---

# TASK-013 — Guided practice session runner

## Goal

The heart of the product loop: start a lesson, be guided exercise by exercise (display + timer + self-grade), and have the finished session persisted as a session record.

## Context

Runner UI on the Practice page (`codebase/apps/web/src/pages/PracticePage.tsx` + components). Per exercise: show what to play (fretboard via TASK-003 rendering the TASK-010 positions; tempo target as text until the metronome exists), a countdown or repetition counter, and self-grade buttons — got it / shaky / missed — then advance. End of lesson: summary screen, session persisted.

This task also defines the **session record** (the contract EPIC-011 planner and EPIC-012 history consume): id, timestamp, lesson id, per-exercise grades, duration, and an optional `score` slot reserved for EPIC-010. Store it via TASK-008 storage under a `sessions` store. Keep session-flow state in a plain reducer/hook, components thin.

## Acceptance criteria

- [x] From the lesson list, "Start" runs the runner through all exercises in order with per-exercise self-grading
- [x] Fretboard display shows the exercise's actual positions (not a placeholder)
- [x] Abandoning mid-lesson persists a partial session (marked incomplete) — no lost history
- [x] Completed session persisted with the record shape above; summary screen shows grades
- [x] Component tests: full happy path through a 2-exercise fixture lesson, and the abandon path
- [x] `bun run check` passes

## Verification

`bun run test`. `bun run dev` → run a real lesson end to end; refresh; session JSON visible via the storage layer (devtools) with correct grades.

## Log

### 2026-07-06 — claimed (agent)

Plan: session record + `sessionsStore` (`PracticeSession[]`, v1) in `apps/web/src/storage/sessions.ts` — id, lessonId, ISO startedAt, durationSeconds, completed flag, per-exercise `{exerciseId, grade}` results, optional `score` slot (EPIC-010). Runner state in a pure reducer inside `components/usePracticeRunner.ts` (exported for unit tests); `PracticeRunner.tsx` composes it: per-exercise fretboard via `resolveExercise` → highlights (degree 1 = root), tempo as text, countdown for minutes-durations (repetition durations render as static count — the v1 pack has none), got-it/shaky/missed buttons, summary screen. Persistence is incremental: the session record is upserted after every grade (incomplete until the last), so abandon/refresh never loses graded history; "End lesson" just exits. Session id/startedAt generated in the page's Start handler (render stays pure). Measurable aim: baseline = lessons are browse-only, no session can be run or persisted; target = full lesson runnable end to end with the session record in the `sessions` store — verification signal is the component happy-path/abandon tests plus a manual dev-server run checking the persisted JSON.

### 2026-07-06 — done

Shipped as planned; all criteria verified. Tests: 4 reducer unit tests, 4 runner component tests (happy path through a 2-exercise fixture, abandon, nothing-persisted-until-graded, real resolved fretboard positions incl. root at string 5 fret 3), sessions-store upsert tests, and a PracticePage start/end flow test — `bun run check` green (434 tests). Manual verification in the dev server (Playwright): full "Major scale I" run graded got-it/shaky/missed → summary + completed record in `jazz-master:sessions` with correct grades; abandon via End lesson and via mid-lesson refresh both left an incomplete record with the earned grades. Review: `code-reviewer` + `ui-code-reviewer` passes, no must-fix. Deviation from plan, driven by both reviews: persistence moved from the grade handler (which re-ran the reducer against possibly-stale closure state — rapid double-click could desync record from committed state) into a `useEffect` synced on runner state; re-verified the double-click case live. Also from review: `Array.isArray` guard in `upsertSession` (defineStore validates the envelope, not `T`), focus-visible outlines matching `Layout.tsx` on all new buttons, countdown interval stops at 0 with an `aria-live` expiry announcement, runner keyed by session id. Deferred findings filed: ISSUE-002 (focus loss on list↔runner↔summary swaps — needs an app-wide pattern), INS-014 (session-record semantics for EPIC-011/012: `durationSeconds` = time-to-last-grade, zero-grade abandons persist nothing, double-click grades an unseen exercise; plus polish nits). Note for triage: untriaged INS-013 (dev-time `validateLessons` assertion) suggested itself for this task's scope but wasn't accepted into it — left in the inbox rather than invented into scope.
