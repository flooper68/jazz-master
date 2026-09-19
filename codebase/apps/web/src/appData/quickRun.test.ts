import { describe, expect, it } from 'vitest'
import { EXERCISES as PACK } from '../content'
import {
  defaultQuickRunSettings,
  loadQuickRunSettings,
  parseSessionSearch,
  sessionSearch,
} from './quickRun'

/** The five founding exercises: a pack small enough for a test to count — three scales, an arpeggio, a line. */
const FOUNDING_IDS = ['scales-major-open-c', 'scales-major-open-g', 'scales-major-open-f', 'lines-ii-v-i-f-arpeggios', 'lines-ii-v-i-f-line']
const EXERCISES = PACK.filter((exercise) => FOUNDING_IDS.includes(exercise.id))

describe('what to play next', () => {
  it('falls back to the defaults for missing or broken storage', () => {
    expect(loadQuickRunSettings(null)).toEqual(defaultQuickRunSettings())
    expect(loadQuickRunSettings({ getItem: () => '{nope' })).toEqual(defaultQuickRunSettings())
    // A length no button offers — an old save, a hand-edited one — is not planned to.
    expect(loadQuickRunSettings({ getItem: () => JSON.stringify({ sessionMinutes: 37 }) })).toEqual(
      defaultQuickRunSettings(),
    )
  })

  it('remembers how long the session should be', () => {
    expect(loadQuickRunSettings({ getItem: () => JSON.stringify({ sessionMinutes: 60 }) })).toEqual({
      sessionMinutes: 60,
    })
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
      plannedSeconds: 0,
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
