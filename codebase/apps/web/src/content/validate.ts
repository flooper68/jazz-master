import { STRING_NUMBERS, type GuitarString } from '@jazz-master/theory'
import type { Exercise, Lesson, TabNote } from './types'

/** One thing wrong with a lesson set; an empty result means valid. */
export interface LessonProblem {
  lessonId: string
  exerciseId?: string
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

function exerciseProblems(lesson: Lesson, exercise: Exercise): LessonProblem[] {
  const problems: LessonProblem[] = []
  const problem = (message: string) =>
    problems.push({ lessonId: lesson.id, exerciseId: exercise.id, message })

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
  exercise.notes.forEach((note, index) => {
    const message = noteProblem(note, index)
    if (message) problem(message)
  })
  return problems
}

function lessonProblems(
  lesson: Lesson,
  seenExerciseIds: Set<string>,
): LessonProblem[] {
  const problems: LessonProblem[] = []
  const problem = (message: string) =>
    problems.push({ lessonId: lesson.id, message })

  if (!Number.isInteger(lesson.level) || lesson.level < 1) {
    problem(`level must be a positive integer, got ${lesson.level}`)
  }
  if (!(lesson.estimatedMinutes > 0)) {
    problem(`estimated minutes must be positive, got ${lesson.estimatedMinutes}`)
  }
  if (lesson.exercises.length === 0) {
    problem('lesson has no exercises')
  }
  for (const exercise of lesson.exercises) {
    if (seenExerciseIds.has(exercise.id)) {
      problems.push({
        lessonId: lesson.id,
        exerciseId: exercise.id,
        message: `duplicate exercise id "${exercise.id}"`,
      })
    }
    seenExerciseIds.add(exercise.id)
    problems.push(...exerciseProblems(lesson, exercise))
  }
  return problems
}

/**
 * Report prerequisite cycles. DFS with an explicit stack path; every lesson
 * on a cycle gets one problem naming the loop, and a lesson already reported
 * is not reported again via another entry point.
 */
function cycleProblems(lessons: readonly Lesson[]): LessonProblem[] {
  const byId = new Map(lessons.map((lesson) => [lesson.id, lesson]))
  const problems: LessonProblem[] = []
  const done = new Set<string>()
  const reported = new Set<string>()

  function visit(id: string, path: string[]): void {
    const cycleStart = path.indexOf(id)
    if (cycleStart !== -1) {
      const cycle = [...path.slice(cycleStart), id]
      for (const member of cycle.slice(0, -1)) {
        if (!reported.has(member)) {
          reported.add(member)
          problems.push({
            lessonId: member,
            message: `prerequisite cycle: ${cycle.join(' → ')}`,
          })
        }
      }
      return
    }
    if (done.has(id)) return
    done.add(id)
    for (const prerequisite of byId.get(id)?.prerequisites ?? []) {
      if (byId.has(prerequisite)) visit(prerequisite, [...path, id])
    }
  }

  for (const lesson of lessons) visit(lesson.id, [])
  return problems
}

/**
 * Validate a whole lesson set: per-note sanity, per-exercise and per-lesson
 * metadata, and the cross-lesson prerequisite graph (unknown ids, cycles).
 * Returns every problem found; empty means the set is consistent.
 */
export function validateLessons(
  lessons: readonly Lesson[],
): LessonProblem[] {
  const problems: LessonProblem[] = []
  const ids = new Set<string>()
  const exerciseIds = new Set<string>()
  for (const lesson of lessons) {
    if (ids.has(lesson.id)) {
      problems.push({
        lessonId: lesson.id,
        message: `duplicate lesson id "${lesson.id}"`,
      })
    }
    ids.add(lesson.id)
    problems.push(...lessonProblems(lesson, exerciseIds))
  }
  for (const lesson of lessons) {
    for (const prerequisite of lesson.prerequisites) {
      if (!ids.has(prerequisite)) {
        problems.push({
          lessonId: lesson.id,
          message: `unknown prerequisite "${prerequisite}"`,
        })
      }
    }
  }
  problems.push(...cycleProblems(lessons))
  return problems
}
