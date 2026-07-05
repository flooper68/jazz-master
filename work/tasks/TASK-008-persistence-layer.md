---
id: TASK-008
title: Typed localStorage persistence layer
epic: EPIC-001
status: in-progress
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

- [ ] Typed `get`/`set` per named store; TypeScript rejects writing the wrong shape
- [ ] Corrupt or missing data never throws to callers — returns the store's default and logs
- [ ] Schema `version` stored per store with a migration hook (test with a fake v1→v2 migration)
- [ ] No direct `localStorage` access outside `src/storage/` (convention documented in CLAUDE.md or architecture overview)
- [ ] Unit tests cover round-trip, defaults, corrupt JSON, and migration
- [ ] `bun run check` passes

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
