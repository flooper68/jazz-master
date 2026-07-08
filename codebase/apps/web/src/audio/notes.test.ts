import { describe, expect, it } from 'vitest'
import { fluidSampleName, midiForPosition } from './notes'

describe('play-along note mapping', () => {
  it('maps guitar string/fret positions to sounding MIDI notes', () => {
    expect(midiForPosition({ string: 6, fret: 0 })).toBe(40)
    expect(midiForPosition({ string: 5, fret: 3 })).toBe(48)
    expect(midiForPosition({ string: 1, fret: 8 })).toBe(72)
  })

  it('formats FluidR3 sample names with flats', () => {
    expect(fluidSampleName(40)).toBe('E2')
    expect(fluidSampleName(46)).toBe('Bb2')
    expect(fluidSampleName(61)).toBe('Db4')
  })
})
