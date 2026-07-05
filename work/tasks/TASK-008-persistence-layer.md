---
id: TASK-008
title: Typed localStorage persistence layer
epic: EPIC-001
status: done
depends_on: []
created: 2026-07-05
---

# TASK-008 — Typed localStorage persistence layer

## Goal

A typed wrapper around localStorage (per ADR-002) that every feature uses for persistence — profile, sessions, plans, mastery — so a real backend can replace it later without touching feature code.

## Context

EPIC-001 lists persistence as scope but no task existed. Everything in the new product direction (planner, history, dashboard, lesson progress) reads and writes durable state, so this is now on the critical path. Suggested shape: `src/storage/` with a small store API — per-key namespaces (e.g. `profile`, `sessions`), each with a typed schema, a schema `version`, and a migration hook. Pure logic; React integration (a hook) can be a thin layer on top or deferred to first use.

**ADR-005 note (2026-07-05):** this wrapper is built inside the web app (after TASK-027: `codebase/apps/web/src/storage/`). Extraction to `packages/storage` is deliberately deferred — the trigger (a second app needing persistence) is recorded in ADR-005. Do not create a package for it in this task.

## Acceptance criteria

- [x] Typed `get`/`set` per named store; TypeScript rejects writing the wrong shape
- [x] Corrupt or missing data never throws to callers — returns the store's default and logs
- [x] Schema `version` stored per store with a migration hook (test with a fake v1→v2 migration)
- [x] No direct `localStorage` access outside `src/storage/` (convention documented in CLAUDE.md or architecture overview)
- [x] Unit tests cover round-trip, defaults, corrupt JSON, and migration
- [x] `bun run check` passes

## Verification

`bun run test` — storage suite green. Grep `localStorage` outside `src/storage/` returns nothing.

## Log

### 2026-07-06 — claimed (agent)
Plan: `apps/web/src/storage/` with a `defineStore<T>({ name, version, defaultValue, migrate? })`
factory returning a typed `Store<T>` (`get`/`set`/`update`/`reset`). Values persist under
`jazz-master:<name>` in a `{ version, data }` envelope. Read path never throws: missing key,
corrupt JSON, malformed envelope, version-ahead, or failed migration all fall back to
`defaultValue()` with a `console.warn`. `migrate(persisted, fromVersion)` runs when the stored
version is older; the migrated value is written back. Pure logic, no React hook yet (deferred
to first consumer per task context). Convention (no direct `localStorage` outside
`src/storage/`) documented in architecture/overview.md + CLAUDE.md. Measurable aim: baseline —
no durable state possible; target — typed stores with migration, exhaustively unit-tested,
verification = storage suite green + grep clean.

### 2026-07-06 — done
Shipped `defineStore` as planned: 14 tests covering round-trip, envelope shape, fresh defaults,
corrupt JSON, malformed envelope, read/write failures (disabled storage, quota), update, reset,
and v1→v2 migration (happy path, throwing migration, missing migration, version-from-the-future).
Independent code review (code-reviewer agent + security checklist) found one blocker — a strict-TS
error in the `isEnvelope` guard — fixed by narrowing on `'version' in value` instead of a cast.
Review also prompted the read-throws test (SSR/TASK-021 safety) and moving a migration assertion
out of the callback. Security/privacy checklist: no concerns (no deps, no network, typed +
versioned + corrupt-tolerant). Convention documented in CLAUDE.md, AGENTS.md, and
architecture/overview.md. `bun run check` green (393 tests); grep for `localStorage` outside
`src/storage/` clean. No React hook yet — deferred to first consumer per task context.
This was EPIC-001's last open task — epic closed in the same change.
Review observations needing no action, recorded for posterity: a store value serializing to
`undefined` drops the `data` key and reads back as the default (fine for our object-shaped
stores), and `Store.name` is currently unused API surface kept as a debugging affordance.
Ship note: a concurrent session's commit `5b63bcd` swept this task's staged in-flight files
onto main before review completed (see INS-008); the reviewed final state landed in `12851f7`.
