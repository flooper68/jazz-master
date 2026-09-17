import { describe, expect, it } from 'vitest'
import { EXERCISES as PACK } from '../content'
import {
  planQuickRun,
  sessionSearch,
  clampQuickRunCount,
  defaultQuickRunSettings,
  loadQuickRunSettings,
  pickQuickRun,
  QUICK_RUN_MAX,
} from './quickRun'

/** The five founding exercises: a pack small enough for a test to count — three scales, an arpeggio, a line. */
const FOUNDING_IDS = ['scales-major-open-c', 'scales-major-open-g', 'scales-major-open-f', 'lines-ii-v-i-f-arpeggios', 'lines-ii-v-i-f-line']
const EXERCISES = PACK.filter((exercise) => FOUNDING_IDS.includes(exercise.id))

const defaults = defaultQuickRunSettings(EXERCISES)

/** A deterministic stand-in for Math.random. */
function seeded(seed: number): () => number {
  let state = seed
  return () => {
    state = (state * 1_664_525 + 1_013_904_223) % 4_294_967_296
    return state / 4_294_967_296
  }
}

describe('pickQuickRun', () => {
  it('draws three different exercises by default, easier ones first', () => {
    for (let seed = 1; seed <= 25; seed += 1) {
      const picked = pickQuickRun(EXERCISES, defaults, seeded(seed))
      expect(picked).toHaveLength(3)
      expect(new Set(picked.map((exercise) => exercise.id)).size).toBe(3)
      const levels = picked.map((exercise) => exercise.level)
      expect(levels).toEqual([...levels].sort((a, b) => a - b))
    }
  })

  it('does not always draw the same run', () => {
    const runs = new Set(
      Array.from({ length: 25 }, (_, seed) =>
        pickQuickRun(EXERCISES, defaults, seeded(seed + 1)).map((exercise) => exercise.id).join(),
      ),
    )
    expect(runs.size).toBeGreaterThan(1)
  })

  it('draws only from the chosen areas, and no more than they hold', () => {
    const picked = pickQuickRun(EXERCISES, { count: 5, areas: ['scales'], routineId: null }, seeded(7))
    expect(picked.map((exercise) => exercise.area)).toEqual(['scales', 'scales', 'scales'])
  })
})

describe('quick run settings', () => {
  it('keeps the count inside its bounds', () => {
    expect(clampQuickRunCount(0)).toBe(1)
    expect(clampQuickRunCount(99)).toBe(QUICK_RUN_MAX)
    expect(clampQuickRunCount(Number.NaN)).toBe(3)
  })

  it('falls back to the defaults for missing or broken storage, and never to no areas', () => {
    expect(loadQuickRunSettings(EXERCISES, null)).toEqual(defaults)
    expect(loadQuickRunSettings(EXERCISES, { getItem: () => '{nope' })).toEqual(defaults)
    expect(
      loadQuickRunSettings(EXERCISES, { getItem: () => JSON.stringify({ count: 2, areas: ['bagpipes'] }) }),
    ).toEqual({ count: 2, areas: defaults.areas, routineId: null })
    expect(
      loadQuickRunSettings(EXERCISES, { getItem: () => JSON.stringify({ count: 4, areas: ['lines', 'scales'], routineId: 'r-1' }) }),
    ).toEqual({ count: 4, areas: ['scales', 'lines'], routineId: 'r-1' })
  })

  it('reads areas saved before standards became lines', () => {
    expect(
      loadQuickRunSettings(EXERCISES, { getItem: () => JSON.stringify({ count: 3, areas: ['standards'] }) }).areas,
    ).toEqual(['lines'])
  })
})

describe('planQuickRun', () => {
  const routine = {
    id: 'r-1',
    name: 'Warm-up',
    items: [{ exerciseId: 'lines-ii-v-i-f-line' }, { exerciseId: 'gone-since' }, { exerciseId: 'scales-major-open-c' }],
  }

  it('plays the chosen routine as prepared — its order, not easier-first — skipping what is gone', () => {
    const plan = planQuickRun(EXERCISES, { ...defaults, routineId: 'r-1' }, [routine], seeded(1))
    expect(plan.routine).toBe(routine)
    expect(plan.exercises.map((exercise) => exercise.id)).toEqual(['lines-ii-v-i-f-line', 'scales-major-open-c'])
    expect(sessionSearch(plan)).toEqual({ x: 'lines-ii-v-i-f-line,scales-major-open-c', r: 'r-1' })
  })

  it('falls back to the random draw when no routine is chosen, or the chosen one is gone or empty', () => {
    const emptied = { id: 'r-2', name: 'Emptied', items: [{ exerciseId: 'gone-since' }] }
    for (const [settings, routines] of [
      [defaults, [routine]],
      [{ ...defaults, routineId: 'deleted' }, [routine]],
      [{ ...defaults, routineId: 'r-2' }, [emptied]],
    ] as const) {
      const plan = planQuickRun(EXERCISES, settings, routines, seeded(3))
      expect(plan.routine).toBeNull()
      expect(plan.exercises).toHaveLength(3)
      expect(sessionSearch(plan)).not.toHaveProperty('r')
    }
  })
})
