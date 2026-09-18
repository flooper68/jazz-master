import { describe, expect, it } from 'vitest'
import type { Exercise } from '../content'
import { daysBetween, foldRuns, staggerDays, type ExerciseState } from './memory'
import { PLAN_CONSTANTS } from './planConstants'
import type { Difficulty, ExerciseRun } from './run'

/**
 * The fold, day by day. Ids are chosen for their stagger — the first interval
 * of a new item is 1–3 days, hashed from the id — so the multipliers can be
 * asserted as numbers: `ex-1` staggers 1 day, `ex-2` two, `ex-3` three.
 */

function exercise(id: string, tempoBpm: number): Exercise {
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

function state(runs: readonly ExerciseRun[], subject: Exercise): ExerciseState {
  const folded = foldRuns(runs, [subject]).get(subject.id)
  if (!folded) throw new Error('every catalog exercise is folded')
  return folded
}

describe('foldRuns', () => {
  it('gives an exercise that was never played a new state', () => {
    const subject = exercise('ex-1', 100)
    expect(state([], subject)).toEqual({
      band: 'new',
      interval: 0,
      due: null,
      bestTempo: null,
      margin: null,
      nextTempo: 100,
      lastReview: null,
    })
  })

  it('ignores runs of an exercise that is no longer in the catalog', () => {
    const subject = exercise('ex-1', 100)
    expect(foldRuns([run('gone', '2026-01-01')], [subject]).size).toBe(1)
    expect(state([run('gone', '2026-01-01')], subject).band).toBe('new')
  })

  it('folds a day of runs into one review — the last answer, the best tempo', () => {
    const subject = exercise('ex-2', 100)
    const binge = [
      run('ex-2', '2026-01-01', { at: '09:00', tempoBpm: 80, difficulty: 'again' }),
      run('ex-2', '2026-01-01', { at: '10:00', tempoBpm: 100, difficulty: 'hard' }),
      run('ex-2', '2026-01-01', { at: '11:00', tempoBpm: 90, difficulty: 'good' }),
    ]
    const folded = state(binge, subject)
    // One review, not three: the first interval is the stagger, not three multiplications.
    expect(folded.interval).toBe(staggerDays('ex-2'))
    expect(folded.bestTempo).toBe(100)
    expect(folded.lastReview).toBe('2026-01-01')
    // And it is still working — solid takes two different days.
    expect(folded.band).toBe('hard')
  })

  it('reads an unanswered day as Good when something was completed, Again when nothing was', () => {
    const subject = exercise('ex-2', 100)
    const answered = state([run('ex-2', '2026-01-01', { difficulty: null })], subject)
    expect(answered.interval).toBe(2)
    const bailed = state([run('ex-2', '2026-01-01', { difficulty: null, completed: false })], subject)
    expect(bailed.interval).toBe(PLAN_CONSTANTS.againIntervalDays)
    expect(bailed.bestTempo).toBeNull()
  })

  it('starts a new item at its stagger, whatever the answer', () => {
    const subject = exercise('ex-3', 100)
    expect(state([run('ex-3', '2026-01-01', { difficulty: 'easy' })], subject).interval).toBe(3)
    expect(state([run('ex-3', '2026-01-01', { difficulty: 'good' })], subject).interval).toBe(3)
    // Again is the exception: it comes back tomorrow from the very first day.
    expect(state([run('ex-3', '2026-01-01', { difficulty: 'again' })], subject).interval).toBe(1)
  })

  it.each([
    { difficulty: 'easy' as const, expected: 5 },
    { difficulty: 'good' as const, expected: 3 },
    { difficulty: 'hard' as const, expected: 2 },
    { difficulty: 'again' as const, expected: 1 },
  ])('multiplies the interval on a $difficulty review', ({ difficulty, expected }) => {
    const subject = exercise('ex-2', 100)
    // Day one leaves the interval at the stagger, two days.
    const runs = [run('ex-2', '2026-01-01'), run('ex-2', '2026-01-03', { difficulty })]
    expect(state(runs, subject).interval).toBe(expected)
  })

  it('caps the interval at three days while the best tempo is under the target', () => {
    const subject = exercise('ex-1', 100)
    const under = { tempoBpm: 90 }
    const runs = [
      run('ex-1', '2026-01-01', under),
      run('ex-1', '2026-01-02', under),
      run('ex-1', '2026-01-04', under),
      run('ex-1', '2026-01-07', under),
    ]
    const folded = state(runs, subject)
    // 1 → 2 → 3 → would be 5, held at the below-target cap.
    expect(folded.interval).toBe(PLAN_CONSTANTS.belowTargetMaxIntervalDays)
    expect(folded.margin).toBe(-10)
    expect(folded.band).toBe('hard')
    // Working tempo creeps toward the target from the best, never past it.
    expect(folded.nextTempo).toBe(95)
  })

  it('never lets an interval past the thirty-day cap', () => {
    const subject = exercise('ex-2', 100)
    const days = ['2026-01-01', '2026-01-03', '2026-01-08', '2026-01-21', '2026-03-01', '2026-05-01', '2026-08-01']
    const runs = days.map((day) => run('ex-2', day, { difficulty: 'easy' }))
    expect(state(runs, subject).interval).toBe(PLAN_CONSTANTS.maxIntervalDays)
  })

  it('does not let an early review advance the schedule', () => {
    const subject = exercise('ex-2', 100)
    // Day one: interval two, due the third.
    expect(state([run('ex-2', '2026-01-01', { difficulty: 'easy' })], subject).due).toBe('2026-01-03')
    // Reviewed a day early: the next due counts from the day it was owed, not from today.
    const early = [run('ex-2', '2026-01-01', { difficulty: 'easy' }), run('ex-2', '2026-01-02', { difficulty: 'easy' })]
    const folded = state(early, subject)
    expect(folded.interval).toBe(5)
    expect(folded.due).toBe('2026-01-08')
    expect(folded.lastReview).toBe('2026-01-02')
  })

  it('needs two different days at the target before an item counts as solid', () => {
    const subject = exercise('ex-2', 100)
    const oneDay = [
      run('ex-2', '2026-01-01', { at: '09:00' }),
      run('ex-2', '2026-01-01', { at: '10:00' }),
      run('ex-2', '2026-01-01', { at: '11:00' }),
    ]
    // Three runs at the target in one day: still working.
    expect(state(oneDay, subject).band).toBe('hard')
    const twoDays = [run('ex-2', '2026-01-01'), run('ex-2', '2026-01-03')]
    expect(state(twoDays, subject).band).toBe('fine')
  })

  it('reaches the easy band on two Easy days at or above the target', () => {
    const subject = exercise('ex-2', 100)
    const runs = [
      run('ex-2', '2026-01-01', { difficulty: 'easy' }),
      run('ex-2', '2026-01-03', { difficulty: 'easy' }),
    ]
    const folded = state(runs, subject)
    expect(folded.band).toBe('easy')
    expect(folded.nextTempo).toBe(100)
  })

  it('calls an item stuck after three Again days and lowers its tempo', () => {
    const subject = exercise('ex-2', 100)
    const days = ['2026-01-01', '2026-01-02', '2026-01-03']
    const folded = state(days.map((day) => run('ex-2', day, { difficulty: 'again' })), subject)
    expect(folded.band).toBe('stuck')
    expect(folded.nextTempo).toBe(90)
    // Stuck comes back every day — it is shown easier, not more.
    expect(folded.interval).toBe(1)
    expect(folded.due).toBe('2026-01-04')
  })

  it('does not call an item stuck when a clean day breaks the run of Agains', () => {
    const subject = exercise('ex-2', 100)
    const runs = [
      run('ex-2', '2026-01-01', { difficulty: 'again' }),
      run('ex-2', '2026-01-02', { difficulty: 'again' }),
      run('ex-2', '2026-01-03', { difficulty: 'good' }),
      run('ex-2', '2026-01-04', { difficulty: 'again' }),
    ]
    expect(state(runs, subject).band).not.toBe('stuck')
  })

  it('brings a stuck item back to its working tempo after two clean days', () => {
    const subject = exercise('ex-2', 100)
    const stuck = [
      run('ex-2', '2026-01-01', { difficulty: 'again' }),
      run('ex-2', '2026-01-02', { difficulty: 'again' }),
      run('ex-2', '2026-01-03', { difficulty: 'again' }),
    ]
    const oneCleanDay = [...stuck, run('ex-2', '2026-01-04', { difficulty: 'hard' })]
    // One good day is not recovery: still easier.
    expect(state(oneCleanDay, subject)).toMatchObject({ band: 'stuck', nextTempo: 90 })
    const twoCleanDays = [...oneCleanDay, run('ex-2', '2026-01-05', { difficulty: 'good' })]
    const recovered = state(twoCleanDays, subject)
    expect(recovered.band).not.toBe('stuck')
    expect(recovered.nextTempo).toBe(100)
  })

  it('folds every exercise of the catalog, with or without runs', () => {
    const catalog = [exercise('ex-1', 100), exercise('ex-2', 120), exercise('ex-3', 80)]
    const folded = foldRuns([run('ex-2', '2026-01-01', { tempoBpm: 120 })], catalog)
    expect([...folded.keys()]).toEqual(['ex-1', 'ex-2', 'ex-3'])
    expect(folded.get('ex-1')?.band).toBe('new')
    expect(folded.get('ex-2')?.bestTempo).toBe(120)
  })
})

/**
 * The warm-up and the dessert are ordinary runs — no flag, no special case —
 * so what stops an extra rep from buying its way forward is the fold itself.
 */
describe('an extra rep of something already learned', () => {
  const subject = exercise('known', 100)
  const learned = [run('known', '2026-01-01'), run('known', '2026-01-02'), run('known', '2026-01-03')]

  it('does not bring the next review forward', () => {
    const before = state(learned, subject)
    const withExtra = state([...learned, run('known', '2026-01-04', { tempoBpm: 85, difficulty: 'good' })], subject)
    expect(before.due).not.toBeNull()
    // An early review counts from the day it was already owed, never from today,
    // so playing it again can only ever push the next one further out.
    expect(daysBetween(before.due ?? '', withExtra.due ?? '')).toBeGreaterThanOrEqual(0)
  })

  it('does not take an item it was played slowly out of its band', () => {
    const before = state(learned, subject)
    const withExtra = state([...learned, run('known', '2026-01-04', { tempoBpm: 85, difficulty: 'good' })], subject)
    expect(withExtra.band).toBe(before.band)
    expect(withExtra.bestTempo).toBe(before.bestTempo)
  })
})

describe('staggerDays', () => {
  it('spreads new items over the first-interval range', () => {
    for (const id of ['ex-1', 'ex-2', 'ex-3', 'anything at all']) {
      expect(staggerDays(id)).toBeGreaterThanOrEqual(PLAN_CONSTANTS.newItemStaggerMinDays)
      expect(staggerDays(id)).toBeLessThanOrEqual(PLAN_CONSTANTS.newItemStaggerMaxDays)
    }
  })

  it('gives an exercise the same first interval every time', () => {
    expect(staggerDays('ex-2')).toBe(staggerDays('ex-2'))
  })
})
