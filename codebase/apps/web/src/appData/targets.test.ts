import { describe, expect, it } from 'vitest'
import type { Exercise } from '../content'
import type { ExercisePriority, Goal } from './goal'
import { priorityMap, resolveTargets } from './targets'

/** What an exercise is judged against: the user's word, then the path's, then its own. */

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
    const targets = resolveTargets(catalog)
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

  it('lets the user overrule the path for one exercise', () => {
    const priorities: ExercisePriority[] = [{ exerciseId: 'a', priority: 'boosted', targetOverrideBpm: 90 }]
    const targets = resolveTargets(catalog, [goal('g1', [['a', 140]])], priorities)
    expect(targets.get('a')).toBe(90)
  })

  it('leaves the target alone for a priority that names no tempo', () => {
    const priorities: ExercisePriority[] = [{ exerciseId: 'a', priority: 'pinned', targetOverrideBpm: null }]
    expect(resolveTargets(catalog, [goal('g1', [['a', 140]])], priorities).get('a')).toBe(140)
  })

  it('has an entry for every exercise in the catalog and nothing else', () => {
    const targets = resolveTargets(catalog, [goal('g1', [['gone-since', 140]])])
    expect([...targets.keys()].sort()).toEqual(['a', 'b', 'c'])
  })
})

describe('priorityMap', () => {
  it('finds what was said about one exercise', () => {
    const priorities: ExercisePriority[] = [
      { exerciseId: 'a', priority: 'muted', targetOverrideBpm: null },
      { exerciseId: 'b', priority: 'pinned', targetOverrideBpm: 70 },
    ]
    const map = priorityMap(priorities)
    expect(map.get('a')?.priority).toBe('muted')
    expect(map.get('b')?.targetOverrideBpm).toBe(70)
    expect(map.get('c')).toBeUndefined()
  })
})
