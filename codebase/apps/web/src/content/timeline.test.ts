import { describe, expect, it } from 'vitest'
import { exerciseSeconds, noteIndexAt, noteStarts, passBeats } from './timeline'
import type { Exercise, TabNote } from './types'

const tab: TabNote[] = [
  { string: 5, fret: 3, beats: 0.5 },
  { string: 5, fret: 5, beats: 0.5 },
  { string: 4, fret: 2, beats: 1 },
]

describe('timeline', () => {
  it('lays notes out by their beat lengths', () => {
    expect(noteStarts(tab)).toEqual([0, 0.5, 1])
    expect(passBeats(tab)).toBe(2)
  })

  it('finds the note sounding at a beat without looping', () => {
    expect(noteIndexAt(tab, 0)).toBe(0)
    expect(noteIndexAt(tab, 0.75)).toBe(1)
    expect(noteIndexAt(tab, 1.5)).toBe(2)
    expect(noteIndexAt(tab, 7)).toBe(2)
    expect(noteIndexAt(tab, -0.1)).toBeNull()
  })

  it('reads how long an exercise asks for: the clock, or its passes at tempo', () => {
    const base: Exercise = {
      id: 'ex', title: 'Ex', area: 'scales', level: 1, tempoBpm: 60,
      duration: { kind: 'minutes', minutes: 2 }, notes: tab,
    }
    expect(exerciseSeconds(base)).toBe(120)
    // Four passes of two beats at 60 BPM: eight seconds.
    expect(exerciseSeconds({ ...base, duration: { kind: 'repetitions', count: 4 } })).toBe(8)
  })
})
