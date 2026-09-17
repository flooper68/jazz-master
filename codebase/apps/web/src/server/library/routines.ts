import { parseRoutineInput, type Routine } from '../../appData/routine'
import { EXERCISES } from '../../content'
import { RoutineLimitError, type RoutineRepository } from '../db/routines'
import type { UserExerciseRepository } from '../db/userExercises'

/**
 * The user's practice routines as the outside sees them. tRPC (the app) and
 * MCP (an AI client) both go through these functions, so a routine is held to
 * the same rules whichever door it came in by: a name, and items that each
 * name an exercise this user can actually play — the built-in pack or their
 * own library. Results are plain data with a `status`, never a thrown
 * database error.
 */

type Unavailable = { status: 'unconfigured' }
type ReadFailed = { status: 'error'; message: 'Routine read failed' }
type WriteFailed = { status: 'error'; message: 'Routine write failed' }

export type RoutineListResult = { status: 'ok'; routines: Routine[] } | Unavailable | ReadFailed

export type RoutineWriteResult =
  | { status: 'ok'; routine: Routine }
  | { status: 'invalid'; problems: string[] }
  | { status: 'full'; message: string }
  | { status: 'not_found' }
  | Unavailable
  | WriteFailed

export type RoutineDeleteResult = { status: 'ok'; deleted: boolean } | Unavailable | WriteFailed

export interface RoutineStores {
  routines: RoutineRepository | null
  userExercises: UserExerciseRepository | null
}

export async function listRoutines({ routines }: RoutineStores, clerkUserId: string): Promise<RoutineListResult> {
  if (!routines) return { status: 'unconfigured' }
  try {
    return { status: 'ok', routines: await routines.listRoutines(clerkUserId) }
  } catch {
    return { status: 'error', message: 'Routine read failed' }
  }
}

/** Every exercise id this user may put in a routine: the pack, plus their library. */
async function knownExerciseIds(userExercises: UserExerciseRepository | null, clerkUserId: string): Promise<Set<string>> {
  const library = userExercises ? await userExercises.listExercises(clerkUserId) : []
  return new Set([...EXERCISES.map((exercise) => exercise.id), ...library.map((exercise) => exercise.id)])
}

/** Create a routine, or — with an id — replace the one this user already has under it. */
export async function saveRoutine(
  { routines, userExercises }: RoutineStores,
  clerkUserId: string,
  input: unknown,
  routineId?: string,
): Promise<RoutineWriteResult> {
  if (!routines) return { status: 'unconfigured' }
  try {
    const parsed = parseRoutineInput(input, await knownExerciseIds(userExercises, clerkUserId))
    if (!parsed.ok) return { status: 'invalid', problems: parsed.problems }
    if (routineId === undefined) return { status: 'ok', routine: await routines.createRoutine(clerkUserId, parsed.routine) }
    const updated = await routines.updateRoutine(clerkUserId, routineId, parsed.routine)
    return updated ? { status: 'ok', routine: updated } : { status: 'not_found' }
  } catch (error) {
    if (error instanceof RoutineLimitError) return { status: 'full', message: error.message }
    return { status: 'error', message: 'Routine write failed' }
  }
}

export async function deleteRoutine({ routines }: RoutineStores, clerkUserId: string, routineId: string): Promise<RoutineDeleteResult> {
  if (!routines) return { status: 'unconfigured' }
  try {
    return { status: 'ok', deleted: await routines.deleteRoutine(clerkUserId, routineId) }
  } catch {
    return { status: 'error', message: 'Routine write failed' }
  }
}
