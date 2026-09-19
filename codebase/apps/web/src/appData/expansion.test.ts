import { describe, expect, it } from 'vitest'
import type { Exercise } from '../content'
import { exhaustion, expansionStage } from './expansion'
import type { Goal } from './goal'
import { foldRuns } from './memory'
import { pathsProgress } from './path'
import type { ExerciseRun } from './run'
import { resolveTargets } from './targets'

/** When a path runs out, and what the app offers instead of a shrug. */

function exercise(id: string, over: Partial<Exercise> = {}): Exercise {
  return {
    id,
    title: id,
    area: 'lines',
    level: 1,
    tempoBpm: 100,
    duration: { kind: 'repetitions', count: 4 },
    notes: [],
    ...over,
  }
}

let counter = 0

function run(exerciseId: string, day: string): ExerciseRun {
  counter += 1
  return {
    id: `run-${counter}`,
    exerciseId,
    startedAt: new Date(`${day}T10:00:00`).toISOString(),
    durationSeconds: 90,
    tempoBpm: 100,
    passes: 4,
    completed: true,
    difficulty: 'good',
    feel: null,
    sessionId: null,
  }
}

function goalOf(stages: string[][]): Goal {
  return {
    id: 'goal-1',
    title: 'Play a blues',
    status: 'active',
    weight: 1,
    stages: stages.map((ids) => ({ items: ids.map((exerciseId) => ({ exerciseId, targetTempoBpm: 100 })) })),
  }
}

// A pack where kinship is decidable: two exercises share the goal's labels,
// two share nothing, and one is a level above.
const catalog: Exercise[] = [
  exercise('in-path-1', { contexts: ['major-ii-V-I'], styles: ['jazz/bebop'] }),
  exercise('in-path-2', { contexts: ['major-ii-V-I'], styles: ['jazz/bebop'] }),
  exercise('kin-easy', { contexts: ['major-ii-V-I'], styles: ['jazz/bebop'], level: 1, series: 'a-series' }),
  exercise('kin-harder', { contexts: ['major-ii-V-I'], level: 2, series: 'b-series' }),
  exercise('stranger', { contexts: ['12-bar-blues'], styles: ['rock'] }),
]

describe('expansionStage', () => {
  it('offers exercises that belong with the ones the goal already has', () => {
    const stage = expansionStage(goalOf([['in-path-1', 'in-path-2']]), catalog)
    const offered = stage?.items.map((item) => item.exerciseId) ?? []
    expect(offered).toContain('kin-easy')
    // Nothing in common with the path is not "more like this".
    expect(offered).not.toContain('stranger')
    // And never what is already in the path.
    expect(offered).not.toContain('in-path-1')
  })

  it('gives the same answer every time, for the same path and pack', () => {
    const goal = goalOf([['in-path-1', 'in-path-2']])
    expect(expansionStage(goal, catalog)).toEqual(expansionStage(goal, catalog))
  })

  it('carries the target the path was already asking for', () => {
    const goal = goalOf([['in-path-1']])
    const stage = expansionStage(goal, catalog)
    for (const item of stage?.items ?? []) expect(item.targetTempoBpm).toBe(100)
  })

  it('offers nothing when the pack has nothing that belongs', () => {
    const lonely = [exercise('only', { contexts: ['major-ii-V-I'] })]
    expect(expansionStage(goalOf([['only']]), lonely)).toBeNull()
  })
})

describe('exhaustion', () => {
  const goal = goalOf([['in-path-1', 'in-path-2']])
  const today = new Date('2026-04-10T18:00:00')

  function state(runs: readonly ExerciseRun[]) {
    return foldRuns(runs, catalog, undefined, resolveTargets(catalog, [goal], []))
  }

  function ask(runs: readonly ExerciseRun[]) {
    const folded = state(runs)
    return exhaustion(pathsProgress([goal], folded), folded, catalog, today)
  }

  it('is not exhausted before the path has been played at all', () => {
    expect(ask([]).exhausted).toBe(false)
  })

  it('is not exhausted while an open item has not been played today', () => {
    expect(ask([run('in-path-1', '2026-04-10')]).exhausted).toBe(false)
  })

  it('is exhausted once every open item has been played today, and offers more', () => {
    const result = ask([run('in-path-1', '2026-04-10'), run('in-path-2', '2026-04-10')])
    expect(result.exhausted).toBe(true)
    expect(result.expansion?.items.length).toBeGreaterThan(0)
  })

  it('is not exhausted by having played everything yesterday', () => {
    const result = ask([run('in-path-1', '2026-04-09'), run('in-path-2', '2026-04-09')])
    expect(result.exhausted).toBe(false)
  })

  it('has nothing to say when no goal is active', () => {
    expect(exhaustion([], state([]), catalog, today)).toEqual({ exhausted: false, expansion: null })
  })
})
