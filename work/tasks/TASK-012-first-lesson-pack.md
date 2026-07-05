---
id: TASK-012
title: First lesson pack — scales & arpeggios
epic: EPIC-008
status: backlog
depends_on: [TASK-010, TASK-011]
created: 2026-07-05
---

# TASK-012 — First lesson pack: scales & arpeggios

## Goal

Enough real curriculum for a beginner-in-jazz to practice from for two weeks: a leveled set of scale and arpeggio lessons authored in the TASK-011 model.

## Context

Content, not code — but generated from theory (TASK-009/010), so a lesson says "C major, position 2, ascending/descending, 60 bpm target" and the notes come out of the theory core. Suggested v1 pack (~8–12 lessons across 2–3 levels):

- **Scales L1**: major scale in two positions, keys C/F/Bb/Eb/G
- **Scales L2**: dorian and mixolydian in the same positions (chord-scale connection to m7/7)
- **Arpeggios L1**: maj7 and m7 arpeggios, two positions
- **Arpeggios L2**: 7 and m7b5 arpeggios; L1 prerequisite

Exact content is the implementer's judgment as a jazz-guitar curriculum — keep lessons ~10–15 estimated minutes, real prerequisites between levels.

## Acceptance criteria

- [ ] ≥8 lessons across `scales` and `arpeggios`, ≥2 levels each, with prerequisites and estimated minutes
- [ ] All lessons pass `validateLesson`; every exercise resolves to concrete notes/positions in a test that iterates the whole pack
- [ ] Lesson list is browsable somewhere minimal (even a plain list on the Practice page) so content is inspectable before the runner lands
- [ ] `bun run check` passes

## Verification

`bun run test` (pack-wide resolution test). `bun run dev` → Practice page lists the lessons.
