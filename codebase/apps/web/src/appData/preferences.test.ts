import { describe, expect, it } from 'vitest'
import {
  clampPlayAlongTempo,
  defaultPracticePreferences,
  getPlayAlongTempo,
  isNotationDisplayMode,
  isScoreTolerancePreset,
} from './preferences'

describe('practice preferences', () => {
  it('starts with the current product defaults', () => {
    expect(defaultPracticePreferences()).toEqual({
      notationDisplayMode: 'both',
      scoringTolerance: 'standard',
      playAlongTempos: {},
    })
  })

  it('uses the authored tempo until an override exists', () => {
    const preferences = defaultPracticePreferences()

    expect(getPlayAlongTempo(preferences, 'exercise-1', 88)).toBe(88)

    preferences.playAlongTempos['exercise-1'] = 72
    expect(getPlayAlongTempo(preferences, 'exercise-1', 88)).toBe(72)
  })

  it('rounds and clamps saved and authored tempos', () => {
    expect(clampPlayAlongTempo(39.4)).toBe(40)
    expect(clampPlayAlongTempo(72.6)).toBe(73)
    expect(clampPlayAlongTempo(201)).toBe(200)
    expect(clampPlayAlongTempo(Number.NaN, 84)).toBe(84)
  })

  it('recognizes only supported preference values', () => {
    expect(isNotationDisplayMode('staff')).toBe(true)
    expect(isNotationDisplayMode('score')).toBe(false)
    expect(isScoreTolerancePreset('strict')).toBe(true)
    expect(isScoreTolerancePreset('punitive')).toBe(false)
  })
})
