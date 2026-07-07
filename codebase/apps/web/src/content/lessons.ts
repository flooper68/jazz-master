import { displayAccidentals } from '@jazz-master/theory'
import type { ChordQuality, FretRange } from '@jazz-master/theory'
import type { Exercise, Lesson, NoteName } from './types'

/**
 * The v1 scales & arpeggios pack (TASK-012): two weeks of beginner-in-jazz
 * material, authored against the TASK-011 model so every exercise resolves
 * through the theory core. Curriculum shape: major scale first (the five
 * common jazz keys), then the ii/V chord-scales, then the maj7→m7→7→m7b5
 * arpeggio ladder, capped by ii–V–I chains that string both tracks together.
 */

/** The two anchored fret windows the pack is played in (TASK-010 positions). */
const POSITIONS = {
  open: { window: { min: 0, max: 4 } as FretRange, label: 'open position' },
  middle: { window: { min: 5, max: 9 } as FretRange, label: 'middle position' },
} as const

type PositionName = keyof typeof POSITIONS

/** Scale display names for the types this pack uses. */
const SCALE_LABELS = {
  ionian: 'major',
  dorian: 'Dorian',
  mixolydian: 'Mixolydian',
} as const

function scaleExercise(
  id: string,
  root: NoteName,
  scale: keyof typeof SCALE_LABELS,
  position: PositionName,
  tempoBpm: number,
  minutes: number,
): Exercise {
  return {
    id,
    title: `${displayAccidentals(root)} ${SCALE_LABELS[scale]} — ${POSITIONS[position].label}`,
    material: { kind: 'scale', root, scale },
    window: POSITIONS[position].window,
    tempoBpm,
    duration: { kind: 'minutes', minutes },
    display: ['fretboard', 'notation'],
  }
}

function arpeggioExercise(
  id: string,
  root: NoteName,
  quality: ChordQuality,
  position: PositionName,
  tempoBpm: number,
  minutes: number,
): Exercise {
  return {
    id,
    title: `${displayAccidentals(root + quality)} arpeggio — ${POSITIONS[position].label}`,
    material: { kind: 'arpeggio', root, quality },
    window: POSITIONS[position].window,
    tempoBpm,
    duration: { kind: 'minutes', minutes },
    display: ['fretboard', 'notation'],
  }
}

