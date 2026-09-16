import type { ScoreView } from '../score/Score'

/** Player preferences that outlive any one exercise: sound and view. */
export interface PlayerPrefs {
  click: boolean
  voice: boolean
  countIn: boolean
  view: ScoreView
}

export const DEFAULT_PLAYER_PREFS: PlayerPrefs = {
  click: true,
  voice: false,
  countIn: true,
  view: 'both',
}
