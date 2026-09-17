import { transposeMajorKey } from '@jazz-master/theory'
import type { Exercise } from './types'

/**
 * Transposing an exercise the way a guitarist does it: the shape slides along
 * the neck, every fret moving by the same number of semitones, so the
 * fingering stays and only the key changes.
 */

/** The highest fret a transposed shape may reach. */
export const HIGHEST_TRANSPOSED_FRET = 17
/** Never further than a key short of the octave, in either direction. */
const WIDEST_TRANSPOSITION = 11

export interface TransposeRange {
  /** Furthest down, zero or negative: the lowest note stops at the open string. */
  min: number
  /** Furthest up, zero or positive: the highest note stops at the top fret. */
  max: number
}

/** How far an exercise's shape can slide before it runs off the neck. */
export function transposeRange(exercise: Exercise): TransposeRange {
  const frets = exercise.notes.map((note) => note.fret)
  if (frets.length === 0) return { min: 0, max: 0 }
  const lowest = Math.min(...frets)
  const highest = Math.max(...frets)
  // `0 - x` rather than `-x`: a range that cannot move reads 0, never -0.
  return {
    min: 0 - Math.min(lowest, WIDEST_TRANSPOSITION),
    max: Math.min(Math.max(HIGHEST_TRANSPOSED_FRET - highest, 0), WIDEST_TRANSPOSITION),
  }
}

export function clampTransposition(exercise: Exercise, semitones: number): number {
  if (!Number.isFinite(semitones)) return 0
  const { min, max } = transposeRange(exercise)
  return Math.min(Math.max(Math.round(semitones), min), max)
}

/**
 * The exercise slid by a number of semitones, within its range: frets moved,
 * key renamed so the notation is spelled and signed for where it now sits.
 * An exercise with no key stays keyless. Zero returns the exercise itself.
 */
export function transposeExercise(exercise: Exercise, semitones: number): Exercise {
  const shift = clampTransposition(exercise, semitones)
  if (shift === 0) return exercise
  return {
    ...exercise,
    notes: exercise.notes.map((note) => ({ ...note, fret: note.fret + shift })),
    key: exercise.key ? (transposeMajorKey(exercise.key, shift) ?? undefined) : undefined,
  }
}
