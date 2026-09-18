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
  /** How many slots a session has, until the time budget replaces it (step 2). */
  sessionSlots: number
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
  sessionSlots: 5,
}
