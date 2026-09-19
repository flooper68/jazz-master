import { z } from 'zod'
import { DEFAULT_VOICE, isVoiceId, type VoiceId } from '../audio/voices'

/**
 * Player preferences as data: what is heard and what is read, the same shape
 * in the browser's storage and in the user's row. Pure — the storage and the
 * store that hold it live in `components/playerPrefs`.
 */

export const ZOOM_MIN = 0.8
export const ZOOM_MAX = 2
export const ZOOM_STEP = 0.1

export function clampZoom(zoom: number): number {
  if (!Number.isFinite(zoom)) return 1
  return Math.round(Math.min(Math.max(zoom, ZOOM_MIN), ZOOM_MAX) * 10) / 10
}

export const SCORE_VIEWS = ['tab', 'notation', 'both'] as const

export const playerPrefsSchema = z.object({
  click: z.boolean(),
  voice: z.boolean(),
  countIn: z.boolean(),
  view: z.enum(SCORE_VIEWS),
  /** Which guitar plays the line along. */
  guitar: z.custom<VoiceId>(isVoiceId, 'Not a guitar this app has'),
  /** Score magnification, 1 = engraved size. */
  zoom: z.number().min(ZOOM_MIN).max(ZOOM_MAX),
})

export type PlayerPrefs = z.infer<typeof playerPrefsSchema>

export const DEFAULT_PLAYER_PREFS: PlayerPrefs = {
  click: true,
  voice: false,
  countIn: true,
  view: 'both',
  guitar: DEFAULT_VOICE,
  zoom: 1.2,
}

/**
 * Whatever came out of storage or off the wire, read field by field: one
 * unreadable choice (an old view name, a guitar since removed) costs that
 * field and not the rest.
 */
export function parsePlayerPrefs(value: unknown): PlayerPrefs {
  if (typeof value !== 'object' || value === null) return DEFAULT_PLAYER_PREFS
  const raw = value as Record<string, unknown>
  const field = <K extends keyof PlayerPrefs>(key: K): PlayerPrefs[K] => {
    const parsed = playerPrefsSchema.shape[key].safeParse(key === 'zoom' && typeof raw[key] === 'number' ? clampZoom(raw[key]) : raw[key])
    return parsed.success ? (parsed.data as PlayerPrefs[K]) : DEFAULT_PLAYER_PREFS[key]
  }
  return {
    click: field('click'),
    voice: field('voice'),
    countIn: field('countIn'),
    view: field('view'),
    guitar: field('guitar'),
    zoom: field('zoom'),
  }
}
