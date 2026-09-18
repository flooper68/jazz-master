import { homeLabel, type Exercise } from '../content'
import { exerciseCost } from './cost'
import { dayKey, daysBetween, type ExerciseState } from './memory'
import { PLAN_CONSTANTS, type PlanConstants } from './planConstants'

/**
 * The assembler: state in, a session out. Pure, and deterministic by contract
 * — the same state, catalog, seed, budget and day always give the same slots
 * (docs/product/next-session-design.md §3, §7, §9). Nothing is stored: the
 * plan is derived every time the home page renders, and it changes only
 * because a run landed or a day passed.
 *
 * **A session is a length of time, not a number of slots.** The user says how
 * long they have — ten minutes on a bad day — and the assembler fills those
 * minutes with what each exercise actually costs (appData/cost). It never
 * passes the budget by more than the one item that crossed it.
 *
 * **And it has a shape.** Warm-up, the work, dessert: it opens on something the
 * hands already know and ends on something that plays itself, so the memory of
 * the session is not the wall in the middle of it. The work block is ordered
 * overdue → due maintenance → new → ahead of schedule; the seed decides nothing
 * but which items are drawn for the ahead-of-schedule fill, so a session that is
 * otherwise the same stays the same between two looks.
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
  /** Everything to play, in order: the warm-up, the work, then dessert. */
  slots: SessionSlot[]
  /** At most one, and none when the hands are already warm or nothing suits. */
  warmUp: SessionSlot[]
  work: SessionSlot[]
  /** At most one, and none when nothing in the pool is solid enough to end on. */
  dessert: SessionSlot[]
  /** The minutes asked for, and what the plan came to — both in seconds. */
  budgetSeconds: number
  plannedSeconds: number
}

/** What the assembler needs. Everything but the state and the catalog has a sane default. */
export interface PlanInput {
  state: ReadonlyMap<string, ExerciseState>
  catalog: readonly Exercise[]
  /** The newest run's id; it orders the ahead-of-schedule fill and nothing else. */
  seed: string
  /** How long the session should be. Defaults to the length a new user starts on. */
  budgetSeconds?: number
  /** What each exercise costs, by id (appData/cost). Anything missing falls back to its written length. */
  costs?: ReadonlyMap<string, number>
  /** Now. The calendar day of it decides what is overdue. */
  today?: Date
  /** When the last run ended; inside the skip window the warm-up is left out. */
  lastRunEnded?: Date | null
  /**
   * Two bad days behind the user (appData/recovery): the session backs off —
   * shorter, at most one wall, something loved in it, nothing new to learn.
   * It never moves a due date; what is owed is still owed, just less of it in
   * one sitting.
   */
  recovering?: boolean
  constants?: PlanConstants
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
  /** What it is expected to take, in seconds. */
  cost: number
}

/**
 * Winnable: it can go well today. Fine and easy items have been played through
 * at the target; a hard one with the tempo already in hand is a fair fight. A
 * session made only of walls is a session not played (§7).
 */
function winnable(candidate: Candidate): boolean {
  const { band, margin } = candidate.state
  if (band === 'fine' || band === 'easy') return true
  return band === 'hard' && margin !== null && margin >= 0
}

/** Solid enough to open or close on: played through at the target, more than once. */
function settled(candidate: Candidate): boolean {
  return candidate.state.band === 'fine' || candidate.state.band === 'easy'
}

function loved(candidate: Candidate): boolean {
  return candidate.state.feel === 'loved'
}

/** Still work, and a slog: the combination the session rations. */
function draggedWork(candidate: Candidate): boolean {
  return candidate.state.feel === 'dragged' && (candidate.state.band === 'hard' || candidate.state.band === 'stuck')
}

/** The key or mode the material sits in, for matching a warm-up to the work. */
function home(exercise: Exercise): string {
  return exercise.tonic ?? exercise.key ?? 'C'
}

/** Numbers first, in the order given; the first that differs decides. */
function by(...values: number[]): number {
  return values.find((value) => value !== 0) ?? 0
}

function flag(value: boolean): number {
  return value ? 1 : 0
}

