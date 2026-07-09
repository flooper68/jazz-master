import { describe, expect, it } from 'vitest'
import { defaultProfile } from './profile'

describe('defaultProfile', () => {
  it('documents the skip defaults: beginner everywhere, lesson-pack goals, 20 min', () => {
    expect(defaultProfile('2026-07-06T10:00:00.000Z')).toEqual({
      levels: { scales: 1, arpeggios: 1, chords: 1, standards: 1, ears: 1 },
      goalAreas: ['scales', 'arpeggios'],
      minutesPerDay: 20,
      createdAt: '2026-07-06T10:00:00.000Z',
    })
  })

  it('returns a fresh object per call so callers never share state', () => {
    const first = defaultProfile('')
    const second = defaultProfile('')
    expect(first).not.toBe(second)
    expect(first.levels).not.toBe(second.levels)
    expect(first.goalAreas).not.toBe(second.goalAreas)
  })
})
