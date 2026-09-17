import { describe, expect, it } from 'vitest'
import { EXERCISES } from '../content'
import {
  clampQuickRunCount,
  defaultQuickRunSettings,
  loadQuickRunSettings,
  pickQuickRun,
  QUICK_RUN_MAX,
} from './quickRun'

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
    const picked = pickQuickRun(EXERCISES, { count: 5, areas: ['scales'] }, seeded(7))
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
    ).toEqual({ count: 2, areas: defaults.areas })
    expect(
      loadQuickRunSettings(EXERCISES, { getItem: () => JSON.stringify({ count: 4, areas: ['standards', 'scales'] }) }),
    ).toEqual({ count: 4, areas: ['scales', 'standards'] })
  })
})