/**
 * The session. Fewer than a budget's worth due means it fills ahead of schedule
 * rather than showing a short day (§9); more than a budget's worth means the
 * rest waits, because a plan that cannot be finished is not a plan.
 */
export function planNextSession(input: PlanInput): NextSession {
  const given = input.constants ?? PLAN_CONSTANTS
  const recovering = input.recovering ?? false
  // A recovery session is the ordinary one with its dials turned down; the
  // rules stay in one place rather than growing a second assembler.
  const constants: PlanConstants = recovering
    ? { ...given, maxStuckPerSession: given.recoveryStuckLimit }
    : given
  const asked = input.budgetSeconds ?? constants.defaultSessionMinutes * 60
  const budgetSeconds = recovering ? Math.round(asked * constants.recoveryBudgetFactor) : asked
  const today = input.today ?? new Date()
  const day = dayKey(today)

  const candidates: Candidate[] = input.catalog.flatMap((exercise, rank) => {
    const found = input.state.get(exercise.id)
    if (!found) return []
    return [
      {
        exercise,
        state: found,
        rank,
        over: found.due === null ? 0 : daysBetween(found.due, day),
        cost: input.costs?.get(exercise.id) ?? exerciseCost(exercise, [], constants),
      },
    ]
  })

  const isDue = (candidate: Candidate) => candidate.state.due !== null && candidate.over >= 0
  const mostOverdue = (a: Candidate, b: Candidate) => b.over - a.over || a.rank - b.rank

  // Among the work, something loved comes first: the same wall is easier to
  // walk at when the session has already gone well (§8).
  const due = candidates
    .filter((candidate) => isDue(candidate) && (candidate.state.band === 'stuck' || candidate.state.band === 'hard'))
    .sort((a, b) => by(flag(loved(b)) - flag(loved(a)), mostOverdue(a, b)))
  const maintenance = candidates
    .filter((candidate) => isDue(candidate) && candidate.state.band !== 'stuck' && candidate.state.band !== 'hard')
    .sort(mostOverdue)
  // Nothing new on a recovery day: learning something is the opposite of a rest.
  const fresh = recovering
    ? []
    : candidates.filter((candidate) => candidate.state.band === 'new').sort((a, b) => a.rank - b.rank)
  // Not due yet: soonest first, and the seed decides between two that come back on the same day.
  const ahead = candidates
    .filter((candidate) => candidate.state.due !== null && candidate.over < 0)
    .sort((a, b) => b.over - a.over || seeded(`${input.seed}:${a.exercise.id}`) - seeded(`${input.seed}:${b.exercise.id}`))

  const ordered = [...due, ...maintenance, ...fresh, ...ahead]
  const taken = new Set<string>()

  // Dessert chooses first. Both ends want the same thing — something loved —
  // and what a session is remembered by is what it ended on, so the ending has
  // first claim on it and the warm-up takes the next best thing.
  const dessert = pickDessert(candidates, taken, ordered[0] ?? null, budgetSeconds * constants.dessertMaxFraction)
  if (dessert) taken.add(dessert.exercise.id)

  // The warm-up is matched to what the session is actually for, so the work
  // block's own head is worked out before anything is chosen.
  const warmUp = pickWarmUp(candidates, ordered[0] ?? null, taken, budgetSeconds, today, input.lastRunEnded ?? null, constants)
  if (warmUp) taken.add(warmUp.exercise.id)

  // A recovery session opens its work with things the user loves, wherever
  // those sit in the ordinary order — but only the ones the two ends did not
  // already take, or the comfort would be counted twice and reach nothing.
  const comforts = recovering
    ? ordered.filter((candidate) => loved(candidate) && !taken.has(candidate.exercise.id)).slice(0, constants.recoveryLovedItems)
    : []
  const workOrder = [...comforts, ...ordered.filter((candidate) => !comforts.includes(candidate))]

  const work = fillWork(workOrder, taken, {
    budget: budgetSeconds - (warmUp?.cost ?? 0) - (dessert?.cost ?? 0),
    constants,
  })

  const warmUpSlots = warmUp ? [warmUpSlot(warmUp, constants)] : []
  const workSlots = work.map((candidate) => ({
    exercise: candidate.exercise,
    tempoBpm: candidate.state.nextTempo,
    reason: recovering && loved(candidate)
      ? `Taking it easy — one you love, ${tempoNote(candidate.state, candidate.exercise)}`
      : recovering
        ? `Taking it easy · ${reasonFor(candidate.state, candidate.exercise, day)}`
        : reasonFor(candidate.state, candidate.exercise, day),
  }))
  const dessertSlots = dessert ? [dessertSlot(dessert)] : []
  const planned = [warmUp, ...work, dessert].reduce((sum, candidate) => sum + (candidate?.cost ?? 0), 0)

  return {
    slots: [...warmUpSlots, ...workSlots, ...dessertSlots],
    warmUp: warmUpSlots,
    work: workSlots,
    dessert: dessertSlots,
    budgetSeconds,
    plannedSeconds: planned,
  }
}

