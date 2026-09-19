/**
 * Every number the scheduler uses, in one place. The design names all of them
 * (docs/product/next-session-design.md §5–§7, §9) and expects them to be tuned
 * from the owner's own runs — so tuning stays a change to this file and never
 * a hunt through the fold and the assembler. Nothing else may hard-code one.
 */
export interface PlanConstants {
  /** What a review multiplies the interval by, per answer. `again` resets instead. */
  easyMultiplier: number
  goodMultiplier: number
  hardMultiplier: number
  /** Again, or a day where nothing was completed: back tomorrow. */
  againIntervalDays: number
  /** No interval ever grows past this. */
  maxIntervalDays: number
  /** Below the target tempo the interval is capped, whatever the answer says. */
  belowTargetMaxIntervalDays: number
  /**
   * Consecutive Again *reviews* that make an item stuck. A stuck item is due
   * every day, so in practice these are consecutive days — but a day skipped
   * between two Agains does not clear the count.
   */
  stuckAfterAgainDays: number
  /** What a stuck item is played at: the target, times this. */
  stuckTempoFactor: number
  /** Reviews without an Again that bring a stuck item back to its working tempo. */
  stuckRecoveryDays: number
  /** How much a working item's tempo creeps up from its best, toward the target. */
  tempoCreepBpm: number
  /** A new item's first interval falls in this range, staggered so a day's new items don't all land together. */
  newItemStaggerMinDays: number
  newItemStaggerMaxDays: number
  /** Solid needs this many different qualifying days — a binge cannot buy it. */
  solidQualifyingDays: number
  /**
   * Easy needs this many days answered Easy with the best tempo at or above
   * target — the margin, as the design's band table has it (§6), not the
   * single day's tempo the `solid` gate below looks at.
   */
  easyQualifyingDays: number
  /** How solid the previous stage must be before a stage opens. Unused until paths (step 4). */
  stageSolidThreshold: number
  /**
   * Lengths the user chooses between, in minutes, and the one a new user
   * starts on. Five is the floor: shorter than that and the overhead of
   * picking the guitar up is most of it.
   */
  sessionMinutes: readonly number[]
  defaultSessionMinutes: number
  /**
   * Added to every exercise's own length: picking it up, reading the tab,
   * finding the first note. A session of five two-minute exercises is not ten
   * minutes long, and a budget that pretends otherwise always overruns.
   */
  exerciseOverheadSeconds: number
  /**
   * The warm-up's share of the budget, and the ceiling it never passes. When
   * nothing suitable is that short — a ten-minute budget gives the warm-up
   * ninety seconds, and plenty of exercises are written longer — the shortest
   * suitable item stands in, up to `warmUpMaxFraction` of the budget. Past
   * that there is no warm-up: it would be the session.
   */
  warmUpBudgetFraction: number
  warmUpMaxSeconds: number
  warmUpMaxFraction: number
  /** What the warm-up is played at: the item's next tempo, times this. */
  warmUpTempoFactor: number
  /** Played again within this many minutes, the hands are still warm and the warm-up is skipped. */
  warmUpSkipWindowMinutes: number
  /** The most of the budget dessert may take: it closes the session, it is not the session. */
  dessertMaxFraction: number
  /** At most this many stuck items in one session — a session of walls is a session not played. */
  maxStuckPerSession: number
  /** This share of the work block must be winnable: fine, easy, or hard already at the target. */
  winnableWorkFraction: number
  /** At most this many dragged items that are still work — one slog a session is plenty. */
  maxDraggedWorkPerSession: number
  /** Below this share of runs completed, with nothing loved, the day went badly. */
  badDayCompletionRate: number
  /** This many bad days of practice in a row and the next session backs off. */
  badDaysBeforeRecovery: number
  /** A bad run older than this is history, not a state to be recovered from. */
  badDayStaleAfterDays: number
  /** How many exercises a suggested stage holds: enough to be a stage, few enough to accept. */
  expansionStageItems: number
  /** What a recovery session does: less of it, fewer walls, this many loved items, nothing new. */
  recoveryBudgetFactor: number
  recoveryStuckLimit: number
  recoveryLovedItems: number
}

export const PLAN_CONSTANTS: PlanConstants = {
  easyMultiplier: 2.5,
  goodMultiplier: 1.5,
  hardMultiplier: 1,
  againIntervalDays: 1,
  maxIntervalDays: 30,
  belowTargetMaxIntervalDays: 3,
  stuckAfterAgainDays: 3,
  stuckTempoFactor: 0.9,
  stuckRecoveryDays: 2,
  tempoCreepBpm: 5,
  newItemStaggerMinDays: 1,
  newItemStaggerMaxDays: 3,
  solidQualifyingDays: 2,
  easyQualifyingDays: 2,
  stageSolidThreshold: 2 / 3,
  sessionMinutes: [5, 10, 20, 40, 60],
  defaultSessionMinutes: 20,
  exerciseOverheadSeconds: 30,
  warmUpBudgetFraction: 0.15,
  warmUpMaxSeconds: 8 * 60,
  warmUpMaxFraction: 1 / 3,
  warmUpTempoFactor: 0.85,
  warmUpSkipWindowMinutes: 30,
  dessertMaxFraction: 1 / 3,
  maxStuckPerSession: 3,
  winnableWorkFraction: 0.5,
  maxDraggedWorkPerSession: 1,
  badDayCompletionRate: 0.5,
  badDaysBeforeRecovery: 2,
  badDayStaleAfterDays: 7,
  expansionStageItems: 4,
  recoveryBudgetFactor: 0.6,
  recoveryStuckLimit: 1,
  recoveryLovedItems: 2,
}
