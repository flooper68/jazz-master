import { describe, expect, it } from 'vitest'
import type { Exercise } from '../content'
import { foldRuns } from './memory'
import { FIRST_SEED, planNextSession, planSeed } from './nextSession'
import { PLAN_CONSTANTS } from './planConstants'
import type { Difficulty, ExerciseRun } from './run'

/**
 * The assembler, over states built by the fold — so what these tests assert is
 * what a real history would produce. Ids carry their own first interval (see
 * memory.test.ts), so due dates here are arithmetic, not guesses.
 */

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

function plan(runs: readonly ExerciseRun[], catalog: readonly Exercise[], day: string, seed = 'seed') {
  return planNextSession(foldRuns(runs, catalog), catalog, seed, new Date(`${day}T08:00:00`))
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
    const one = plan(runs, catalog, '2026-01-10', 'run-a')
    const other = plan(runs, catalog, '2026-01-10', 'run-z')
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

  it('offers a session of the default length, and no more', () => {
    const catalog = Array.from({ length: 12 }, (_, index) => exercise(`ex-${index}`))
    expect(plan([], catalog, '2026-01-10').slots).toHaveLength(PLAN_CONSTANTS.sessionSlots)
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