/**
 * Something the hands already know, to open on. Solid or fine, technique by
 * preference, and in the key the work is about to be in — played at 85% of
 * what it is written for, as an extra rep that the schedule ignores.
 *
 * It is skipped when the last run ended within the window: practising twice in
 * half an hour does not need warming up twice.
 */
function pickWarmUp(
  candidates: readonly Candidate[],
  first: Candidate | null,
  taken: ReadonlySet<string>,
  budgetSeconds: number,
  today: Date,
  lastRunEnded: Date | null,
  constants: PlanConstants,
): Candidate | null {
  if (lastRunEnded !== null) {
    const sinceMinutes = (today.valueOf() - lastRunEnded.valueOf()) / 60_000
    if (sinceMinutes >= 0 && sinceMinutes < constants.warmUpSkipWindowMinutes) return null
  }

  const pool = candidates.filter(
    (candidate) =>
      settled(candidate) && !taken.has(candidate.exercise.id) && candidate.exercise.id !== first?.exercise.id,
  )
  if (pool.length === 0) return null

  const share = Math.min(budgetSeconds * constants.warmUpBudgetFraction, constants.warmUpMaxSeconds)
  const preferred = [...pool].sort((a, b) =>
    by(
      // An extra rep, so something not owed today comes first: an item that is
      // due deserves its own slot in the work, at its own tempo.
      flag(a.over >= 0) - flag(b.over >= 0),
      // Then something the user actually likes — a session should start well.
      flag(loved(b)) - flag(loved(a)),
      flag(b.exercise.area === 'technique') - flag(a.exercise.area === 'technique'),
      flag(first !== null && home(b.exercise) === home(first.exercise)) -
        flag(first !== null && home(a.exercise) === home(first.exercise)),
      a.cost - b.cost,
      a.rank - b.rank,
    ),
  )
  const fitting = preferred.find((candidate) => candidate.cost <= share)
  if (fitting) return fitting

  // Nothing is that short. The shortest suitable item stands in, unless even it
  // would eat the session — then the work is better served without a warm-up.
  const shortest = [...pool].sort((a, b) => by(a.cost - b.cost, a.rank - b.rank))[0]
  return shortest.cost <= budgetSeconds * constants.warmUpMaxFraction ? shortest : null
}

/**
 * Something to end on: the easiest solid thing in the pool, at its own tempo.
 * Peak and end are what a session is remembered by, so it never ends on a bail
 * (§7). Until feel exists this is the easiest item; from then on it is a loved
 * one.
 */
function pickDessert(
  candidates: readonly Candidate[],
  taken: ReadonlySet<string>,
  first: Candidate | null,
  roomSeconds: number,
): Candidate | null {
  const pool = candidates
    .filter(
      (candidate) =>
        // Loved beats easy: what a session is remembered by is what it ended
        // on, and an item the user loves ends it better than the one they
        // merely find easy. A stuck one is still a wall, though — loving
        // something does not make it a good note to finish on.
        ((loved(candidate) && candidate.state.band !== 'stuck') || settled(candidate)) &&
        !taken.has(candidate.exercise.id) &&
        // Never the thing the session exists for: a pool of two solid items
        // would otherwise be served entirely as warm-up and pudding, and the
        // overdue one would be told it was dessert.
        candidate.exercise.id !== first?.exercise.id,
    )
    .sort((a, b) =>
      by(
        flag(loved(b)) - flag(loved(a)),
        flag(b.state.band === 'easy') - flag(a.state.band === 'easy'),
        (b.state.margin ?? 0) - (a.state.margin ?? 0),
        a.cost - b.cost,
        a.rank - b.rank,
      ),
    )
  // It has to leave room for the work; a session that is only its dessert is not one.
  return pool.find((candidate) => candidate.cost < roomSeconds) ?? null
}

