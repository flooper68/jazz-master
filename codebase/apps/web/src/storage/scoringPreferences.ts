import { defineStore } from './store'
import type { ScoreTolerancePreset } from './sessions'

export const SCORE_TOLERANCE_PRESETS = ['lenient', 'standard', 'strict'] as const

export interface ScoringPreferences {
  tolerance: ScoreTolerancePreset
}

export const DEFAULT_SCORE_TOLERANCE: ScoreTolerancePreset = 'standard'

export const scoringPreferencesStore = defineStore<ScoringPreferences>({
  name: 'scoring-preferences',
  version: 1,
  defaultValue: () => ({ tolerance: DEFAULT_SCORE_TOLERANCE }),
})

export function isScoreTolerancePreset(
  value: unknown,
): value is ScoreTolerancePreset {
  return (
    typeof value === 'string' &&
    SCORE_TOLERANCE_PRESETS.includes(value as ScoreTolerancePreset)
  )
}

export function getScoreTolerance(): ScoreTolerancePreset {
  const preferences = scoringPreferencesStore.get()
  return isScoreTolerancePreset(preferences.tolerance)
    ? preferences.tolerance
    : DEFAULT_SCORE_TOLERANCE
}

export function saveScoreTolerance(tolerance: ScoreTolerancePreset): void {
  scoringPreferencesStore.update(() => ({ tolerance }))
}
