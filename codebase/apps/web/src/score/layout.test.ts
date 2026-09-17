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

  it('lays notes out at one width per beat, bar lines a lead ahead of each downbeat', () => {
    expect(layout.totalBeats).toBe(10)
    expect(layout.systems).toHaveLength(1)
    const [system] = layout.systems
    expect(system.bars.map((bar) => bar.startBeat)).toEqual([0, 4, 8])
    expect(system.bars[0].x).toBe(40)
    const [a, b, c, d, e, f] = layout.noteX
    expect(b - a).toBe(50)
    expect(c - b).toBe(25)
    expect(d - c).toBe(25)
    // Crossing a bar line costs nothing extra: two beats are two beats.
    expect(e - d).toBe(100)
    expect(f - e).toBe(200)
    // Every bar line sits the same distance before its downbeat.
    expect(layout.xOfBeat(4).x - system.bars[1].x).toBe(layout.xOfBeat(0).x - system.bars[0].x)
    expect(system.endX).toBeGreaterThan(f)
    expect(layout.width).toBeGreaterThan(system.endX)
    expect(system.noteIndices).toEqual([0, 1, 2, 3, 4, 5])
  })

  it('keeps x linear in the beat along a line', () => {
    for (let beat = 0; beat <= 10; beat += 0.25) {
      expect(layout.xOfBeat(beat).x).toBeCloseTo(layout.xOfBeat(0).x + beat * 50)
    }
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
    const wrapped = layoutScore(notes, { beatsPerBar: 4, leftInset: 40, beatWidth: 50, availableWidth: 560 })
    expect(wrapped.systems).toHaveLength(2)
    expect(wrapped.systems[0].bars.map((bar) => bar.index)).toEqual([0, 1])
    expect(wrapped.systems[1].bars.map((bar) => bar.index)).toEqual([2])
    expect(wrapped.systems[0].noteIndices).toEqual([0, 1, 2, 3, 4])
    expect(wrapped.systems[1].noteIndices).toEqual([5])
    expect(wrapped.noteSystem).toEqual([0, 0, 0, 0, 0, 1])
    // Full lines are stretched to the width; the beat grew past its natural size.
    expect(wrapped.beatWidth).toBeGreaterThan(50)
    // The line fills the width, leaving the right pad and a lead after the closing bar line.
    expect(wrapped.systems[0].endX).toBeCloseTo(560 - 24 - 14)
    expect(wrapped.systems[1].endX).toBeLessThan(wrapped.systems[0].endX)
    // A note on the second line starts back at the left.
    expect(wrapped.noteX[5]).toBeLessThan(wrapped.noteX[4])
    expect(wrapped.xOfBeat(8)).toEqual({ x: wrapped.noteX[5], system: 1 })
    expect(wrapped.beatOfPoint(wrapped.noteX[5], 1)).toBeCloseTo(8)
    expect(wrapped.beatOfPoint(wrapped.noteX[5] + 10_000, 1)).toBe(10)
    // Linear on every line.
    expect(wrapped.xOfBeat(6).x - wrapped.xOfBeat(2).x).toBeCloseTo(4 * wrapped.beatWidth)
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
