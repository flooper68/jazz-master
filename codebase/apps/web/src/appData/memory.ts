import type { Exercise } from '../content'
import { PLAN_CONSTANTS, type PlanConstants } from './planConstants'
import type { Difficulty, ExerciseRun, Feel } from './run'

/**
 * The memory: what the runs say about each exercise. A pure fold, never
 * stored — replay the runs and the state comes back the same
 * (docs/product/next-session-design.md §5–§6).
 *
 * **A day is the unit.** Runs are folded per exercise per calendar day: four
 * runs on one day are one review. The day is the *local* calendar day of the
 * run's `startedAt`, the same rule the dashboard's streak already uses — so in
 * the browser it is the user's own midnight.
 *
 * **Silence has a reading.** The day's answer is the last run of the day that
 * carries one. When no run that day was answered, a day that completed
 * something reads as Good and a day that completed nothing reads as Again:
 * bailing counts as Again (§5), and saying nothing after a clean run should
 * not punish the item.
 */

/** Where an exercise stands, on the two axes that matter: how often, and how fast. */
export type Band = 'new' | 'stuck' | 'hard' | 'fine' | 'easy'

export interface ExerciseState {
  band: Band
  /** Days between reviews as the last one left it; 0 for an item never played. */
  interval: number
  /** The day it comes back, `YYYY-MM-DD` local; null for an item never played. */
  due: string | null
  /** The fastest it has been played through to the end; null when it never was. */
  bestTempo: number | null
  /** `bestTempo − target`; null when it has never been completed. */
  margin: number | null
  /** What to play it at next. */
  nextTempo: number
  /** The day of the last review, `YYYY-MM-DD` local; null for an item never played. */
  lastReview: string | null
  /**
   * How it last felt, of the runs that said. Null means nothing has ever been
   * said about it, which reads as `fine` — the same as saying so. The latest
   * answer stands rather than a majority: a player who has just fallen for
   * something should not have to say it three times (§8).
   *
   * **This never touches the schedule.** It orders a session and picks its
   * ends; `interval`, `due` and `band` are worked out without it — with one
   * named exception, which is that a dragged item is called stuck a day
   * sooner, because grinding on something hated is how people quit.
   */
  feel: Feel | null
}

