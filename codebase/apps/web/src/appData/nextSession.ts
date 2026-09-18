import type { Exercise } from '../content'
import { dayKey, daysBetween, type ExerciseState } from './memory'
import { PLAN_CONSTANTS, type PlanConstants } from './planConstants'

/**
 * The assembler: state in, a session out. Pure, and deterministic by contract
 * — the same state, catalog, seed and day always give the same slots
 * (docs/product/next-session-design.md §3, §7, §9). Nothing is stored: the
 * plan is derived every time the home page renders, and it changes only
 * because a run landed or a day passed.
 *
 * The order is: overdue work → due maintenance → new → ahead of schedule. The
 * seed — the last run's id — decides nothing but which items are drawn for the
 * ahead-of-schedule fill, so a session that is otherwise the same stays the
 * same between two looks.
 *
 * Reasons are data. They are written here and rendered as they are, so the
 * page cannot say something the scheduler did not mean.
 */

export interface SessionSlot {
  exercise: Exercise
  /** What to start it at. */
  tempoBpm: number
  /** Why it is in this session, in words the page shows unchanged. */
  reason: string
}

export interface NextSession {
  slots: SessionSlot[]
}

/** When there are no runs at all there is no last run to seed with. */
export const FIRST_SEED = 'count-in'

/** A number in [0, 1) from a string: enough to order a fill, and stable everywhere. */
function seeded(seed: string): number {
  let hash = 2166136261
  for (const character of seed) {
    hash ^= character.charCodeAt(0)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0) / 4294967296
}

function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`
}

/** How fast it is being asked for, against what it is written at. */
function tempoNote(state: ExerciseState, exercise: Exercise): string {
  if (state.band === 'stuck') return `taken down to ${state.nextTempo} of ${exercise.tempoBpm} BPM`
  if (state.bestTempo === null) return `at ${state.nextTempo} BPM`
  if (state.margin !== null && state.margin < 0) return `at ${state.nextTempo} of ${exercise.tempoBpm} BPM`
  return `at its tempo, ${exercise.tempoBpm} BPM`
}

function reasonFor(state: ExerciseState, exercise: Exercise, today: string): string {
  if (state.band === 'new') return 'New — not played yet'
  const note = tempoNote(state, exercise)
  const over = state.due === null ? 0 : daysBetween(state.due, today)
  // Stuck comes back every day, but a session drawn after today's run can still
  // reach one ahead of its next day — so only say "today" when it is owed today.
  if (state.band === 'stuck') return over >= 0 ? `Stuck — easier today, ${note}` : `Stuck — easier, ${note}`
  if (over > 0) return `Overdue ${plural(over, 'day', 'days')} · ${note}`
  if (over === 0) return `Due today · ${note}`
  if (state.band === 'easy') return `Solid — keeping it warm, ${note}`
  return `Ahead of schedule · ${note}`
}

interface Candidate {
  exercise: Exercise
  state: ExerciseState
  /** Catalog order, the tie-break everywhere but the fill. */
  rank: number
  /** Days past due; negative when it is not due yet. */
  over: number
}

/**
 * The session: a fixed number of slots, never empty while the catalog has
 * anything in it. Fewer than a session's worth due means it fills ahead of
 * schedule rather than showing a short day (§9).
 */
export function planNextSession(
  state: ReadonlyMap<string, ExerciseState>,
  catalog: readonly Exercise[],
  seed: string,
  today: Date = new Date(),
  constants: PlanConstants = PLAN_CONSTANTS,
): NextSession {
  const day = dayKey(today)
  const candidates: Candidate[] = catalog.flatMap((exercise, rank) => {
    const found = state.get(exercise.id)
    if (!found) return []
    return [{ exercise, state: found, rank, over: found.due === null ? 0 : daysBetween(found.due, day) }]
  })

  const isDue = (candidate: Candidate) => candidate.state.due !== null && candidate.over >= 0
  const mostOverdue = (a: Candidate, b: Candidate) => b.over - a.over || a.rank - b.rank

  const work = candidates
    .filter((candidate) => isDue(candidate) && (candidate.state.band === 'stuck' || candidate.state.band === 'hard'))
    .sort(mostOverdue)
  const maintenance = candidates
    .filter((candidate) => isDue(candidate) && candidate.state.band !== 'stuck' && candidate.state.band !== 'hard')
    .sort(mostOverdue)
  const fresh = candidates.filter((candidate) => candidate.state.band === 'new').sort((a, b) => a.rank - b.rank)
  // Not due yet: soonest first, and the seed decides between two that come back on the same day.
  const ahead = candidates
    .filter((candidate) => candidate.state.due !== null && candidate.over < 0)
    .sort((a, b) => b.over - a.over || seeded(`${seed}:${a.exercise.id}`) - seeded(`${seed}:${b.exercise.id}`))

  return {
    slots: [...work, ...maintenance, ...fresh, ...ahead]
      .slice(0, constants.sessionSlots)
      .map(({ exercise, state: found }) => ({
        exercise,
        tempoBpm: found.nextTempo,
        reason: reasonFor(found, exercise, day),
      })),
  }
}

/** The seed of the next plan: the newest run's id, or a fixed string before there is one. */
export function planSeed(runs: readonly { id: string; startedAt: string }[]): string {
  let newest: { id: string; startedAt: string } | null = null
  for (const run of runs) {
    // The id breaks a tie: two runs can share a timestamp, and the row order is the database's business.
    if (!newest || run.startedAt > newest.startedAt || (run.startedAt === newest.startedAt && run.id > newest.id)) newest = run
  }
  return newest?.id ?? FIRST_SEED
}
