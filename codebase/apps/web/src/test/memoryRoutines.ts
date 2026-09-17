import type { RoutineInput } from '../appData/routine'
import {
  isRoutineId,
  MOST_ROUTINES,
  RoutineLimitError,
  storedRoutine,
  type RoutineRepository,
} from '../server/db/routines'

/** The routine repository without a database, for tests on either side of the wire. */
export function createMemoryRoutineRepository(): RoutineRepository {
  const rows: { rowId: string; clerkUserId: string; routine: RoutineInput }[] = []
  let next = 0
  return {
    async listRoutines(clerkUserId) {
      return rows.filter((row) => row.clerkUserId === clerkUserId).flatMap((row) => storedRoutine(row.rowId, row.routine) ?? [])
    },
    async createRoutine(clerkUserId, routine) {
      if (rows.filter((row) => row.clerkUserId === clerkUserId).length >= MOST_ROUTINES) throw new RoutineLimitError()
      next += 1
      const rowId = `10000000-0000-4000-8000-${String(next).padStart(12, '0')}`
      rows.push({ rowId, clerkUserId, routine })
      return { ...routine, id: rowId }
    },
    async updateRoutine(clerkUserId, routineId, routine) {
      if (!isRoutineId(routineId)) return null
      const row = rows.find((candidate) => candidate.rowId === routineId && candidate.clerkUserId === clerkUserId)
      if (!row) return null
      row.routine = routine
      return { ...routine, id: routineId }
    },
    async deleteRoutine(clerkUserId, routineId) {
      const index = rows.findIndex((row) => row.rowId === routineId && row.clerkUserId === clerkUserId)
      if (index < 0) return false
      rows.splice(index, 1)
      return true
    },
  }
}
