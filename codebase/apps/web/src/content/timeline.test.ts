import { describe, expect, it } from 'vitest'
import { noteIndexAt, noteStarts, passBeats } from './timeline'
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

  it('finds the note sounding at a beat without looping', () => {
    expect(noteIndexAt(tab, 0)).toBe(0)
    expect(noteIndexAt(tab, 0.75)).toBe(1)
    expect(noteIndexAt(tab, 1.5)).toBe(2)
    expect(noteIndexAt(tab, 7)).toBe(2)
    expect(noteIndexAt(tab, -0.1)).toBeNull()
  })
})
