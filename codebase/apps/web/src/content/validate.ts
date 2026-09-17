import { keySignature, STRING_NUMBERS, type GuitarString } from '@jazz-master/theory'
import { passBeats } from './timeline'
import { DEFAULT_BEATS_PER_BAR, type Exercise, type TabNote } from './types'

/** One thing wrong with an exercise set; an empty result means valid. */
export interface ExerciseProblem {
  exerciseId: string
  message: string
}

function noteProblem(note: TabNote, index: number): string | null {
  if (!STRING_NUMBERS.includes(note.string as GuitarString)) {
    return `note ${index}: string must be 1–6, got ${note.string}`
  }
  if (!Number.isInteger(note.fret) || note.fret < 0) {
    return `note ${index}: fret must be a non-negative integer, got ${note.fret}`
  }
  if (!(note.beats > 0)) {
    return `note ${index}: beats must be positive, got ${note.beats}`
  }
  return null
}

function exerciseProblems(exercise: Exercise): ExerciseProblem[] {
  const problems: ExerciseProblem[] = []
  const problem = (message: string) =>
    problems.push({ exerciseId: exercise.id, message })

  if (!Number.isInteger(exercise.level) || exercise.level < 1) {
    problem(`level must be a positive integer, got ${exercise.level}`)
  }
  if (!(exercise.tempoBpm > 0)) {
    problem(`tempo must be positive, got ${exercise.tempoBpm}`)
  }
  const amount =
    exercise.duration.kind === 'minutes'
      ? exercise.duration.minutes
      : exercise.duration.count
  if (!(amount > 0)) {
    problem(`duration must be positive, got ${amount}`)
  }
  if (exercise.notes.length === 0) {
    problem('exercise has no notes')
  }
  if (exercise.key !== undefined && keySignature(exercise.key) === null) {
    problem(`key must be a major key with a signature, got "${exercise.key}"`)
  }
  if (
    exercise.beatsPerBar !== undefined &&
    (!Number.isInteger(exercise.beatsPerBar) || exercise.beatsPerBar < 1)
  ) {
    problem(`beats per bar must be a positive integer, got ${exercise.beatsPerBar}`)
  }
  exercise.notes.forEach((note, index) => {
    const message = noteProblem(note, index)
    if (message) problem(message)
  })
  const beatsPerBar = exercise.beatsPerBar ?? DEFAULT_BEATS_PER_BAR
  const total = passBeats(exercise.notes)
  if (exercise.notes.length > 0 && beatsPerBar >= 1 && Math.abs(total % beatsPerBar) > 1e-9) {
    problem(`exercise ends mid-bar: ${total} beats in ${beatsPerBar}/4`)
  }
  return problems
}

/**
 * Validate a whole exercise set: per-note sanity, per-exercise metadata, and
 * ids unique across the set. Returns every problem found; empty means the set
 * is consistent.
 */
export function validateExercises(
  exercises: readonly Exercise[],
): ExerciseProblem[] {
  const problems: ExerciseProblem[] = []
  const ids = new Set<string>()
  for (const exercise of exercises) {
    if (ids.has(exercise.id)) {
      problems.push({
        exerciseId: exercise.id,
        message: `duplicate exercise id "${exercise.id}"`,
      })
    }
    ids.add(exercise.id)
    problems.push(...exerciseProblems(exercise))
  }
  return problems
}
