import { describe, expect, it } from 'vitest'
import { formatBarBeat, formatSeconds } from './formatting'

describe('formatting', () => {
  it('formats seconds as m:ss, rounding up so 0 means done', () => {
    expect(formatSeconds(120)).toBe('2:00')
    expect(formatSeconds(59.2)).toBe('1:00')
    expect(formatSeconds(5)).toBe('0:05')
    expect(formatSeconds(-1)).toBe('0:00')
  })

  it('formats a beat position as bar.beat', () => {
    expect(formatBarBeat(0, 4)).toBe('1.1')
    expect(formatBarBeat(3.5, 4)).toBe('1.4')
    expect(formatBarBeat(4, 4)).toBe('2.1')
    expect(formatBarBeat(7.9999, 4)).toBe('2.4')
    expect(formatBarBeat(7.9999999999, 4)).toBe('3.1')
    expect(formatBarBeat(2, 3)).toBe('1.3')
  })
})