export const LESSONS: readonly Lesson[] = [
  {
    id: 'scales-major-open',
    title: 'Major scale I — open position',
    area: 'scales',
    level: 1,
    prerequisites: [],
    estimatedMinutes: 12,
    exercises: [
      scaleExercise('scales-major-open-c', 'C', 'ionian', 'open', 60, 4),
      scaleExercise('scales-major-open-g', 'G', 'ionian', 'open', 60, 4),
      scaleExercise('scales-major-open-f', 'F', 'ionian', 'open', 60, 4),
    ],
  },
  {
    id: 'scales-major-middle',
    title: 'Major scale II — middle position, adding flat keys',
    area: 'scales',
    level: 1,
    prerequisites: ['scales-major-open'],
    estimatedMinutes: 12,
    exercises: [
      scaleExercise('scales-major-middle-bb', 'Bb', 'ionian', 'middle', 60, 4),
      scaleExercise('scales-major-middle-eb', 'Eb', 'ionian', 'middle', 60, 4),
      scaleExercise('scales-major-middle-c', 'C', 'ionian', 'middle', 60, 4),
    ],
  },
  {
    id: 'scales-dorian',
    title: 'Dorian — the ii-chord scale',
    area: 'scales',
    level: 2,
    prerequisites: ['scales-major-open', 'scales-major-middle'],
    estimatedMinutes: 12,
    exercises: [
      scaleExercise('scales-dorian-d-open', 'D', 'dorian', 'open', 70, 3),
      scaleExercise('scales-dorian-d-middle', 'D', 'dorian', 'middle', 70, 3),
      scaleExercise('scales-dorian-g-middle', 'G', 'dorian', 'middle', 70, 3),
      scaleExercise('scales-dorian-c-middle', 'C', 'dorian', 'middle', 70, 3),
    ],
  },
  {
    id: 'scales-mixolydian',
    title: 'Mixolydian — the V-chord scale',
    area: 'scales',
    level: 2,
    prerequisites: ['scales-major-open', 'scales-major-middle'],
    estimatedMinutes: 12,
    exercises: [
      scaleExercise('scales-mixolydian-g-open', 'G', 'mixolydian', 'open', 70, 3),
      scaleExercise('scales-mixolydian-g-middle', 'G', 'mixolydian', 'middle', 70, 3),
      scaleExercise('scales-mixolydian-c-middle', 'C', 'mixolydian', 'middle', 70, 3),
      scaleExercise('scales-mixolydian-f-open', 'F', 'mixolydian', 'open', 70, 3),
    ],
  },
  {
    id: 'scales-ii-v-i',
    title: 'Chord-scale chain — ii–V–I in C and F',
    area: 'scales',
    level: 3,
    prerequisites: ['scales-dorian', 'scales-mixolydian'],
    estimatedMinutes: 12,
    exercises: [
      scaleExercise('scales-ii-v-i-d-dorian', 'D', 'dorian', 'middle', 80, 2),
      scaleExercise('scales-ii-v-i-g-mixolydian', 'G', 'mixolydian', 'middle', 80, 2),
      scaleExercise('scales-ii-v-i-c-major', 'C', 'ionian', 'middle', 80, 2),
      scaleExercise('scales-ii-v-i-g-dorian', 'G', 'dorian', 'open', 80, 2),
      scaleExercise('scales-ii-v-i-c-mixolydian', 'C', 'mixolydian', 'open', 80, 2),
      scaleExercise('scales-ii-v-i-f-major', 'F', 'ionian', 'open', 80, 2),
    ],
  },
  {
    id: 'arpeggios-maj7',
    title: 'Maj7 arpeggios',
    area: 'arpeggios',
    level: 1,
    prerequisites: [],
    estimatedMinutes: 12,
    exercises: [
      arpeggioExercise('arpeggios-maj7-c-open', 'C', 'maj7', 'open', 60, 3),
      arpeggioExercise('arpeggios-maj7-c-middle', 'C', 'maj7', 'middle', 60, 3),
      arpeggioExercise('arpeggios-maj7-f-open', 'F', 'maj7', 'open', 60, 3),
      arpeggioExercise('arpeggios-maj7-bb-middle', 'Bb', 'maj7', 'middle', 60, 3),
    ],
  },
  {
    id: 'arpeggios-m7',
    title: 'm7 arpeggios',
    area: 'arpeggios',
    level: 1,
    prerequisites: ['arpeggios-maj7'],
    estimatedMinutes: 12,
    exercises: [
      arpeggioExercise('arpeggios-m7-d-open', 'D', 'm7', 'open', 60, 3),
      arpeggioExercise('arpeggios-m7-d-middle', 'D', 'm7', 'middle', 60, 3),
      arpeggioExercise('arpeggios-m7-g-middle', 'G', 'm7', 'middle', 60, 3),
      arpeggioExercise('arpeggios-m7-a-open', 'A', 'm7', 'open', 60, 3),
    ],
  },
  {
    id: 'arpeggios-dom7',
    title: 'Dominant 7 arpeggios',
    area: 'arpeggios',
    level: 2,
    prerequisites: ['arpeggios-maj7', 'arpeggios-m7'],
    estimatedMinutes: 12,
    exercises: [
      arpeggioExercise('arpeggios-dom7-g-open', 'G', '7', 'open', 70, 3),
      arpeggioExercise('arpeggios-dom7-g-middle', 'G', '7', 'middle', 70, 3),
      arpeggioExercise('arpeggios-dom7-c-middle', 'C', '7', 'middle', 70, 3),
      arpeggioExercise('arpeggios-dom7-f-open', 'F', '7', 'open', 70, 3),
    ],
  },
  {
    id: 'arpeggios-m7b5',
    title: 'm7♭5 arpeggios — the minor ii',
    area: 'arpeggios',
    level: 2,
    prerequisites: ['arpeggios-m7', 'arpeggios-dom7'],
    estimatedMinutes: 12,
    exercises: [
      arpeggioExercise('arpeggios-m7b5-b-open', 'B', 'm7b5', 'open', 70, 3),
      arpeggioExercise('arpeggios-m7b5-b-middle', 'B', 'm7b5', 'middle', 70, 3),
      arpeggioExercise('arpeggios-m7b5-e-middle', 'E', 'm7b5', 'middle', 70, 3),
      arpeggioExercise('arpeggios-m7b5-a-open', 'A', 'm7b5', 'open', 70, 3),
    ],
  },
  {
    id: 'arpeggios-ii-v-i',
    title: 'Arpeggio chain — ii–V–I in C and B♭',
    area: 'arpeggios',
    level: 3,
    prerequisites: ['arpeggios-maj7', 'arpeggios-m7', 'arpeggios-dom7'],
    estimatedMinutes: 12,
    exercises: [
      arpeggioExercise('arpeggios-ii-v-i-dm7', 'D', 'm7', 'middle', 80, 2),
      arpeggioExercise('arpeggios-ii-v-i-g7', 'G', '7', 'middle', 80, 2),
      arpeggioExercise('arpeggios-ii-v-i-cmaj7', 'C', 'maj7', 'middle', 80, 2),
      arpeggioExercise('arpeggios-ii-v-i-cm7', 'C', 'm7', 'open', 80, 2),
      arpeggioExercise('arpeggios-ii-v-i-f7', 'F', '7', 'open', 80, 2),
      arpeggioExercise('arpeggios-ii-v-i-bbmaj7', 'Bb', 'maj7', 'open', 80, 2),
    ],
  },
]
