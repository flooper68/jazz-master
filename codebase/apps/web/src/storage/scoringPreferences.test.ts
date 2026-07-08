import { beforeEach, describe, expect, it } from 'vitest'
import {
  DEFAULT_SCORE_TOLERANCE,
  getScoreTolerance,
  saveScoreTolerance,
  scoringPreferencesStore,
} from './scoringPreferences'

beforeEach(() => {
  localStorage.clear()
})

describe('scoringPreferencesStore', () => {
  it('defaults to standard tolerance', () => {
    expect(getScoreTolerance()).toBe(DEFAULT_SCORE_TOLERANCE)
  })

  it('saves and reads the selected tolerance', () => {
    saveScoreTolerance('lenient')

    expect(getScoreTolerance()).toBe('lenient')
  })

  it('falls back to standard for malformed stored data', () => {
    scoringPreferencesStore.set({ tolerance: 'punitive' as never })

    expect(getScoreTolerance()).toBe(DEFAULT_SCORE_TOLERANCE)
  })
})
