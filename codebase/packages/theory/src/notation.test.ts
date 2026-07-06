import { describe, expect, it } from 'vitest'
import { displayAccidentals } from './notation'

describe('displayAccidentals', () => {
  it('converts flats and sharps in note labels', () => {
    expect(displayAccidentals('Bb')).toBe('B♭')
    expect(displayAccidentals('F#')).toBe('F♯')
    expect(displayAccidentals('Bb7')).toBe('B♭7')
  })

  it('converts alterations inside chord qualities', () => {
    expect(displayAccidentals('m7b5')).toBe('m7♭5')
    expect(displayAccidentals('Bbm7b5')).toBe('B♭m7♭5')
  })

  it('leaves naturals untouched, including B itself', () => {
    expect(displayAccidentals('C')).toBe('C')
    expect(displayAccidentals('B')).toBe('B')
    expect(displayAccidentals('Bmaj7')).toBe('Bmaj7')
  })
})
