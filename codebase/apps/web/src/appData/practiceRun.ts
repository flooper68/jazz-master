import { DIFFICULTIES, FEELS, type Difficulty, type ExerciseRun, type Feel } from './run'

/**
 * A **practice run** is one sitting: everything played between pressing Play
 * and leaving. Its exercise runs carry its id (ADR-020 made that universal),
 * and there is no sittings table — a practice run is derived from the runs
 * inside it, the same way the scheduler's state is derived from history.
 *
 * What that costs, knowingly: a sitting is only the sum of what was actually
 * played. The length it was planned for is not stored, so a twenty-minute run
 * left after seven minutes reads as seven, and a sitting where nothing was
 * played leaves no trace at all.
 */
export interface PracticeRun {
  /** The sitting's id: the session id its runs share, or a lone run's own id for rows written before ADR-020. */
  id: string
  /** When its first exercise started. */
  startedAt: string
  /** Time played, summed over its exercises — setup and pauses excluded, like a run's own duration. */
  seconds: number
  /** Its exercise runs, in playing order. */
  runs: ExerciseRun[]
  /** How many were played through rather than ended early. */
  completed: number
}

/** How the sitting mostly went, and how it mostly felt: the commonest answer given, or null when none was. */
export function runDifficulty(run: PracticeRun): Difficulty | null {
  return commonest(run.runs.map((exercise) => exercise.difficulty), DIFFICULTIES)
}

export function runFeel(run: PracticeRun): Feel | null {
  return commonest(run.runs.map((exercise) => exercise.feel), FEELS)
}

/**
 * The answer given most often, with **ties going to the worse one** — the
 * sitting that was half Hard and half Good was a hard sitting, and a week that
 * was half dragged was not a fine week. `order` is the vocabulary worst first
 * (`DIFFICULTIES`, `FEELS`), which is the order both are declared in; the
 * dashboard's week summary uses this same function, so the two surfaces cannot
 * answer one question differently.
 */
export function commonest<T extends string>(values: readonly (T | null)[], order: readonly T[]): T | null {
  const counts = new Map<T, number>()
  for (const value of values) {
    if (value !== null) counts.set(value, (counts.get(value) ?? 0) + 1)
  }
  if (counts.size === 0) return null
  return order.reduce((best, value) => ((counts.get(value) ?? 0) > (counts.get(best) ?? 0) ? value : best))
}

/**
 * The sittings of a history, newest first, each holding its exercises in
 * playing order. Runs with no session id are each a sitting of one: that is
 * what they were, before a session was the only way to play.
 */
export function practiceRuns(runs: readonly ExerciseRun[]): PracticeRun[] {
  const byId = new Map<string, ExerciseRun[]>()
  for (const run of runs) {
    // A missing session id groups on the run's own, so two old rows never merge.
    const key = run.sessionId ?? `run:${run.id}`
    const existing = byId.get(key)
    if (existing) existing.push(run)
    else byId.set(key, [run])
  }
  return [...byId.entries()]
    .map(([id, grouped]) => {
      const ordered = [...grouped].sort((a, b) => started(a) - started(b))
      return {
        id,
        startedAt: ordered[0].startedAt,
        seconds: ordered.reduce((sum, run) => sum + run.durationSeconds, 0),
        runs: ordered,
        completed: ordered.filter((run) => run.completed).length,
      }
    })
    .sort((a, b) => started(b) - started(a))
}

/** Both sorts go through this: one NaN in a comparator makes the whole ordering engine-defined. */
function started(run: { startedAt: string }): number {
  const value = new Date(run.startedAt).valueOf()
  // An unparseable timestamp sorts oldest rather than poisoning every comparison.
  return Number.isFinite(value) ? value : 0
}
