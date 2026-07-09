import type { ScoreTolerancePreset } from './session'

export const NOTATION_DISPLAY_MODES = ['both', 'staff', 'tab'] as const
export type NotationDisplayMode = (typeof NOTATION_DISPLAY_MODES)[number]

export const SCORE_TOLERANCE_PRESETS = [
  'lenient',
  'standard',
  'strict',
] as const satisfies readonly ScoreTolerancePreset[]

export const DEFAULT_NOTATION_DISPLAY_MODE: NotationDisplayMode = 'both'
export const DEFAULT_SCORE_TOLERANCE: ScoreTolerancePreset = 'standard'
export const MIN_PLAY_ALONG_TEMPO_BPM = 40
export const MAX_PLAY_ALONG_TEMPO_BPM = 200

export interface PracticePreferences {
  notationDisplayMode: NotationDisplayMode
  scoringTolerance: ScoreTolerancePreset
  playAlongTempos: Record<string, number>
}

export function defaultPracticePreferences(): PracticePreferences {
  return {
    notationDisplayMode: DEFAULT_NOTATION_DISPLAY_MODE,
    scoringTolerance: DEFAULT_SCORE_TOLERANCE,
    playAlongTempos: {},
  }
}

export function isNotationDisplayMode(
  value: unknown,
): value is NotationDisplayMode {
  return (
    typeof value === 'string' &&
    NOTATION_DISPLAY_MODES.includes(value as NotationDisplayMode)
  )
}

export function isScoreTolerancePreset(
  value: unknown,
): value is ScoreTolerancePreset {
  return (
    typeof value === 'string' &&
    SCORE_TOLERANCE_PRESETS.includes(value as ScoreTolerancePreset)
  )
}

export function clampPlayAlongTempo(
  tempoBpm: number,
  authoredTempoBpm = MAX_PLAY_ALONG_TEMPO_BPM,
): number {
  const fallback = Number.isFinite(authoredTempoBpm)
    ? authoredTempoBpm
    : MAX_PLAY_ALONG_TEMPO_BPM
  const candidate = Number.isFinite(tempoBpm) ? tempoBpm : fallback

  return Math.min(
    MAX_PLAY_ALONG_TEMPO_BPM,
    Math.max(MIN_PLAY_ALONG_TEMPO_BPM, Math.round(candidate)),
  )
}

export function getPlayAlongTempo(
  preferences: PracticePreferences,
  exerciseId: string,
  authoredTempoBpm: number,
): number {
  return clampPlayAlongTempo(
    preferences.playAlongTempos[exerciseId] ?? authoredTempoBpm,
    authoredTempoBpm,
  )
}