/**
 * The work, in the order the design sets, filled by minutes rather than slots.
 * An item is only started while there is budget left, so the plan passes what
 * was asked for by at most the one item that crossed the line.
 *
 * Two rules shape what goes in. At most three stuck items, because a session of
 * walls is a session not played. And from the second item on, the block keeps at
 * least as many winnable items as unwinnable ones — when the next in line would
 * break that, a winnable one further down takes its place and the skipped item
 * is offered again next time round. The *first* item is exempt: the session
 * exists for the thing most overdue, whatever state it is in.
 */
function fillWork(
  ordered: readonly Candidate[],
  taken: ReadonlySet<string>,
  { budget, constants }: { budget: number; constants: PlanConstants },
): Candidate[] {
  const queue = ordered.filter((candidate) => !taken.has(candidate.exercise.id))
  const used = new Set<string>()
  const block: Candidate[] = []
  let spent = 0
  let stuck = 0
  let dragged = 0
  let winners = 0
  let losers = 0

  while (spent < budget) {
    const available = queue.filter(
      (candidate) =>
        !used.has(candidate.exercise.id) &&
        (candidate.state.band !== 'stuck' || stuck < constants.maxStuckPerSession) &&
        // One slog a session. A wall the user hates is the thing most likely to
        // end the habit, so the rest of them wait for another day (§8).
        (!draggedWork(candidate) || dragged < constants.maxDraggedWorkPerSession),
    )
    if (available.length === 0) break

    // An item is only started if it actually fits what is left. Otherwise one
    // long exercise at the head of the queue would swallow a short session
    // whole, and the shorter items behind it — which would have fitted — would
    // never be reached at all.
    const fits = available.filter((candidate) => spent + candidate.cost <= budget)
    const next = fits[0]
    if (!next) {
      // Nothing left fits. Something is still better than nothing, so an empty
      // session takes the shortest item there is and goes over; otherwise the
      // block stands as it is.
      if (block.length > 0) break
      const shortest = [...available].sort((a, b) => by(a.cost - b.cost, a.rank - b.rank))[0]
      used.add(shortest.exercise.id)
      block.push(shortest)
      spent += shortest.cost
      if (shortest.state.band === 'stuck') stuck += 1
      if (draggedWork(shortest)) dragged += 1
      continue
    }

    // Behind on winnable items: reach past this one for the next that can go well.
    const share = constants.winnableWorkFraction
    const behind = !winnable(next) && winners * share < losers * (1 - share)
    const pick = behind ? (fits.find(winnable) ?? next) : next

    used.add(pick.exercise.id)
    block.push(pick)
    spent += pick.cost
    if (pick.state.band === 'stuck') stuck += 1
    if (draggedWork(pick)) dragged += 1
    if (winnable(pick)) winners += 1
    else losers += 1
  }

  return block
}

function warmUpSlot(candidate: Candidate, constants: PlanConstants): SessionSlot {
  const target = candidate.exercise.tempoBpm
  const tempoBpm = Math.round(target * constants.warmUpTempoFactor)
  const key = homeLabel(candidate.exercise)
  return {
    exercise: candidate.exercise,
    tempoBpm,
    reason: `Warm-up — hands first${key ? ` in ${key}` : ''}, at ${tempoBpm} of ${target} BPM`,
  }
}

function dessertSlot(candidate: Candidate): SessionSlot {
  // A solid item's next tempo is its target already; a loved one that is still
  // work keeps the tempo the fold asked for rather than being forced up to it.
  const tempoBpm = candidate.state.nextTempo
  const note = tempoNote(candidate.state, candidate.exercise)
  return {
    exercise: candidate.exercise,
    tempoBpm,
    reason: candidate.state.feel === 'loved' ? `To finish — one you love, ${note}` : `Dessert — you have this one, ${note}`,
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
