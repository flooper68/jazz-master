---
id: VIS-001
title: Jazz Master — a practice companion for jazz guitarists
status: active
created: 2026-07-05
---

# VIS-001 — Jazz Master

## Vision

Jazz Master is a web app that helps guitarists actually get better at jazz. Not another chord chart site — a structured practice companion that knows what jazz guitarists need to internalize (scales, arpeggios, voicings, progressions, repertoire, vocabulary, ears) and turns that into focused, measurable daily practice.

The core promise is **zero-tension practice**: open the app, pick up the guitar, and play. The app has already decided what today's session is — appropriate to your level, goals, and history — and guides you through it exercise by exercise, showing both standard notation and tablature. You can record yourself and get a score; every session lands in your history, and the dashboard shows the momentum.

## Who it's for

Intermediate guitarists who can already play but are learning the jazz language: comping through standards, navigating ii–V–I's in every key, building a repertoire, and training their ears. Beginners in jazz, not beginners on the instrument.

## What makes it different

1. **Guitar-first.** Everything is rendered for the guitar: fretboards, grip diagrams, and tablature alongside standard notation. Voicings are real, playable grips (drop 2, drop 3, shell voicings), position-aware.
2. **The app decides, you play.** Not a menu of reference material — a daily practice plan generated from your level, goals, and history, delivered as guided lessons. Removing the "what should I practice?" decision is the product.
3. **Practice loops, not reference material.** The app drills you: "play this ii–V–I in Bb, now in Eb, now with drop 2 voicings on the top string set." Content exists to feed drills and lessons.
4. **Feedback you can trust.** Record yourself playing an exercise and get a score (pitch/timing analysis in the browser). Self-grading first, machine scoring as it matures.
5. **Progress you can see.** Session history, scores, streaks, keys mastered, tunes learned, tempo milestones — the dashboard makes momentum visible.

## Pillars (map to epics)

- **Foundation** — app shell, music-theory core, fretboard rendering, persistence (EPIC-001)
- **Chord voicings** — jazz voicing library and drills (EPIC-002)
- **Progression trainer** — ii–V–I and friends, all twelve keys (EPIC-003)
- **Practice tools** — metronome, timers, session infrastructure (EPIC-004)
- **Repertoire** — standards tracker and study aids (EPIC-005)
- **Ear training** — chord qualities, intervals, progressions by ear (EPIC-006)
- **Curriculum & lessons** — leveled lesson content per area (scales, arpeggios, chords, standards) and a guided practice runner (EPIC-008)
- **Notation & tabs** — render exercises as standard notation + tablature (EPIC-009)
- **Recording & scoring** — record an exercise take, analyze pitch/timing, score it (EPIC-010)
- **Adaptive practice planner** — profile + history → today's plan (EPIC-011)
- **Dashboard & history** — practice log, scores, streaks, momentum at a glance (EPIC-012)

## Non-goals (for now)

- Social features, sharing, multiplayer
- Native mobile apps — responsive web only
- Notation *editing* / arbitrary score import — we render our own exercise content, we are not a notation editor
- Accounts and backend — local-first in the browser (ADR-002); "logging in" is a local profile until the product proves itself
- Bundled copyrighted material (lead sheets, transcriptions)

## Riskiest bet

Recording + machine scoring (EPIC-010) is the highest-uncertainty pillar — browser pitch detection on guitar (polyphony, latency) may cap how good the score can be. It is staged: self-graded practice ships first and the product works without it; scoring lands behind research (feasibility spike before any UI).

## Success looks like

A guitarist opens Jazz Master four times a week, is handed a 20-minute session appropriate to their level, plays through it reading notation/tabs without making a single decision, and after three months the dashboard shows it: streaks, rising scores, and comping through a standard in any key without thinking about grips.
