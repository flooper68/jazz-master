import { describe, expect, it } from 'vitest'
import type { ExercisePriority, Goal } from '../appData/goal'
import type { Exercise } from '../content'
import { nextSessionAnswer } from './descriptors'

/**
 * The answers both doors are built from, tested where they live. The slot's
 * target used to be the tempo the exercise is written at, whatever the user's
 * path asked of it (JM-11) — a pure mapping, so it is pinned here rather than
 * through either door's plumbing.
 */

function exercise(id: string, tempoBpm: number): Exercise {
  return { id, title: id, area: 'technique', level: 1, tempoBpm, duration: { kind: 'repetitions', count: 4 }, notes: [] }
}

function goal(stages: Goal['stages']): Goal {
  return { id: 'goal-1', title: 'A goal', status: 'active', weight: 1, stages }
}

const catalog = [exercise('written-at-80', 80), exercise('untouched', 90)]

describe('the next session, as either door answers it', () => {
  it('reports the tempo the path asks for, not the one the exercise is written at', () => {
    const answer = nextSessionAnswer(
      [],
      catalog,
      [goal([{ items: [{ exerciseId: 'written-at-80', targetTempoBpm: 140 }] }])],
      [],
    )
    const slot = answer.slots.find((candidate) => candidate.exerciseId === 'written-at-80')
    expect(slot?.targetTempoBpm).toBe(140)
  })

  it('leaves an exercise no path names judged at its own tempo', () => {
    const answer = nextSessionAnswer([], catalog, [], [])
    const slot = answer.slots.find((candidate) => candidate.exerciseId === 'untouched')
    expect(slot?.targetTempoBpm).toBe(90)
  })

  it('lets what the user said about one exercise beat what the path asks', () => {
    const override: ExercisePriority = { exerciseId: 'written-at-80', priority: 'boosted', targetOverrideBpm: 60 }
    const answer = nextSessionAnswer(
      [],
      catalog,
      [goal([{ items: [{ exerciseId: 'written-at-80', targetTempoBpm: 140 }] }])],
      [override],
    )
    const slot = answer.slots.find((candidate) => candidate.exerciseId === 'written-at-80')
    expect(slot?.targetTempoBpm).toBe(60)
  })
})
