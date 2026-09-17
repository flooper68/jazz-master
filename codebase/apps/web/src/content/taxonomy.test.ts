import { describe, expect, it } from 'vitest'
import { EXERCISE_STYLES, STYLE_FAMILIES, styleFamily, styleMatches, stylesWithin } from './taxonomy'

describe('styles', () => {
  it('puts every child under a family that is itself a style', () => {
    for (const style of EXERCISE_STYLES) {
      expect(EXERCISE_STYLES).toContain(styleFamily(style))
      expect(STYLE_FAMILIES).toContain(styleFamily(style))
    }
  })

  it('lists the children of a family, and none for a family without any', () => {
    expect(stylesWithin('country')).toEqual(['country/bluegrass'])
    expect(stylesWithin('jazz')).toContain('jazz/bebop')
    expect(stylesWithin('blues')).toEqual([])
  })

  it('finds a child when its family is asked for, but not the other way round', () => {
    expect(styleMatches('jazz/bebop', 'jazz')).toBe(true)
    expect(styleMatches('jazz/bebop', 'jazz/bebop')).toBe(true)
    expect(styleMatches('jazz', 'jazz/bebop')).toBe(false)
    // `jazz/blues` is jazz, not blues.
    expect(styleMatches('jazz/blues', 'blues')).toBe(false)
  })
})
