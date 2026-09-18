import type { ExerciseRun } from '../appData/run'
import { RunOwnerMismatchError, type RunRepository } from '../server/db/runs'

/** The run repository without a database, for tests on either side of the wire. */
export function createMemoryRunRepository(): RunRepository {
  const stored = new Map<string, { clerkUserId: string; run: ExerciseRun }>()
  return {
    async listRuns(clerkUserId) {
      return [...stored.values()]
        .filter((entry) => entry.clerkUserId === clerkUserId)
        .map((entry) => ({ ...entry.run }))
        .sort((a, b) => new Date(b.startedAt).valueOf() - new Date(a.startedAt).valueOf())
    },
    async saveRun(clerkUserId, run) {
      const existing = stored.get(run.id)
      if (existing && existing.clerkUserId !== clerkUserId) throw new RunOwnerMismatchError()
      stored.set(run.id, { clerkUserId, run: { ...run } })
      return { ...run }
    },
  }
}
