import { parseExerciseInput, type LibraryExercise } from '../../content/exerciseInput'
import { UserExerciseLimitError, type UserExerciseRepository } from '../db/userExercises'

/**
 * The user's exercise library as the outside sees it. tRPC (the app) and MCP
 * (an AI client) both go through these functions, so an exercise is held to
 * the same rules whichever door it came in by. Results are plain data with a
 * `status`, never a thrown database error: callers report, they do not leak.
 */

export type LibraryListResult =
  | { status: 'ok'; exercises: LibraryExercise[] }
  | { status: 'unconfigured' }
  | { status: 'error'; message: 'Exercise library read failed' }

export type LibraryCreateResult =
  | { status: 'ok'; exercise: LibraryExercise }
  | { status: 'invalid'; problems: string[] }
  | { status: 'full'; message: string }
  | { status: 'unconfigured' }
  | { status: 'error'; message: 'Exercise library write failed' }

export type LibraryDeleteResult =
  | { status: 'ok'; deleted: boolean }
  | { status: 'unconfigured' }
  | { status: 'error'; message: 'Exercise library write failed' }

export async function listLibrary(repository: UserExerciseRepository | null, clerkUserId: string): Promise<LibraryListResult> {
  if (!repository) return { status: 'unconfigured' }
  try {
    return { status: 'ok', exercises: await repository.listExercises(clerkUserId) }
  } catch {
    return { status: 'error', message: 'Exercise library read failed' }
  }
}

/** Check an exercise without storing it: the problems a create would report, or none. */
export function checkLibraryExercise(input: unknown): { status: 'ok' } | { status: 'invalid'; problems: string[] } {
  const parsed = parseExerciseInput(input)
  return parsed.ok ? { status: 'ok' } : { status: 'invalid', problems: parsed.problems }
}

export async function createLibraryExercise(
  repository: UserExerciseRepository | null,
  clerkUserId: string,
  input: unknown,
): Promise<LibraryCreateResult> {
  // Validity first: a client can learn what is wrong with an exercise even where no database is configured.
  const parsed = parseExerciseInput(input)
  if (!parsed.ok) return { status: 'invalid', problems: parsed.problems }
  if (!repository) return { status: 'unconfigured' }
  try {
    return { status: 'ok', exercise: await repository.createExercise(clerkUserId, parsed.exercise) }
  } catch (error) {
    if (error instanceof UserExerciseLimitError) return { status: 'full', message: error.message }
    return { status: 'error', message: 'Exercise library write failed' }
  }
}

export async function deleteLibraryExercise(
  repository: UserExerciseRepository | null,
  clerkUserId: string,
  exerciseId: string,
): Promise<LibraryDeleteResult> {
  if (!repository) return { status: 'unconfigured' }
  try {
    return { status: 'ok', deleted: await repository.deleteExercise(clerkUserId, exerciseId) }
  } catch {
    return { status: 'error', message: 'Exercise library write failed' }
  }
}
