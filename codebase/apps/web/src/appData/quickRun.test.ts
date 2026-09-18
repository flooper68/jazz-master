import { describe, expect, it } from 'vitest'
import { EXERCISES as PACK } from '../content'
import {
  chosenRoutine,
  defaultQuickRunSettings,
  loadQuickRunSettings,
  parseSessionSearch,
  routinePlan,
  sessionSearch,
} from './quickRun'

/** The five founding exercises: a pack small enough for a test to count — three scales, an arpeggio, a line. */
const FOUNDING_IDS = ['scales-major-open-c', 'scales-major-open-g', 'scales-major-open-f', 'lines-ii-v-i-f-arpeggios', 'lines-ii-v-i-f-line']
const EXERCISES = PACK.filter((exercise) => FOUNDING_IDS.includes(exercise.id))

const routine = {
  id: 'r-1',
  name: 'Warm-up',
  items: [{ exerciseId: 'lines-ii-v-i-f-line' }, { exerciseId: 'gone-since' }, { exerciseId: 'scales-major-open-c' }],
}

describe('what to play next', () => {
  it('falls back to the defaults for missing or broken storage', () => {
    expect(loadQuickRunSettings(null)).toEqual(defaultQuickRunSettings())
    expect(loadQuickRunSettings({ getItem: () => '{nope' })).toEqual(defaultQuickRunSettings())
    expect(loadQuickRunSettings({ getItem: () => JSON.stringify({ routineId: '' }) })).toEqual({ routineId: null })
  })

  it('remembers a routine named as next', () => {
    expect(loadQuickRunSettings({ getItem: () => JSON.stringify({ routineId: 'r-1' }) })).toEqual({ routineId: 'r-1' })
  })

  it('stands the routine down when it is gone, or has nothing left to play', () => {
    const emptied = { id: 'r-2', name: 'Emptied', items: [{ exerciseId: 'gone-since' }] }
    expect(chosenRoutine({ routineId: 'r-1' }, [routine], EXERCISES)).toBe(routine)
    expect(chosenRoutine({ routineId: null }, [routine], EXERCISES)).toBeNull()
    expect(chosenRoutine({ routineId: 'deleted' }, [routine], EXERCISES)).toBeNull()
    expect(chosenRoutine({ routineId: 'r-2' }, [emptied], EXERCISES)).toBeNull()
  })
})

describe('routinePlan', () => {
  it('plays it as prepared — its order, skipping what is gone, each at its written tempo', () => {
    const plan = routinePlan(routine, EXERCISES)
    expect(plan.routine).toBe(routine)
    expect(plan.slots.map((slot) => slot.exercise.id)).toEqual(['lines-ii-v-i-f-line', 'scales-major-open-c'])
    for (const slot of plan.slots) expect(slot.tempoBpm).toBe(slot.exercise.tempoBpm)
    expect(sessionSearch(plan)).toEqual({ x: 'lines-ii-v-i-f-line,scales-major-open-c', r: 'r-1' })
  })
})

describe('the session URL', () => {
  const [first, second] = EXERCISES

  it('names a tempo only when the plan asked for one other than the written tempo', () => {
    const plan = {
      slots: [
        { exercise: first, tempoBpm: first.tempoBpm, reason: 'Due today' },
        { exercise: second, tempoBpm: second.tempoBpm - 10, reason: 'Overdue 2 days' },
      ],
      routine: null,
    }
    expect(sessionSearch(plan)).toEqual({ x: `${first.id},${second.id}@${second.tempoBpm - 10}` })
  })

  it('reads back what it wrote', () => {
    expect(parseSessionSearch(`${first.id},${second.id}@95`)).toEqual([
      { exerciseId: first.id, tempoBpm: null },
      { exerciseId: second.id, tempoBpm: 95 },
    ])
  })

  it('drops repeats, blanks, and anything that is not a tempo a player could hold', () => {
    // Nobody but the app writes this URL, but anybody can.
    expect(parseSessionSearch('a,a@90,,b@0,c@nope,d@-5,e@100000,f@1@2')).toEqual([
      { exerciseId: 'a', tempoBpm: null },
      { exerciseId: 'b', tempoBpm: null },
      { exerciseId: 'c', tempoBpm: null },
      { exerciseId: 'd', tempoBpm: null },
      { exerciseId: 'e', tempoBpm: null },
      { exerciseId: 'f', tempoBpm: null },
    ])
    expect(parseSessionSearch(undefined)).toEqual([])
  })
})
