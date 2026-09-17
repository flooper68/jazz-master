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

export const PLAYER_PREFS_KEY = 'jazz-master.player-prefs'

const VIEWS: ScoreView[] = ['tab', 'notation', 'both']

/** The last saved preferences, or the defaults; storage that is missing or broken is ignored. */
export function loadPlayerPrefs(storage: Pick<Storage, 'getItem'> | null = safeStorage()): PlayerPrefs {
  try {
    const raw = storage?.getItem(PLAYER_PREFS_KEY)
    if (!raw) return DEFAULT_PLAYER_PREFS
    const parsed = JSON.parse(raw) as Partial<Record<keyof PlayerPrefs, unknown>>
    return {
      click: typeof parsed.click === 'boolean' ? parsed.click : DEFAULT_PLAYER_PREFS.click,
      voice: typeof parsed.voice === 'boolean' ? parsed.voice : DEFAULT_PLAYER_PREFS.voice,
      countIn: typeof parsed.countIn === 'boolean' ? parsed.countIn : DEFAULT_PLAYER_PREFS.countIn,
      view: VIEWS.includes(parsed.view as ScoreView) ? (parsed.view as ScoreView) : DEFAULT_PLAYER_PREFS.view,
    }
  } catch {
    return DEFAULT_PLAYER_PREFS
  }
}

export function savePlayerPrefs(prefs: PlayerPrefs, storage: Pick<Storage, 'setItem'> | null = safeStorage()): void {
  try {
    storage?.setItem(PLAYER_PREFS_KEY, JSON.stringify(prefs))
  } catch {
    // Private mode or a full quota: the choice still holds for this run.
  }
}

function safeStorage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    return null
  }
}
