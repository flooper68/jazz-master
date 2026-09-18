import { describe, expect, it } from 'vitest'
import { isChord, midisOf, stringsOf } from './stack'
import type { TabNote } from './types'

describe('stringsOf and midisOf', () => {
  it('reads a note as its one string and a chord as its bass and the strings above, in that order', () => {
    expect(stringsOf({ string: 3, fret: 5, beats: 1 })).toEqual([{ string: 3, fret: 5 }])
    const openC: TabNote = { string: 5, fret: 3, beats: 1, above: [{ string: 4, fret: 2 }, { string: 3, fret: 0 }, { string: 2, fret: 1 }, { string: 1, fret: 0 }] }
    expect(stringsOf(openC).map((position) => `${position.string}/${position.fret}`)).toEqual(['5/3', '4/2', '3/0', '2/1', '1/0'])
    // C3 E3 G3 C4 E4
    expect(midisOf(openC)).toEqual([48, 52, 55, 60, 64])
    expect(isChord(openC)).toBe(true)
    expect(isChord({ string: 3, fret: 5, beats: 1 })).toBe(false)
    expect(isChord({ string: 3, fret: 5, beats: 1, above: [] })).toBe(false)
  })
})
