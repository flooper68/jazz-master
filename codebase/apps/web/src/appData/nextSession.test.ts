import { describe, expect, it } from 'vitest'
import type { Exercise } from '../content'
import { exerciseCost, exerciseCosts } from './cost'
import { foldRuns } from './memory'
import { FIRST_SEED, planNextSession, planSeed, type NextSession, type PlanInput } from './nextSession'
import { PLAN_CONSTANTS, type PlanConstants } from './planConstants'
import type { Difficulty, ExerciseRun } from './run'

/**
 * The assembler, over states built by the fold — so what these tests assert is
 * what a real history would produce. Ids carry their own first interval (see
 * memory.test.ts), so due dates here are arithmetic, not guesses.
 *
 * The arc — warm-up and dessert — takes items out of the pool, which would
 * quietly rewrite every ordering assertion below. So the work block has its own
 * constants with both ends switched off (`WORK_ONLY`), and the arc has its own
 * describe further down where those items are the point.
 */

/** No warm-up and no dessert: what is left is the work block, in its own order. */
const WORK_ONLY: PlanConstants = {
  ...PLAN_CONSTANTS,
  warmUpBudgetFraction: 0,
  warmUpMaxFraction: 0,
  dessertMaxFraction: 0,
}

/** An hour: enough that nothing below is cut short by the budget. */
const ROOMY = 60 * 60

function exercise(id: string, tempoBpm = 100): Exercise {
  return { id, title: id, area: 'technique', level: 1, tempoBpm, duration: { kind: 'repetitions', count: 4 }, notes: [] }
}

let runCounter = 0

function run(
  exerciseId: string,
  day: string,
  { tempoBpm = 100, difficulty = 'good' as Difficulty | null, completed = true, at = '10:00' } = {},
): ExerciseRun {
  runCounter += 1
  return {
    id: `run-${runCounter}`,
    exerciseId,
    startedAt: new Date(`${day}T${at}:00`).toISOString(),
    durationSeconds: 90,
    tempoBpm,
    passes: 4,
    completed,
    difficulty,
    sessionId: null,
  }
}

function plan(
  runs: readonly ExerciseRun[],
  catalog: readonly Exercise[],
  day: string,
  extra: Partial<PlanInput> = {},
): NextSession {
  return planNextSession({
    state: foldRuns(runs, catalog),
    catalog,
    seed: 'seed',
    budgetSeconds: ROOMY,
    costs: exerciseCosts(runs, catalog),
    today: new Date(`${day}T08:00:00`),
    lastRunEnded: null,
    constants: WORK_ONLY,
    ...extra,
  })
}

function ids(session: { slots: { exercise: Exercise }[] }): string[] {
  return session.slots.map((slot) => slot.exercise.id)
}

