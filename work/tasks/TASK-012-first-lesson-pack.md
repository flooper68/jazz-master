---
id: TASK-012
title: First lesson pack — scales & arpeggios
epic: EPIC-008
status: done
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

- [x] ≥8 lessons across `scales` and `arpeggios`, ≥2 levels each, with prerequisites and estimated minutes
- [x] All lessons pass `validateLesson`; every exercise resolves to concrete notes/positions in a test that iterates the whole pack
- [x] Lesson list is browsable somewhere minimal (even a plain list on the Practice page) so content is inspectable before the runner lands
- [x] `bun run check` passes

## Verification

`bun run test` (pack-wide resolution test). `bun run dev` → Practice page lists the lessons.

## Log

### 2026-07-06 — claimed (agent)

Plan: author the pack as typed data in `apps/web/src/content/lessons.ts` (exported via the
content barrel), 10 lessons in two anchored windows (low frets 0–4, mid frets 5–9, per the
TASK-010 position system): scales — major L1 in both windows (keys C/G/F and Bb/Eb/C),
dorian L2 and mixolydian L2 (chord-scale connection to m7/7), ii–V–I chord-scale chain L3;
arpeggios — maj7 L1, m7 L1 (prereq maj7), dom7 L2, m7b5 L2, ii–V–I arpeggio chain L3.
Real prerequisite edges within and across levels; each lesson 3–4 exercises × 3–4 min,
estimatedMinutes = sum of exercise durations. Tests: `lessons.test.ts` — `validateLessons`
returns no problems, every exercise in the pack resolves via `resolveExercise` to non-empty
notes AND positions containing the root, plus criteria-shaped assertions (≥8 lessons, both
areas ≥2 levels, ids unique). Browsability: PracticePage renders the pack as a plain grouped
list (title, level, minutes, exercise count, prereqs) + first `PracticePage.test.tsx`.
Measurable aim (product): Practice page goes from placeholder text (baseline) to listing a
two-week beginner curriculum (~10 lessons) resolvable to concrete notes; signal = pack-wide
resolution test green + lessons visible on /practice in dev.

### 2026-07-06 — done

Shipped as planned: `content/lessons.ts` — 10 lessons / 42 exercises (scales: major L1 ×2
covering C/G/F/Bb/Eb, dorian L2, mixolydian L2, ii–V–I chord-scale chain L3; arpeggios:
maj7 L1, m7 L1, dom7 L2, m7b5 L2, ii–V–I chain L3), all in the two anchored windows
(0–4, 5–9), tempo 60→80 bpm by level, estimatedMinutes = summed exercise minutes.
`lessons.test.ts` validates the whole pack (`validateLessons` → `[]`), re-resolves every
exercise, and checks window containment + every spelled note's pitch class actually
sounds; also enforces pack shape and prerequisite-level monotonicity. PracticePage renders
the pack grouped by area with level/minutes/exercise-count/prereq titles + first page test
(`PracticePage.test.tsx`). Manual verification: dev server + Playwright on /practice — all
10 lessons listed under Scales/Arpeggios headings, console clean. Independent review
(code-reviewer agent): no correctness findings; both should-fixes fixed in-diff —
duplicated accidentals helper collapsed by moving `displayAccidentals` from
`components/notation.ts` into `@jazz-master/theory` (pure string fn; content may not
import components, both layers import theory; + notation.test.ts), and the "flat keys"
lesson retitled "adding flat keys" since it includes C major. Review nit (label casing
"C major" vs "D Dorian") kept deliberately: mode names derive from proper nouns, "major"
is a common noun — standard music-prose convention. `bun run check` green (422 tests).
