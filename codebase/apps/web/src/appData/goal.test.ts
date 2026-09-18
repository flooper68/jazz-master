import { describe, expect, it } from 'vitest'
import { activeGoals, goalExerciseIds, parseGoalInput, type Goal } from './goal'

/** A path from an untrusted source, held to what the scheduler can actually run. */

const known = new Set(['a', 'b', 'c'])

const path = {
  title: 'Play a blues in F',
  stages: [{ items: [{ exerciseId: 'a', targetTempoBpm: 120 }] }],
}

describe('parseGoalInput', () => {
  it('takes a path whose exercises all exist, and fills in the defaults', () => {
    const parsed = parseGoalInput(path, known)
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    expect(parsed.goal.status).toBe('active')
    expect(parsed.goal.weight).toBe(1)
  })

  it('says which item names an exercise that does not exist', () => {
    const parsed = parseGoalInput(
      { ...path, stages: [{ items: [{ exerciseId: 'nope', targetTempoBpm: 120 }] }] },
      known,
    )
    expect(parsed.ok).toBe(false)
    if (parsed.ok) return
    expect(parsed.problems[0]).toContain('stages.0.items.0.exerciseId')
    expect(parsed.problems[0]).toContain('nope')
  })

  it('refuses the same exercise twice in one path, wherever the repeat is', () => {
    // The fold keeps one state per exercise, so two stages asking for the same
    // one is two schedules for a thing that can only have one.
    const twice = {
      ...path,
      stages: [
        { items: [{ exerciseId: 'a', targetTempoBpm: 100 }] },
        { items: [{ exerciseId: 'a', targetTempoBpm: 140 }] },
      ],
    }
    const parsed = parseGoalInput(twice, known)
    expect(parsed.ok).toBe(false)
    if (parsed.ok) return
    expect(parsed.problems[0]).toContain('already in this path')
  })

  it('refuses a path with no stages, a stage with no items, and a title of nothing', () => {
    expect(parseGoalInput({ ...path, stages: [] }, known).ok).toBe(false)
    expect(parseGoalInput({ ...path, stages: [{ items: [] }] }, known).ok).toBe(false)
    expect(parseGoalInput({ ...path, title: '   ' }, known).ok).toBe(false)
  })

  it('refuses a target tempo no player could hold', () => {
    expect(parseGoalInput({ ...path, stages: [{ items: [{ exerciseId: 'a', targetTempoBpm: 0 }] }] }, known).ok).toBe(false)
    expect(parseGoalInput({ ...path, stages: [{ items: [{ exerciseId: 'a', targetTempoBpm: 9000 }] }] }, known).ok).toBe(false)
  })

  it('refuses anything that is not a goal at all', () => {
    for (const nonsense of [null, 'a goal', 42, [], { title: 'No stages' }]) {
      expect(parseGoalInput(nonsense, known).ok).toBe(false)
    }
  })
})

describe('reading a goal', () => {
  const goal = (id: string, status: Goal['status']): Goal => ({
    id,
    title: id,
    status,
    weight: 1,
    stages: [{ items: [{ exerciseId: 'a', targetTempoBpm: 100 }, { exerciseId: 'b', targetTempoBpm: 110 }] }],
  })

  it('takes only the goals that are being worked on', () => {
    const goals = [goal('g1', 'active'), goal('g2', 'paused'), goal('g3', 'done')]
    expect(activeGoals(goals).map((item) => item.id)).toEqual(['g1'])
  })

  it('lists every exercise a path names, stage by stage', () => {
    expect(goalExerciseIds(goal('g1', 'active'))).toEqual(['a', 'b'])
  })
})