describe('planNextSession', () => {
  it('gives the same plan for the same inputs', () => {
    const catalog = [exercise('ex-1'), exercise('ex-2'), exercise('ex-3'), exercise('a'), exercise('b')]
    const runs = [run('ex-1', '2026-01-09', { difficulty: 'again' }), run('b', '2026-01-09')]
    expect(plan(runs, catalog, '2026-01-10')).toEqual(plan(runs, catalog, '2026-01-10'))
  })

  it('keeps the work, maintenance and new slots when only the seed changes', () => {
    const catalog = [exercise('ex-1'), exercise('ex-2'), exercise('ex-3'), exercise('a')]
    const runs = [run('ex-1', '2026-01-09', { difficulty: 'again' })]
    const one = plan(runs, catalog, '2026-01-10', { seed: 'run-a' })
    const other = plan(runs, catalog, '2026-01-10', { seed: 'run-z' })
    expect(ids(one)).toEqual(ids(other))
  })

  it('puts a session together in the designed order, and says why each slot is there', () => {
    // The worked day of the design's §9: yesterday's binge is one review, an
    // early review did not advance the schedule, and with only three items due
    // the session fills ahead of schedule rather than being short.
    const catalog = [exercise('ex-1'), exercise('ex-2'), exercise('ex-3'), exercise('a'), exercise('b')]
    const runs = [
      // A binge on one day: three runs, one review, and the last answer stands.
      run('ex-1', '2026-01-09', { at: '09:00', difficulty: 'good' }),
      run('ex-1', '2026-01-09', { at: '10:00', difficulty: 'hard' }),
      run('ex-1', '2026-01-09', { at: '11:00', difficulty: 'again' }),
      // Never at the target yet, and reviewed a day early: due today all the same.
      run('ex-2', '2026-01-05', { tempoBpm: 90 }),
      run('ex-2', '2026-01-06', { tempoBpm: 90 }),
      // Solid, and a day overdue.
      run('ex-3', '2026-01-01'),
      run('ex-3', '2026-01-04'),
      // Played yesterday, not due again until the twelfth.
      run('b', '2026-01-09'),
      // `a` has never been played.
    ]
    const session = plan(runs, catalog, '2026-01-10')

    expect(ids(session)).toEqual(['ex-1', 'ex-2', 'ex-3', 'a', 'b'])
    expect(session.slots.map((slot) => slot.reason)).toEqual([
      'Due today · at its tempo, 100 BPM',
      'Due today · at 95 of 100 BPM',
      'Overdue 1 day · at its tempo, 100 BPM',
      'New — not played yet',
      'Ahead of schedule · at its tempo, 100 BPM',
    ])
    // Each slot carries the tempo the fold worked out, not the written one.
    expect(session.slots.map((slot) => slot.tempoBpm)).toEqual([100, 95, 100, 100, 100])
  })

  it('leads with the most overdue work', () => {
    const catalog = [exercise('ex-1'), exercise('ex-2'), exercise('ex-3')]
    const runs = [
      // Due the second, the fourth and the fifth: three, one and no days overdue.
      run('ex-1', '2026-01-01', { difficulty: 'again' }),
      run('ex-2', '2026-01-02', { difficulty: 'again' }),
      run('ex-3', '2026-01-04', { difficulty: 'again' }),
    ]
    expect(ids(plan(runs, catalog, '2026-01-05'))).toEqual(['ex-1', 'ex-2', 'ex-3'])
  })

  it('takes due work before due maintenance, and both before anything new', () => {
    const catalog = [exercise('fresh'), exercise('ex-3'), exercise('ex-1')]
    const runs = [
      // ex-3 is solid and due today; ex-1 has never reached the target, so it is still work.
      run('ex-3', '2026-01-01'),
      run('ex-3', '2026-01-04'),
      run('ex-1', '2026-01-08', { tempoBpm: 80 }),
    ]
    expect(ids(plan(runs, catalog, '2026-01-09'))).toEqual(['ex-1', 'ex-3', 'fresh'])
  })

  it('brings a stuck item back every day, lowered', () => {
    const catalog = [exercise('a'), exercise('ex-2')]
    const stuck = ['2026-01-01', '2026-01-02', '2026-01-03'].map((day) =>
      run('ex-2', day, { difficulty: 'again' }),
    )
    const session = plan(stuck, catalog, '2026-01-04')
    expect(session.slots[0].exercise.id).toBe('ex-2')
    expect(session.slots[0].tempoBpm).toBe(90)
    expect(session.slots[0].reason).toBe('Stuck — easier today, taken down to 90 of 100 BPM')
  })

  it('does not say "today" about a stuck item it reached ahead of schedule', () => {
    const catalog = [exercise('ex-2')]
    const stuck = ['2026-01-01', '2026-01-02', '2026-01-03'].map((day) =>
      run('ex-2', day, { difficulty: 'again' }),
    )
    // Planned later on the day it was already played: due tomorrow, not today.
    const session = plan(stuck, catalog, '2026-01-03')
    expect(session.slots[0].reason).toBe('Stuck — easier, taken down to 90 of 100 BPM')
    expect(session.slots[0].tempoBpm).toBe(90)
  })

  it('is never empty: nothing due still fills ahead of schedule', () => {
    const catalog = [exercise('ex-1'), exercise('ex-2'), exercise('ex-3')]
    // Everything reviewed today, so nothing is due again for days.
    const runs = catalog.map((item) => run(item.id, '2026-01-10', { difficulty: 'easy' }))
    const session = plan(runs, catalog, '2026-01-10')
    expect(session.slots).toHaveLength(3)
    for (const slot of session.slots) expect(slot.reason).not.toHaveLength(0)
  })

  it('fills the minutes it was given and stops', () => {
    const catalog = Array.from({ length: 40 }, (_, index) => exercise(`ex-${index}`))
    const each = exerciseCost(catalog[0], [])
    const budgetSeconds = 10 * 60
    const session = plan([], catalog, '2026-01-10', { budgetSeconds })
    // Never short of the budget while the catalog still has something to offer,
    // and never past it by more than the one item that crossed the line.
    expect(session.plannedSeconds).toBeGreaterThan(budgetSeconds - each)
    expect(session.plannedSeconds).toBeLessThanOrEqual(budgetSeconds + each)
  })

  it('has nothing to offer when the catalog is empty', () => {
    expect(plan([], [], '2026-01-10').slots).toEqual([])
  })

  it('gives every slot a reason', () => {
    const catalog = [exercise('ex-1'), exercise('ex-2'), exercise('ex-3'), exercise('a'), exercise('b')]
    const runs = [
      run('ex-1', '2026-01-01', { difficulty: 'again' }),
      run('ex-2', '2026-01-02', { tempoBpm: 80 }),
      run('ex-3', '2026-01-03', { difficulty: 'easy' }),
      run('b', '2026-01-09', { difficulty: 'easy' }),
    ]
    for (const slot of plan(runs, catalog, '2026-01-10').slots) {
      expect(slot.reason.length).toBeGreaterThan(0)
      expect(slot.tempoBpm).toBeGreaterThan(0)
    }
  })
})

