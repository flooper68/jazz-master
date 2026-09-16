import { describe, expect, it } from 'vitest'
import type { TabNote } from '../content'
import { layoutScore } from './layout'

const notes: TabNote[] = [
  { string: 5, fret: 3, beats: 1 },
  { string: 4, fret: 0, beats: 0.5 },
  { string: 4, fret: 2, beats: 0.5 },
  { string: 4, fret: 3, beats: 2 },
  { string: 3, fret: 0, beats: 4 },
  { string: 3, fret: 2, beats: 2 },
]

describe('layoutScore', () => {
  const layout = layoutScore(notes, { beatsPerBar: 4, leftInset: 40, beatWidth: 50 })

  it('lays notes out in proportion to their length, with room after each bar line', () => {
    expect(layout.totalBeats).toBe(10)
    expect(layout.bars.map((bar) => bar.startBeat)).toEqual([0, 4, 8])
    expect(layout.bars[0].x).toBe(40)
    const [a, b, c, d, e, f] = layout.noteX
    expect(b - a).toBe(50)
    expect(c - b).toBe(25)
    expect(d - c).toBe(25)
    // Crossing a bar line adds the gap and lead, on top of the two beats.
    expect(e - d).toBeGreaterThan(100)
    expect(f - e).toBeGreaterThan(200)
    expect(layout.endX).toBeGreaterThan(f)
    expect(layout.width).toBeGreaterThan(layout.endX)
  })

  it('maps beats to x and back', () => {
    for (const beat of [0, 0.5, 3.99, 4, 7.25, 9.5, 10]) {
      expect(layout.beatOfX(layout.xOfBeat(beat))).toBeCloseTo(beat)
    }
    expect(layout.xOfBeat(-3)).toBe(layout.xOfBeat(0))
    expect(layout.xOfBeat(99)).toBe(layout.xOfBeat(10))
    expect(layout.beatOfX(0)).toBe(0)
    expect(layout.beatOfX(10_000)).toBe(10)
    // Inside the gap after a bar line reads as the start of the next bar.
    expect(layout.beatOfX(layout.bars[1].x + 2)).toBe(4)
  })

  it('finds the sounding note for a beat', () => {
    expect(layout.noteIndexAtBeat(0)).toBe(0)
    expect(layout.noteIndexAtBeat(1.2)).toBe(1)
    expect(layout.noteIndexAtBeat(1.5)).toBe(2)
    expect(layout.noteIndexAtBeat(9.99)).toBe(5)
    expect(layout.noteIndexAtBeat(-1)).toBeNull()
  })

  it('always has at least one bar', () => {
    const tiny = layoutScore([{ string: 1, fret: 0, beats: 0.5 }], { beatsPerBar: 4 })
    expect(tiny.bars).toHaveLength(1)
    expect(tiny.xOfBeat(0.5)).toBeGreaterThan(tiny.xOfBeat(0))
  })
})
