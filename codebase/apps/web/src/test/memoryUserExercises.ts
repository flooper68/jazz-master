import type { ExerciseInput } from '../content/exerciseInput'
import {
  MOST_USER_EXERCISES,
  rowIdOfUserExercise,
  storedExercise,
  userExerciseId,
  UserExerciseLimitError,
  type UserExerciseRepository,
} from '../server/db/userExercises'

/** The user-exercise repository without a database, for tests on either side of the wire. */
export function createMemoryUserExerciseRepository(): UserExerciseRepository {
  const rows: { rowId: string; clerkUserId: string; exercise: ExerciseInput }[] = []
  let next = 0
  return {
    async listExercises(clerkUserId) {
      // Like the real one: the bare input is what is kept, and it is parsed again on the way out.
      return rows.filter((row) => row.clerkUserId === clerkUserId).flatMap((row) => storedExercise(row.rowId, row.exercise) ?? [])
    },
    async createExercise(clerkUserId, exercise) {
      if (rows.filter((row) => row.clerkUserId === clerkUserId).length >= MOST_USER_EXERCISES) throw new UserExerciseLimitError()
      next += 1
      const rowId = `00000000-0000-4000-8000-${String(next).padStart(12, '0')}`
      rows.push({ rowId, clerkUserId, exercise })
      return { ...exercise, id: userExerciseId(rowId) }
    },
    async deleteExercise(clerkUserId, exerciseId) {
      const rowId = rowIdOfUserExercise(exerciseId)
      const index = rows.findIndex((row) => row.rowId === rowId && row.clerkUserId === clerkUserId)
      if (index < 0) return false
      rows.splice(index, 1)
      return true
    },
  }
}