describe('planSeed', () => {
  it('seeds from the newest run', () => {
    expect(
      planSeed([
        { id: 'older', startedAt: '2026-01-01T10:00:00.000Z' },
        { id: 'newest', startedAt: '2026-01-09T10:00:00.000Z' },
        { id: 'middle', startedAt: '2026-01-04T10:00:00.000Z' },
      ]),
    ).toBe('newest')
  })

  it('falls back to a fixed seed before the first run', () => {
    expect(planSeed([])).toBe(FIRST_SEED)
  })

  it('breaks a tie on the id, so the row order cannot change the plan', () => {
    const at = '2026-01-09T10:00:00.000Z'
    expect(planSeed([{ id: 'a', startedAt: at }, { id: 'b', startedAt: at }])).toBe('b')
    expect(planSeed([{ id: 'b', startedAt: at }, { id: 'a', startedAt: at }])).toBe('b')
  })
})

/**
 * The arc: a session opens on something the hands know and ends on something
 * that plays itself, and the whole of it fits the minutes the user has. These
 * run against the real constants — the arc is what is being tested.
 */
describe('the shape of a session', () => {
  /** Two clean days at the target: solid, so it can open or close a session. */
  function solid(id: string, from = '2026-01-01'): ExerciseRun[] {
    return [run(id, from), run(id, addDay(from, 1))]
  }

  function addDay(day: string, days: number): string {
    const date = new Date(`${day}T10:00:00`)
    date.setDate(date.getDate() + days)
    return date.toISOString().slice(0, 10)
  }

  const arc = (
    runs: readonly ExerciseRun[],
    catalog: readonly Exercise[],
    day: string,
    extra: Partial<PlanInput> = {},
  ) => plan(runs, catalog, day, { constants: PLAN_CONSTANTS, budgetSeconds: 10 * 60, ...extra })

  it('opens on something solid, ends on something solid, and works in between', () => {
    const catalog = [exercise('wall'), exercise('known'), exercise('easy-one')]
    const runs = [
      // Never at the target, and overdue: this is what the session is for.
      run('wall', '2026-01-05', { tempoBpm: 70 }),
      ...solid('known'),
      ...solid('easy-one').map((item) => ({ ...item, difficulty: 'easy' as const })),
    ]
    const session = arc(runs, catalog, '2026-01-10')

    expect(session.warmUp).toHaveLength(1)
    expect(session.dessert).toHaveLength(1)
    expect(session.work.map((slot) => slot.exercise.id)).toEqual(['wall'])
    expect(session.slots.map((slot) => slot.exercise.id)).toEqual([
      ...session.warmUp.map((slot) => slot.exercise.id),
      'wall',
      ...session.dessert.map((slot) => slot.exercise.id),
    ])
    expect(session.warmUp[0].reason).toMatch(/^Warm-up — /)
    expect(session.dessert[0].reason).toMatch(/^Dessert — /)
  })

  it('the ten-minute day: a warm-up, the thing most overdue, and something to end on', () => {
    const catalog = [exercise('overdue'), exercise('known'), exercise('easy-one')]
    const runs = [
      run('overdue', '2026-01-02', { tempoBpm: 70 }),
      ...solid('known'),
      ...solid('easy-one').map((item) => ({ ...item, difficulty: 'easy' as const })),
    ]
    const session = arc(runs, catalog, '2026-01-10')

    expect(ids(session)).toHaveLength(3)
    expect(session.work.map((slot) => slot.exercise.id)).toEqual(['overdue'])
    expect(session.work[0].reason).toContain('Overdue')
    // The easiest solid item is what it ends on: easy before merely fine.
    expect(session.dessert[0].exercise.id).toBe('easy-one')
    expect(session.warmUp[0].exercise.id).toBe('known')
  })

  it('plays the warm-up slower than it is written, as an extra rep', () => {
    const catalog = [exercise('wall'), exercise('known', 120)]
    const runs = [run('wall', '2026-01-05', { tempoBpm: 70 }), ...solid('known').map((item) => ({ ...item, tempoBpm: 120 }))]
    const session = arc(runs, catalog, '2026-01-10')
    expect(session.warmUp[0].exercise.id).toBe('known')
    expect(session.warmUp[0].tempoBpm).toBe(Math.round(120 * PLAN_CONSTANTS.warmUpTempoFactor))
    expect(session.warmUp[0].reason).toContain('102 of 120 BPM')
  })

  it('leaves the warm-up out when the hands are still warm', () => {
    const catalog = [exercise('wall'), exercise('known'), exercise('easy-one')]
    const runs = [
      run('wall', '2026-01-05', { tempoBpm: 70 }),
      ...solid('known'),
      ...solid('easy-one').map((item) => ({ ...item, difficulty: 'easy' as const })),
    ]
    const justPlayed = new Date('2026-01-10T07:45:00')
    const hoursAgo = new Date('2026-01-10T05:00:00')

    expect(arc(runs, catalog, '2026-01-10', { lastRunEnded: justPlayed }).warmUp).toEqual([])
    // The dessert stays: it is the end of the session, not a matter of cold hands.
    expect(arc(runs, catalog, '2026-01-10', { lastRunEnded: justPlayed }).dessert).toHaveLength(1)
    expect(arc(runs, catalog, '2026-01-10', { lastRunEnded: hoursAgo }).warmUp).toHaveLength(1)
  })

  it('has neither end when nothing has been played through yet', () => {
    const catalog = [exercise('a'), exercise('b'), exercise('c')]
    const session = arc([], catalog, '2026-01-10')
    expect(session.warmUp).toEqual([])
    expect(session.dessert).toEqual([])
    expect(session.work.length).toBeGreaterThan(0)
  })

  it('fits every length on offer, to within one item', () => {
    const catalog = Array.from({ length: 200 }, (_, index) => exercise(`ex-${index}`))
    const runs = catalog.slice(0, 40).flatMap((item) => solid(item.id))
    for (const minutes of PLAN_CONSTANTS.sessionMinutes) {
      const session = arc(runs, catalog, '2026-01-10', { budgetSeconds: minutes * 60 })
      const dearest = Math.max(...session.slots.map((slot) => exerciseCost(slot.exercise, [])), 0)
      const played = Math.max(...runs.map((item) => item.durationSeconds)) + PLAN_CONSTANTS.exerciseOverheadSeconds
      expect(session.plannedSeconds).toBeLessThanOrEqual(minutes * 60 + Math.max(dearest, played))
      expect(session.plannedSeconds).toBeGreaterThan(minutes * 60 * 0.5)
    }
  })

  it('never puts more than three stuck items in one session', () => {
    const catalog = Array.from({ length: 8 }, (_, index) => exercise(`stuck-${index}`))
    const runs = catalog.flatMap((item) =>
      ['2026-01-01', '2026-01-02', '2026-01-03'].map((day) => run(item.id, day, { difficulty: 'again' })),
    )
    const session = arc(runs, catalog, '2026-01-04', { budgetSeconds: 60 * 60 })
    expect(session.work.length).toBeGreaterThan(0)
    expect(session.work.filter((slot) => slot.reason.startsWith('Stuck'))).toHaveLength(
      PLAN_CONSTANTS.maxStuckPerSession,
    )
  })

  it('keeps at least half the work winnable, once the thing it is for is set aside', () => {
    // Six walls, and solid work to put beside them: left alone the walls would
    // take the session, because every one of them is overdue.
    const walls = Array.from({ length: 6 }, (_, index) => exercise(`wall-${index}`))
    const knowns = Array.from({ length: 10 }, (_, index) => exercise(`known-${index}`))
    const runs = [
      ...walls.map((item) => run(item.id, '2026-01-02', { tempoBpm: 70 })),
      ...knowns.flatMap((item) => solid(item.id)),
    ]
    const session = arc(runs, [...walls, ...knowns], '2026-01-10', { budgetSeconds: 40 * 60 })
    const winners = session.work.filter((slot) => slot.exercise.id.startsWith('known'))
    expect(session.work.length).toBeGreaterThan(3)
    expect(winners.length).toBeGreaterThanOrEqual(Math.floor(session.work.length / 2))
    // And the walls are still there: keeping the session winnable is not avoiding the work.
    expect(session.work.filter((slot) => slot.exercise.id.startsWith('wall')).length).toBeGreaterThan(0)
  })

  it('reaches past an item too long for what is left, rather than letting it eat the session', () => {
    // Every fixture elsewhere costs the same, which hides this entirely: a long
    // item at the head of the queue would be started anyway and a ten-minute
    // session would come out at forty.
    const catalog = [exercise('marathon'), exercise('short-1'), exercise('short-2')]
    const costs = new Map([
      ['marathon', 40 * 60],
      ['short-1', 150],
      ['short-2', 150],
    ])
    const session = arc([], catalog, '2026-01-10', { budgetSeconds: 10 * 60, costs })

    expect(session.work.map((slot) => slot.exercise.id)).toEqual(['short-1', 'short-2'])
    expect(session.plannedSeconds).toBeLessThanOrEqual(10 * 60)
  })

  it('takes one item it cannot afford rather than offering an empty session', () => {
    const catalog = [exercise('marathon')]
    const costs = new Map([['marathon', 40 * 60]])
    const session = arc([], catalog, '2026-01-10', { budgetSeconds: 10 * 60, costs })
    expect(session.work.map((slot) => slot.exercise.id)).toEqual(['marathon'])
  })

  it('never serves the thing the session is for as its dessert', () => {
    // Two solid items, both overdue: the arc would happily take both ends and
    // leave no work at all, telling the overdue one it was pudding.
    const catalog = [exercise('owed'), exercise('other')]
    const runs = [...solid('owed'), ...solid('other')]
    const session = arc(runs, catalog, '2026-01-20')

    expect(session.work.length).toBeGreaterThan(0)
    const dessert = session.dessert.map((slot) => slot.exercise.id)
    expect(dessert).not.toContain(session.work[0].exercise.id)
  })

  it('warms up on something not owed today, so the work keeps its own slot', () => {
    // `owed` is overdue and solid; `spare` is not due for days. The warm-up is
    // an extra rep, so it takes the spare one and leaves the owed one to the work.
    const catalog = [exercise('wall'), exercise('owed'), exercise('spare')]
    const runs = [
      run('wall', '2026-01-05', { tempoBpm: 70 }),
      ...solid('owed'),
      // Played only yesterday, so it is not owed again for days.
      ...solid('spare', '2026-01-18'),
    ]
    const session = arc(runs, catalog, '2026-01-20', { budgetSeconds: 40 * 60 })
    expect(session.warmUp.map((slot) => slot.exercise.id)).toEqual(['spare'])
    // And the owed one is still played, at the tempo its review asked for
    // rather than the warm-up's 85%.
    const owed = session.slots.find((slot) => slot.exercise.id === 'owed')
    expect(owed?.tempoBpm).toBe(100)
  })

  it('still stands when every single thing is stuck', () => {
    const catalog = Array.from({ length: 5 }, (_, index) => exercise(`stuck-${index}`))
    const runs = catalog.flatMap((item) =>
      ['2026-01-01', '2026-01-02', '2026-01-03'].map((day) => run(item.id, day, { difficulty: 'again' })),
    )
    const session = arc(runs, catalog, '2026-01-04', { budgetSeconds: 60 * 60 })
    // Nothing is solid, so there is no arc — and the cap still holds.
    expect(session.warmUp).toEqual([])
    expect(session.dessert).toEqual([])
    expect(session.work).toHaveLength(PLAN_CONSTANTS.maxStuckPerSession)
  })
})
