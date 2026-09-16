import { describe, expect, it } from 'vitest'
import { beatsElapsed, noteStarts, passBeats, playheadAt } from './timeline'
import type { TabNote } from './types'

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

  it('finds the sounding note and the pass count while looping', () => {
    expect(playheadAt(tab, 0)).toEqual({ noteIndex: 0, pass: 0 })
    expect(playheadAt(tab, 0.49)).toEqual({ noteIndex: 0, pass: 0 })
    expect(playheadAt(tab, 0.5)).toEqual({ noteIndex: 1, pass: 0 })
    expect(playheadAt(tab, 1.9)).toEqual({ noteIndex: 2, pass: 0 })
    expect(playheadAt(tab, 2)).toEqual({ noteIndex: 0, pass: 1 })
    expect(playheadAt(tab, 5.25)).toEqual({ noteIndex: 2, pass: 2 })
  })

  it('never goes negative and refuses an empty tab', () => {
    expect(playheadAt(tab, -3)).toEqual({ noteIndex: 0, pass: 0 })
    expect(playheadAt([], 1)).toBeNull()
  })

  it('converts seconds at a tempo into beats', () => {
    expect(beatsElapsed(1, 60)).toBe(1)
    expect(beatsElapsed(1.5, 120)).toBe(3)
  })
})
