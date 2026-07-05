---
id: ADR-002
title: Local-first, no backend, no accounts
status: accepted
date: 2026-07-05
---

# ADR-002 — Local-first: no backend, no accounts

## Context

The product hypothesis (guitarists will practice with a structured web companion) is unproven. A backend adds cost, auth, privacy, and deployment burden before a single user has practiced a single ii–V–I.

## Decision

All state (progress, sessions, repertoire) lives in the browser via localStorage, behind a typed persistence wrapper. No server, no accounts, no telemetry. The app is a static bundle.

## Consequences

- Ship and host anywhere static; zero operational cost.
- Data is per-browser: no sync across devices, wiped if the user clears storage. Acceptable for validation; an export/import (JSON download) escape hatch is cheap insurance and should be an early task once real progress data exists.
- The persistence wrapper is the seam: if the product proves itself, a backend replaces the wrapper's implementation, not the app (record that switch in a superseding ADR).
