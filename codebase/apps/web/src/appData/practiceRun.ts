import type { Difficulty, ExerciseRun, Feel } from './run'

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
  return commonest(run.runs.map((exercise) => exercise.difficulty))
}

export function runFeel(run: PracticeRun): Feel | null {
  return commonest(run.runs.map((exercise) => exercise.feel))
}

/**
 * The value given most often; ties go to the one given last, which for a
 * sitting is the answer the user left it on.
 */
function commonest<T extends string>(values: readonly (T | null)[]): T | null {
  const counts = new Map<T, number>()
  let best: T | null = null
  for (const value of values) {
    if (value === null) continue
    const count = (counts.get(value) ?? 0) + 1
    counts.set(value, count)
    if (best === null || count >= (counts.get(best) ?? 0)) best = value
  }
  return best
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
    .sort((a, b) => new Date(b.startedAt).valueOf() - new Date(a.startedAt).valueOf())
}

function started(run: ExerciseRun): number {
  const value = new Date(run.startedAt).valueOf()
  // An unparseable timestamp sorts first rather than poisoning every comparison.
  return Number.isFinite(value) ? value : 0
}
