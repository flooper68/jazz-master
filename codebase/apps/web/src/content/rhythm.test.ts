import { parseNote, type PositionedNote } from '@jazz-master/theory'
import { describe, expect, it } from 'vitest'
import { deriveRhythm } from './rhythm'

function fakePositions(count: number): PositionedNote[] {
  return Array.from({ length: count }, (_, i) => ({
    string: 6,
    fret: i,
    note: parseNote('C')!,
    degree: i + 1,
  }))
}

describe('deriveRhythm', () => {
  it('returns no measures for no positions', () => {
    expect(deriveRhythm([])).toEqual([])
  })

  it('makes every note a straight eighth', () => {
    const measures = deriveRhythm(fakePositions(5))
    expect(
      measures.flatMap((m) => m.notes).every((n) => n.duration === '8'),
    ).toBe(true)
  })

  it('keeps positions in order and intact', () => {
    const positions = fakePositions(10)
    const notes = deriveRhythm(positions).flatMap((m) => m.notes)
    expect(notes.map((n) => n.position)).toEqual(positions)
  })

  it('fits eight eighths per bar, last bar short', () => {
    expect(deriveRhythm(fakePositions(15)).map((m) => m.notes.length)).toEqual([
      8, 7,
    ])
    expect(deriveRhythm(fakePositions(8)).map((m) => m.notes.length)).toEqual([
      8,
    ])
    expect(deriveRhythm(fakePositions(17)).map((m) => m.notes.length)).toEqual([
      8, 8, 1,
    ])
  })

  it('beams in fours, trailing group only from two notes up', () => {
    const [full] = deriveRhythm(fakePositions(8))
    expect(full.beams).toEqual([
      [0, 1, 2, 3],
      [4, 5, 6, 7],
    ])
    const [seven] = deriveRhythm(fakePositions(7))
    expect(seven.beams).toEqual([
      [0, 1, 2, 3],
      [4, 5, 6],
    ])
    const [, single] = deriveRhythm(fakePositions(9))
    expect(single.beams).toEqual([])
    const [five] = deriveRhythm(fakePositions(5))
    expect(five.beams).toEqual([[0, 1, 2, 3]])
  })
})
