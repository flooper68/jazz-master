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
    expect(layout.systems).toHaveLength(1)
    const [system] = layout.systems
    expect(system.bars.map((bar) => bar.startBeat)).toEqual([0, 4, 8])
    expect(system.bars[0].x).toBe(40)
    const [a, b, c, d, e, f] = layout.noteX
    expect(b - a).toBe(50)
    expect(c - b).toBe(25)
    expect(d - c).toBe(25)
    // Crossing a bar line adds the gap and lead, on top of the two beats.
    expect(e - d).toBeGreaterThan(100)
    expect(f - e).toBeGreaterThan(200)
    expect(system.endX).toBeGreaterThan(f)
    expect(layout.width).toBeGreaterThan(system.endX)
    expect(system.noteIndices).toEqual([0, 1, 2, 3, 4, 5])
  })

  it('maps beats to points and back', () => {
    for (const beat of [0, 0.5, 3.99, 4, 7.25, 9.5, 10]) {
      const point = layout.xOfBeat(beat)
      expect(layout.beatOfPoint(point.x, point.system)).toBeCloseTo(beat)
    }
    expect(layout.xOfBeat(-3)).toEqual(layout.xOfBeat(0))
    expect(layout.xOfBeat(99)).toEqual(layout.xOfBeat(10))
    expect(layout.beatOfPoint(0, 0)).toBe(0)
    expect(layout.beatOfPoint(10_000, 0)).toBe(10)
    // Inside the gap after a bar line reads as the start of the next bar.
    expect(layout.beatOfPoint(layout.systems[0].bars[1].x + 2, 0)).toBe(4)
  })

  it('glides the cursor over the gap after a bar line', () => {
    // Beat 3 → 4 crosses from bar 1 into bar 2 on the same line.
    const atThree = layout.cursorXOfBeat(3)
    const atFour = layout.cursorXOfBeat(4)
    expect(atThree).toEqual(layout.xOfBeat(3))
    expect(atFour).toEqual(layout.xOfBeat(4))
    // Halfway through the last beat the cursor is halfway across, gap included.
    expect(layout.cursorXOfBeat(3.5).x).toBeCloseTo((atThree.x + atFour.x) / 2)
    expect(layout.cursorXOfBeat(3.5).x).toBeGreaterThan(layout.xOfBeat(3.5).x)
    // Earlier beats are untouched.
    expect(layout.cursorXOfBeat(1.25)).toEqual(layout.xOfBeat(1.25))
    // At a line break there is no gap to glide over; the cursor stays on its line.
    const wrapped = layoutScore(notes, { beatsPerBar: 4, leftInset: 40, beatWidth: 50, availableWidth: 640 })
    expect(wrapped.cursorXOfBeat(7.5)).toEqual(wrapped.xOfBeat(7.5))
    expect(wrapped.cursorXOfBeat(7.5).system).toBe(0)
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
    expect(tiny.systems[0].bars).toHaveLength(1)
    expect(tiny.xOfBeat(0.5).x).toBeGreaterThan(tiny.xOfBeat(0).x)
  })

  it('wraps whole bars into lines that fill the available width', () => {
    // Three bars, room for two per line: bars 1–2 then bar 3.
    const wrapped = layoutScore(notes, { beatsPerBar: 4, leftInset: 40, beatWidth: 50, availableWidth: 640 })
    expect(wrapped.systems).toHaveLength(2)
    expect(wrapped.systems[0].bars.map((bar) => bar.index)).toEqual([0, 1])
    expect(wrapped.systems[1].bars.map((bar) => bar.index)).toEqual([2])
    expect(wrapped.systems[0].noteIndices).toEqual([0, 1, 2, 3, 4])
    expect(wrapped.systems[1].noteIndices).toEqual([5])
    expect(wrapped.noteSystem).toEqual([0, 0, 0, 0, 0, 1])
    // Full lines are stretched to the width; the beat grew past its natural size.
    expect(wrapped.beatWidth).toBeGreaterThan(50)
    expect(wrapped.systems[0].endX).toBeCloseTo(640 - 24)
    expect(wrapped.systems[1].endX).toBeLessThan(wrapped.systems[0].endX)
    // A note on the second line starts back at the left.
    expect(wrapped.noteX[5]).toBeLessThan(wrapped.noteX[4])
    expect(wrapped.xOfBeat(8)).toEqual({ x: wrapped.noteX[5], system: 1 })
    expect(wrapped.beatOfPoint(wrapped.noteX[5], 1)).toBeCloseTo(8)
    expect(wrapped.beatOfPoint(wrapped.noteX[5] + 10_000, 1)).toBe(10)
  })

  it('never wraps below one bar per line, and keeps a short single line natural', () => {
    const narrow = layoutScore(notes, { beatsPerBar: 4, availableWidth: 120 })
    expect(narrow.systems).toHaveLength(3)
    expect(narrow.systems.every((system) => system.bars.length === 1)).toBe(true)
    const roomy = layoutScore(notes, { beatsPerBar: 4, beatWidth: 50, availableWidth: 5_000 })
    expect(roomy.systems).toHaveLength(1)
    expect(roomy.beatWidth).toBe(50)
  })
})
