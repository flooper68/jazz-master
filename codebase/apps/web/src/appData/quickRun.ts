import type { Exercise } from '../content'
import { MAX_TEMPO, MIN_TEMPO } from '../player/transport'
import type { SessionSlot } from './nextSession'
import type { Routine } from './routine'

/**
 * What one press of Play starts. The app decides — the next session comes from
 * the run history (appData/nextSession) — unless the user has named a routine
 * as what to play instead, which is the one override that wins
 * (docs/product/next-session-design.md §3).
 */

/** The only choice left in the old quick-run settings: a routine as next, or nothing. */
export interface QuickRunSettings {
  /** Play this routine instead of the next session; null for the generated one. */
  routineId: string | null
}

export const QUICK_RUN_KEY = 'jazz-master.quick-run'

export function defaultQuickRunSettings(): QuickRunSettings {
  return { routineId: null }
}

/** The exercises of a routine that can be played now, in its order; one deleted since is skipped. */
export function routineExercises(routine: Routine, exercises: readonly Exercise[]): Exercise[] {
  const byId = new Map(exercises.map((exercise) => [exercise.id, exercise]))
  return routine.items.flatMap((item) => byId.get(item.exerciseId) ?? [])
}

/** What a session plays, in order, and where it came from. */
export interface SessionPlan {
  slots: readonly SessionSlot[]
  /** Set when the plan is a routine, so the session can say whose it is. */
  routine: Routine | null
}

/** A routine as prepared: its exercises in order, each at its own written tempo. */
export function routinePlan(routine: Routine, exercises: readonly Exercise[]): SessionPlan {
  const prepared = routineExercises(routine, exercises)
  return {
    slots: prepared.map((exercise) => ({ exercise, tempoBpm: exercise.tempoBpm, reason: `From ${routine.name}` })),
    routine,
  }
}

/** The routine named as next, while it still exists and still has something to play. */
export function chosenRoutine(
  settings: QuickRunSettings,
  routines: readonly Routine[],
  exercises: readonly Exercise[],
): Routine | null {
  const routine = routines.find((candidate) => candidate.id === settings.routineId)
  return routine && routineExercises(routine, exercises).length > 0 ? routine : null
}

/**
 * Where a plan is played: the session URL's search, which carries the plan so
 * a reload plays the same thing at the same tempos. A slot is `id` when it is
 * played at the exercise's own tempo and `id@95` when the scheduler asked for
 * another one.
 */
export function sessionSearch(plan: SessionPlan): { x: string; r?: string } {
  const x = plan.slots
    .map((slot) => (slot.tempoBpm === slot.exercise.tempoBpm ? slot.exercise.id : `${slot.exercise.id}@${slot.tempoBpm}`))
    .join(',')
  return plan.routine ? { x, r: plan.routine.id } : { x }
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
      routineId: typeof parsed.routineId === 'string' && parsed.routineId.length > 0 ? parsed.routineId : null,
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
