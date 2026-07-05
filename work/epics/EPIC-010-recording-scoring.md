---
id: EPIC-010
title: Recording & scoring — record a take, get a score
vision: VIS-001
status: backlog
created: 2026-07-05
---

# EPIC-010 — Recording & scoring

## Goal

During a guided exercise the user can hit record, play, and receive a score: how close the take was to the exercise's target notes and timing.

## Why

Objective feedback closes the practice loop and feeds honest progress tracking. This was previously a vision non-goal; VIS-001 now stages it in as the product's riskiest bet.

## Scope

- **Feasibility research first** (blocking): browser guitar pitch detection — monophonic vs polyphonic limits, latency, libraries (Web Audio + WASM options), realistic scoring quality. Result decides how far this epic goes.
- Microphone capture via Web Audio with a clean permission flow and level meter
- Take analysis: detected notes/onsets vs the exercise's expected notes/timing → a 0–100 score with per-note feedback
- Score persisted onto the session record (EPIC-008's runner), surfaced in history and dashboard (EPIC-012)
- Local-only audio: takes are analyzed in the browser and not uploaded anywhere (no backend exists — ADR-002)

## Out of scope

- Transcription of free playing, tone/feel judgment, chord (polyphonic) scoring in v1 — single-note lines first
- Storing audio long-term (score + metadata only, unless research says keeping takes is cheap and useful)

## Depends on

- EPIC-008 (runner and exercise model provide the expected-notes target)

## Tasks

- TASK-015 — Research browser audio recording & pitch-detection feasibility
- (implementation tasks created after the research lands)

## Done when

A user records a monophonic scale exercise and gets a credible score with per-note feedback, and that score appears in their practice history.
