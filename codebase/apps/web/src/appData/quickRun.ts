import { MAX_TEMPO, MIN_TEMPO } from '../player/transport'
import type { SessionSlot } from './nextSession'
import { PLAN_CONSTANTS } from './planConstants'

/**
 * What one press of Play starts. The app decides — the next session comes from
 * the run history (appData/nextSession); the only thing the user says about it
 * is how long they have got (docs/product/next-session-design.md §3).
 */

/** What the user has said about the next session: how long it is. */
export interface QuickRunSettings {
  /** How long the session should be, in minutes — one of the offered lengths. */
  sessionMinutes: number
}

export const QUICK_RUN_KEY = 'jazz-master.quick-run'

/** The lengths on offer, shortest first; a busy day is the normal day, so it leads. */
export const SESSION_MINUTES: readonly number[] = PLAN_CONSTANTS.sessionMinutes

export function defaultQuickRunSettings(): QuickRunSettings {
  return { sessionMinutes: PLAN_CONSTANTS.defaultSessionMinutes }
}

/** What the chosen length comes to in seconds, which is what the assembler takes. */
export function sessionBudgetSeconds(settings: QuickRunSettings): number {
  return settings.sessionMinutes * 60
}

/** What a session plays, in order. */
export interface SessionPlan {
  slots: readonly SessionSlot[]
  /** What it is expected to take, in seconds — the card says it before Play is pressed. */
  plannedSeconds: number
}

/**
 * Where a plan is played: the session URL's search, which carries the plan so
 * a reload plays the same thing at the same tempos. A slot is `id` when it is
 * played at the exercise's own tempo and `id@95` when the scheduler asked for
 * another one.
 */
export function sessionSearch(plan: SessionPlan): { x: string } {
  const x = plan.slots
    .map((slot) => (slot.tempoBpm === slot.exercise.tempoBpm ? slot.exercise.id : `${slot.exercise.id}@${slot.tempoBpm}`))
    .join(',')
  return { x }
}

/** One exercise of a session as the URL names it. */
export interface SessionSearchItem {
  exerciseId: string
  /** What the plan asked for; null when the URL did not say, meaning the written tempo. */
  tempoBpm: number | null
}

/**
 * Read back what `sessionSearch` wrote; an id may appear only once, and
 * nonsense is dropped. The URL is anyone's to write, so a tempo outside what a
 * player can hold is read as no tempo at all rather than passed on.
 */
export function parseSessionSearch(x: string | undefined): SessionSearchItem[] {
  const seen = new Set<string>()
  return (x ?? '').split(',').flatMap((entry) => {
    const [exerciseId, tempo, ...rest] = entry.split('@')
    if (!exerciseId || seen.has(exerciseId)) return []
    seen.add(exerciseId)
    const tempoBpm = Number(tempo)
    const playable = rest.length === 0 && Number.isInteger(tempoBpm) && tempoBpm >= MIN_TEMPO && tempoBpm <= MAX_TEMPO
    return [{ exerciseId, tempoBpm: playable ? tempoBpm : null }]
  })
}

/**
 * The choice is one per app, not one per component: the sidebar's panel sets
 * it and the home card must plan from the same answer at once. Read through
 * `quickRunSettings`, written through `setQuickRunSettings`.
 */
let current: QuickRunSettings | null = null
const listeners = new Set<() => void>()

export function quickRunSettings(): QuickRunSettings {
  if (current === null) current = loadQuickRunSettings()
  return current
}

export function setQuickRunSettings(settings: QuickRunSettings): void {
  current = settings
  saveQuickRunSettings(settings)
  for (const listener of listeners) listener()
}

export function subscribeQuickRunSettings(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** Forget what was read, so a test (or a signed-out page) starts from storage again. */
export function resetQuickRunSettings(): void {
  current = null
  for (const listener of listeners) listener()
}

/** The last saved settings, or the defaults; storage that is missing or broken is ignored. */
export function loadQuickRunSettings(
  storage: Pick<Storage, 'getItem'> | null = safeStorage(),
): QuickRunSettings {
  try {
    const raw = storage?.getItem(QUICK_RUN_KEY)
    if (!raw) return defaultQuickRunSettings()
    const parsed = JSON.parse(raw) as Partial<Record<keyof QuickRunSettings, unknown>>
    return {
      // Anything but one of the offered lengths — an old value, a hand-edited
      // one — reads as the default rather than planning to a length no button shows.
      sessionMinutes:
        typeof parsed.sessionMinutes === 'number' && SESSION_MINUTES.includes(parsed.sessionMinutes)
          ? parsed.sessionMinutes
          : PLAN_CONSTANTS.defaultSessionMinutes,
    }
  } catch {
    return defaultQuickRunSettings()
  }
}

export function saveQuickRunSettings(
  settings: QuickRunSettings,
  storage: Pick<Storage, 'setItem'> | null = safeStorage(),
): void {
  try {
    storage?.setItem(QUICK_RUN_KEY, JSON.stringify(settings))
  } catch {
    // Private mode or a full quota: the choice still holds for this page.
  }
}

function safeStorage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    return null
  }
}