/** `YYYY-MM-DD` in the runtime's own timezone. */
export function dayKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${String(date.getDate()).padStart(2, '0')}`
}

/** A day key moved by whole days, staying on calendar days rather than 24-hour blocks. */
export function addDays(day: string, days: number): string {
  const [year, month, date] = day.split('-').map(Number)
  return dayKey(new Date(year, month - 1, date + days))
}

/** Whole days from `from` to `to`; negative when `to` is earlier. */
export function daysBetween(from: string, to: string): number {
  const [fy, fm, fd] = from.split('-').map(Number)
  const [ty, tm, td] = to.split('-').map(Number)
  const ms = Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)
  return Math.round(ms / 86_400_000)
}

/**
 * The first interval of a new item, 1–3 days, spread by the exercise's id.
 * Ten new items today must not all land tomorrow (§4), and the spread has to
 * hold still: seeding it with the latest run would move an item's first review
 * every time anything at all was played.
 */
export function staggerDays(exerciseId: string, constants: PlanConstants = PLAN_CONSTANTS): number {
  const span = constants.newItemStaggerMaxDays - constants.newItemStaggerMinDays + 1
  let hash = 0
  for (const character of exerciseId) hash = (hash * 31 + character.charCodeAt(0)) >>> 0
  return constants.newItemStaggerMinDays + (hash % span)
}

/** One exercise's day: what it was answered, how it felt, and the fastest it was played through. */
interface ReviewDay {
  day: string
  difficulty: Difficulty
  /** The fastest completed run of the day; null when nothing was completed. */
  tempo: number | null
  /** The last run of the day that said how it felt; null when none did. */
  feel: Feel | null
}

function reviewDays(runs: readonly ExerciseRun[]): ReviewDay[] {
  const byDay = new Map<string, ExerciseRun[]>()
  for (const run of runs) {
    const day = dayKey(new Date(run.startedAt))
    const existing = byDay.get(day)
    if (existing) existing.push(run)
    else byDay.set(day, [run])
  }
  return [...byDay.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([day, dayRuns]) => {
      const ordered = [...dayRuns].sort(
        (a, b) => new Date(a.startedAt).valueOf() - new Date(b.startedAt).valueOf(),
      )
      const completed = ordered.filter((run) => run.completed)
      const answered = [...ordered].reverse().find((run) => run.difficulty !== null)?.difficulty ?? null
      return {
        day,
        difficulty: completed.length === 0 ? 'again' : (answered ?? 'good'),
        tempo: completed.length === 0 ? null : Math.max(...completed.map((run) => run.tempoBpm)),
        feel: [...ordered].reverse().find((run) => run.feel !== null)?.feel ?? null,
      }
    })
}

function nextInterval(
  previous: number,
  difficulty: Difficulty,
  first: boolean,
  exerciseId: string,
  constants: PlanConstants,
): number {
  if (difficulty === 'again') return constants.againIntervalDays
  if (first) return staggerDays(exerciseId, constants)
  const multiplier =
    difficulty === 'easy'
      ? constants.easyMultiplier
      : difficulty === 'good'
        ? constants.goodMultiplier
        : constants.hardMultiplier
  return Math.max(Math.round(previous * multiplier), 1)
}

/** One exercise's whole history, day by day, in order. */
function foldExercise(
  exercise: Exercise,
  runs: readonly ExerciseRun[],
  constants: PlanConstants,
  target: number,
): ExerciseState {
  const days = reviewDays(runs)
  if (days.length === 0) {
    return { band: 'new', interval: 0, due: null, bestTempo: null, margin: null, nextTempo: target, lastReview: null, feel: null }
  }

  // A dragged item is called stuck a day sooner. Grinding away at something
  // hated is how people stop practising altogether, so the app reaches for the
  // lower tempo earlier — the only place feel touches anything the fold decides.
  //
  // It is read **as the history ran**, not as it ended: saying "dragged" today
  // must not re-decide whether the item was stuck a month ago, when nobody had
  // said anything of the kind.
  const stuckAfterFor = (feelSoFar: Feel | null) =>
    feelSoFar === 'dragged' ? Math.max(constants.stuckAfterAgainDays - 1, 1) : constants.stuckAfterAgainDays

  let interval = 0
  let due: string | null = null
  let bestTempo: number | null = null
  let againStreak = 0
  let cleanStreak = 0
  let stuck = false
  let solidDays = 0
  let easyDays = 0
  let lastDifficulty: Difficulty = 'good'
  // The latest thing said about it up to the day being folded, and by the end
  // of the loop the latest thing said at all.
  let feel: Feel | null = null

  for (const [index, review] of days.entries()) {
    if (review.feel !== null) feel = review.feel
    if (review.tempo !== null) bestTempo = Math.max(bestTempo ?? 0, review.tempo)
    const margin = bestTempo === null ? null : bestTempo - target
    lastDifficulty = review.difficulty

    // Solid is earned on different days, so a binge goes wide and never deep (§9).
    if (review.tempo !== null && review.tempo >= target && (review.difficulty === 'good' || review.difficulty === 'easy')) {
      solidDays += 1
    }
    if (review.difficulty === 'easy' && margin !== null && margin >= 0) easyDays += 1

    if (review.difficulty === 'again') {
      againStreak += 1
      cleanStreak = 0
      if (againStreak >= stuckAfterFor(feel)) stuck = true
    } else {
      againStreak = 0
      cleanStreak += 1
      if (stuck && cleanStreak >= constants.stuckRecoveryDays) stuck = false
    }

    interval = nextInterval(interval, review.difficulty, index === 0, exercise.id, constants)
    // The objective check on the answer: below the target it comes back soon whatever was tapped.
    if (margin === null || margin < 0) interval = Math.min(interval, constants.belowTargetMaxIntervalDays)
    interval = Math.min(interval, constants.maxIntervalDays)
    // An early review does not advance the schedule (§9).
    due = addDays(due !== null && due > review.day ? due : review.day, interval)
  }

  const margin = bestTempo === null ? null : bestTempo - target
  const solid = solidDays >= constants.solidQualifyingDays
  const nextTempo = stuck
    ? Math.round(target * constants.stuckTempoFactor)
    : solid || bestTempo === null
      ? target
      : Math.min(target, bestTempo + constants.tempoCreepBpm)

  // Working until it is solid: one clean day at the target is not enough, so a
  // binge goes wide and never deep (§9). Then the answer and the margin decide.
  const band: Band = stuck
    ? 'stuck'
    : !solid || lastDifficulty === 'hard' || lastDifficulty === 'again' || margin === null || margin < 0
      ? 'hard'
      : lastDifficulty === 'easy' && easyDays >= constants.easyQualifyingDays
        ? 'easy'
        : 'fine'

  return { band, interval, due, bestTempo, margin, nextTempo, lastReview: days[days.length - 1].day, feel }
}

/**
 * The whole catalog's state from the whole run history. Every exercise gets an
 * entry — one never played is `new`, which is how it reaches a session. Runs
 * of an exercise that is no longer in the catalog are ignored.
 *
 * There is no `today` here on purpose: every day this fold reads comes from a
 * run, and `due` is an absolute day. Today is what the *assembler* needs, to
 * say what is overdue and by how much.
 */
export function foldRuns(
  runs: readonly ExerciseRun[],
  catalog: readonly Exercise[],
  constants: PlanConstants = PLAN_CONSTANTS,
  /**
   * What each exercise is judged against (appData/targets): a path's target, or
   * the user's own override, or — when nothing says otherwise — the tempo it is
   * written at. Resolved at fold time, never stored, so moving a target changes
   * what `solid` means from the next fold on without rewriting one run.
   */
  targets?: ReadonlyMap<string, number>,
): Map<string, ExerciseState> {
  const byExercise = new Map<string, ExerciseRun[]>()
  for (const run of runs) {
    const existing = byExercise.get(run.exerciseId)
    if (existing) existing.push(run)
    else byExercise.set(run.exerciseId, [run])
  }
  return new Map(
    catalog.map((exercise) => [
      exercise.id,
      foldExercise(exercise, byExercise.get(exercise.id) ?? [], constants, targets?.get(exercise.id) ?? exercise.tempoBpm),
    ]),
  )
}
