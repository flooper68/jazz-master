import { describe, expect, it } from 'vitest'
import type { Exercise } from '../content'
import { firstPicks } from './firstPicks'

function exercise(id: string, area: Exercise['area'], level: number): Exercise {
  return { id, title: id, area, level, tempoBpm: 60, duration: { kind: 'repetitions', count: 1 }, notes: [{ string: 1, fret: 0, beats: 4 }] }
}

describe('firstPicks', () => {
  it('offers the easiest first, one from each area in turn, keeping list order within an area', () => {
    const picks = firstPicks([
      exercise('spider-1', 'technique', 1),
      exercise('spider-2', 'technique', 1),
      exercise('hard-drill', 'technique', 3),
      exercise('c-major', 'scales', 1),
      exercise('dorian', 'scales', 2),
      exercise('hook', 'lines', 1),
    ])
    expect(picks.map((pick) => pick.id)).toEqual(['spider-1', 'c-major', 'hook', 'spider-2', 'dorian', 'hard-drill'])
  })

  it('is empty for nothing', () => {
    expect(firstPicks([])).toEqual([])
  })
})
