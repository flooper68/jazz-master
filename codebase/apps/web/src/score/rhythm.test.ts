import { describe, expect, it } from 'vitest'
import { beamGroups, noteGlyph } from './rhythm'

describe('noteGlyph', () => {
  it('knows the standard values and their dotted forms', () => {
    expect(noteGlyph(4)).toEqual({ head: 'whole', stem: false, flags: 0, dot: false })
    expect(noteGlyph(2)).toMatchObject({ head: 'half', stem: true, flags: 0 })
    expect(noteGlyph(3)).toMatchObject({ head: 'half', dot: true })
    expect(noteGlyph(1)).toMatchObject({ head: 'black', flags: 0, dot: false })
    expect(noteGlyph(1.5)).toMatchObject({ head: 'black', flags: 0, dot: true })
    expect(noteGlyph(0.5)).toMatchObject({ flags: 1, dot: false })
    expect(noteGlyph(0.75)).toMatchObject({ flags: 1, dot: true })
    expect(noteGlyph(0.25)).toMatchObject({ flags: 2 })
  })

  it('falls back to the nearest shorter value for odd lengths', () => {
    expect(noteGlyph(1.2)).toMatchObject({ head: 'black', flags: 0, dot: false })
    expect(noteGlyph(0.6)).toMatchObject({ flags: 1, dot: false })
    expect(noteGlyph(0.1)).toMatchObject({ flags: 2 })
  })
})

describe('beamGroups', () => {
  it('beams adjacent eighths within a half bar of 4/4 and leaves the rest', () => {
    //      |e e e e | q e e | e q e |
    const beats = [0.5, 0.5, 0.5, 0.5, 1, 0.5, 0.5, 0.5, 1, 0.5]
    const starts = [0, 0.5, 1, 1.5, 2, 3, 3.5, 4, 4.5, 5.5]
    expect(beamGroups(beats, starts, 4)).toEqual([[0, 1, 2, 3], [5, 6]])
  })

  it('splits groups at the half-bar and beams sixteenths with eighths', () => {
    const beats = [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.25, 0.25]
    const starts = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.25]
    expect(beamGroups(beats, starts, 4)).toEqual([[0, 1, 2, 3], [4, 5, 6, 7]])
  })

  it('beams per beat in odd meters', () => {
    const beats = [0.5, 0.5, 0.5, 0.5, 0.5, 0.5]
    const starts = [0, 0.5, 1, 1.5, 2, 2.5]
    expect(beamGroups(beats, starts, 3)).toEqual([[0, 1], [2, 3], [4, 5]])
  })
})
