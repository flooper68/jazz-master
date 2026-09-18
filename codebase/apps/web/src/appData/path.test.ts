import { describe, expect, it } from 'vitest'
import type { Exercise } from '../content'
import type { Goal } from './goal'
import { foldRuns, type ExerciseState } from './memory'
import { eligibleNewIds, pathProgress, pathsProgress } from './path'
import { PLAN_CONSTANTS } from './planConstants'
import type { Difficulty, ExerciseRun } from './run'
import { resolveTargets } from './targets'

/** Which stages of a path are open, worked out from states the fold really produced. */

function exercise(id: string, tempoBpm = 100): Exercise {
  return { id, title: id, area: 'technique', level: 1, tempoBpm, duration: { kind: 'repetitions', count: 4 }, notes: [] }
}

let counter = 0

function run(exerciseId: string, day: string, { tempoBpm = 100, difficulty = 'good' as Difficulty | null } = {}): ExerciseRun {
  counter += 1
  return {
    id: `run-${counter}`,
    exerciseId,
    startedAt: new Date(`${day}T10:00:00`).toISOString(),
    durationSeconds: 90,
    tempoBpm,
    passes: 4,
    completed: true,
    difficulty,
    feel: null,
    sessionId: null,
  }
}

/** Two clean days at the target: what the fold calls solid. */
function solid(id: string, tempoBpm = 100): ExerciseRun[] {
  return [run(id, '2026-04-01', { tempoBpm }), run(id, '2026-04-02', { tempoBpm })]
}

function goalOf(stages: string[][], targetTempoBpm = 100): Goal {
  return {
    id: 'goal-1',
    title: 'Play a blues',
    status: 'active',
    weight: 1,
    stages: stages.map((ids) => ({ items: ids.map((exerciseId) => ({ exerciseId, targetTempoBpm })) })),
  }
}

function stateOf(runs: readonly ExerciseRun[], catalog: readonly Exercise[], goal?: Goal): ReadonlyMap<string, ExerciseState> {
  return foldRuns(runs, catalog, undefined, resolveTargets(catalog, goal ? [goal] : []))
}

describe('pathProgress', () => {
  const catalog = ['a', 'b', 'c', 'd', 'e', 'f'].map((id) => exercise(id))

  it('opens the first stage and nothing else on a fresh account', () => {
    const goal = goalOf([['a', 'b', 'c'], ['d', 'e', 'f']])
    const progress = pathProgress(goal, stateOf([], catalog, goal))
    expect(progress.openStages).toEqual([0])
    expect(progress.solidity).toEqual([0, 0])
    expect(progress.nextStage).toBe(0)
  })

  it('opens the next stage when the one before it is solid enough, and not before', () => {
    const goal = goalOf([['a', 'b', 'c'], ['d', 'e', 'f']])
    // One of three solid is a third — below the two-thirds threshold.
    const oneOfThree = stateOf(solid('a'), catalog, goal)
    expect(pathProgress(goal, oneOfThree).openStages).toEqual([0])

    const twoOfThree = stateOf([...solid('a'), ...solid('b')], catalog, goal)
    expect(twoOfThree.get('a')?.band).toBe('fine')
    expect(pathProgress(goal, twoOfThree).solidity[0]).toBeCloseTo(2 / 3)
    expect(pathProgress(goal, twoOfThree).openStages).toEqual([0, 1])
  })

  it('needs exactly the threshold the constants name', () => {
    const goal = goalOf([['a', 'b', 'c'], ['d']])
    const solidCount = Math.ceil(PLAN_CONSTANTS.stageSolidThreshold * 3)
    const runs = ['a', 'b', 'c'].slice(0, solidCount).flatMap((id) => solid(id))
    expect(pathProgress(goal, stateOf(runs, catalog, goal)).openStages).toEqual([0, 1])
  })

  it('does not let a later stage open while an earlier one is short', () => {
    // Stage 2 fully solid, stage 1 barely touched: stage 3 still waits, because
    // a path is walked in order and not skipped into.
    const goal = goalOf([['a', 'b', 'c'], ['d'], ['e']])
    const progress = pathProgress(goal, stateOf(solid('d'), catalog, goal))
    expect(progress.openStages).toEqual([0])
  })

  it('judges solid against the path’s target, not the written tempo', () => {
    // Written at 100, wanted at 140: two clean days at 100 are not solid here.
    const goal = goalOf([['a'], ['b']], 140)
    const atWritten = stateOf(solid('a', 100), catalog, goal)
    expect(atWritten.get('a')?.band).not.toBe('fine')
    expect(pathProgress(goal, atWritten).openStages).toEqual([0])

    const atTarget = stateOf(solid('a', 140), catalog, goal)
    expect(pathProgress(goal, atTarget).openStages).toEqual([0, 1])
  })

  it('says which stage has something left to introduce', () => {
    const goal = goalOf([['a', 'b', 'c'], ['d', 'e', 'f']])
    const twoOfThree = stateOf([...solid('a'), ...solid('b')], catalog, goal)
    // Stage 1 still has `c` unplayed, so that is where the next new item comes from.
    expect(pathProgress(goal, twoOfThree).nextStage).toBe(0)

    const allOfStageOne = stateOf([...solid('a'), ...solid('b'), ...solid('c')], catalog, goal)
    expect(pathProgress(goal, allOfStageOne).nextStage).toBe(1)
  })
})

describe('a muted exercise in a path', () => {
  const catalog = ['a', 'b', 'c'].map((id) => exercise(id))

  it('does not hold a stage shut for ever', () => {
    // Two items, one muted: without excluding it the stage tops out at half,
    // below the two-thirds threshold, and the next stage never opens — the path
    // is stuck for good on something its owner has explicitly put down.
    const goal = goalOf([['a', 'b'], ['c']])
    const state = stateOf(solid('a'), catalog, goal)
    expect(pathProgress(goal, state).openStages).toEqual([0])
    expect(pathProgress(goal, state, PLAN_CONSTANTS, new Set(['b'])).openStages).toEqual([0, 1])
  })

  it('is never offered as a new item', () => {
    const goal = goalOf([['a', 'b']])
    const progress = pathsProgress([goal], stateOf([], catalog, goal), PLAN_CONSTANTS, new Set(['b']))
    expect([...eligibleNewIds(progress)]).toEqual(['a'])
  })

  it('is not what the path is waiting to have played', () => {
    const goal = goalOf([['a', 'b']])
    const state = stateOf(solid('a'), catalog, goal)
    // `b` is muted, so the stage has nothing left to introduce.
    expect(pathProgress(goal, state, PLAN_CONSTANTS, new Set(['b'])).nextStage).toBeNull()
  })
})

describe('eligibleNewIds', () => {
  const catalog = ['a', 'b', 'c', 'd'].map((id) => exercise(id))

  it('offers only what the open stages hold', () => {
    const goal = goalOf([['a', 'b'], ['c', 'd']])
    const eligible = eligibleNewIds(pathsProgress([goal], stateOf([], catalog, goal)))
    expect([...eligible].sort()).toEqual(['a', 'b'])
  })

  it('says nothing at all when no goal is active', () => {
    const paused: Goal = { ...goalOf([['a']]), status: 'paused' }
    expect(pathsProgress([paused], stateOf([], catalog))).toEqual([])
    expect(eligibleNewIds([])).toEqual(new Set())
  })
})
