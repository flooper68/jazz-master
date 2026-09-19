import { describe, expect, it } from 'vitest'
import type { Exercise } from '../content'
import type { Goal } from './goal'
import { resolveTargets } from './targets'

/** What an exercise is judged against: the path's target, then its own. */

function exercise(id: string, tempoBpm: number): Exercise {
  return { id, title: id, area: 'technique', level: 1, tempoBpm, duration: { kind: 'repetitions', count: 4 }, notes: [] }
}

function goal(id: string, items: [string, number][], status: Goal['status'] = 'active'): Goal {
  return {
    id,
    title: id,
    status,
    weight: 1,
    stages: [{ items: items.map(([exerciseId, targetTempoBpm]) => ({ exerciseId, targetTempoBpm })) }],
  }
}

const catalog = [exercise('a', 100), exercise('b', 80), exercise('c', 120)]

describe('resolveTargets', () => {
  it('falls back to the tempo an exercise is written at', () => {
    const targets = resolveTargets(catalog, [])
    expect(targets.get('a')).toBe(100)
    expect(targets.get('b')).toBe(80)
  })

  it('takes the target an active path asks for', () => {
    const targets = resolveTargets(catalog, [goal('g1', [['a', 140]])])
    expect(targets.get('a')).toBe(140)
    // Everything the path says nothing about keeps its own tempo.
    expect(targets.get('b')).toBe(80)
  })

  it('ignores a paused goal, so pausing really does stop it asking', () => {
    const targets = resolveTargets(catalog, [goal('g1', [['a', 140]], 'paused')])
    expect(targets.get('a')).toBe(100)
  })

  it('takes the higher target when two goals want the same exercise', () => {
    // Having it at 160 satisfies the goal that wanted 120; the other way round
    // would quietly tell the harder goal it was finished.
    const targets = resolveTargets(catalog, [goal('g1', [['a', 120]]), goal('g2', [['a', 160]])])
    expect(targets.get('a')).toBe(160)
  })

  it('has an entry for every exercise in the catalog and nothing else', () => {
    const targets = resolveTargets(catalog, [goal('g1', [['gone-since', 140]])])
    expect([...targets.keys()].sort()).toEqual(['a', 'b', 'c'])
  })
})

