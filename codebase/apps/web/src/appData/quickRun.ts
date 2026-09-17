import type { Exercise, ExerciseArea } from '../content'
import type { Routine } from './routine'

/** How a quick run is put together; remembered per browser. */
export interface QuickRunSettings {
  /** How many exercises to draw. */
  count: number
  /** Areas to draw from; never empty. */
  areas: ExerciseArea[]
  /** Play this routine instead of drawing at random; null for the random draw. */
  routineId: string | null
}

export const QUICK_RUN_MIN = 1
export const QUICK_RUN_MAX = 6
export const QUICK_RUN_KEY = 'jazz-master.quick-run'

export function defaultQuickRunSettings(exercises: readonly Exercise[]): QuickRunSettings {
  return { count: 3, areas: areasOf(exercises), routineId: null }
}

/** The areas the pack actually has, in authored order. */
export function areasOf(exercises: readonly Exercise[]): ExerciseArea[] {
  return [...new Set(exercises.map((exercise) => exercise.area))]
}

export function clampQuickRunCount(count: number): number {
  if (!Number.isFinite(count)) return 3
  return Math.round(Math.min(Math.max(count, QUICK_RUN_MIN), QUICK_RUN_MAX))
}

/** Exercises a quick run may draw from under these settings. */
export function quickRunPool(exercises: readonly Exercise[], settings: QuickRunSettings): Exercise[] {
  return exercises.filter((exercise) => settings.areas.includes(exercise.area))
}

/**
 * Draw the exercises of a quick run: a random handful from the pool, without
 * repeats, then put in playing order — easier first, authored order within a
 * level — so the run warms up rather than lurches. Fewer than asked when the
 * pool is smaller.
 */
export function pickQuickRun(
  exercises: readonly Exercise[],
  settings: QuickRunSettings,
  random: () => number = Math.random,
): Exercise[] {
  const pool = quickRunPool(exercises, settings)
  // Fisher–Yates, from the end.
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  const order = new Map(exercises.map((exercise, index) => [exercise.id, index]))
  return pool
    .slice(0, clampQuickRunCount(settings.count))
    .sort((a, b) => a.level - b.level || (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0))
}

/** The exercises of a routine that can be played now, in its order; one deleted since is skipped. */
export function routineExercises(routine: Routine, exercises: readonly Exercise[]): Exercise[] {
  const byId = new Map(exercises.map((exercise) => [exercise.id, exercise]))
  return routine.items.flatMap((item) => byId.get(item.exerciseId) ?? [])
}

/** What one press of Quick run starts: the chosen routine as prepared, or a random draw. */
export interface QuickRunPlan {
  exercises: Exercise[]
  /** Set when the plan is a routine, so the session can say whose it is. */
  routine: Routine | null
}

/**
 * The chosen routine, top to bottom — or the random draw when none is chosen,
 * when the chosen one is gone, or when nothing in it can be played any more.
 */
export function planQuickRun(
  exercises: readonly Exercise[],
  settings: QuickRunSettings,
  routines: readonly Routine[],
  random: () => number = Math.random,
): QuickRunPlan {
  const routine = routines.find((candidate) => candidate.id === settings.routineId)
  const prepared = routine ? routineExercises(routine, exercises) : []
  return routine && prepared.length > 0
    ? { exercises: prepared, routine }
    : { exercises: pickQuickRun(exercises, settings, random), routine: null }
}

/** Where a plan is played: the session URL's search, which carries the draw so a reload keeps it. */
export function sessionSearch(plan: QuickRunPlan): { x: string; r?: string } {
  const x = plan.exercises.map((exercise) => exercise.id).join(',')
  return plan.routine ? { x, r: plan.routine.id } : { x }
}

/** The last saved settings, or the defaults; storage that is missing or broken is ignored. */
export function loadQuickRunSettings(
  exercises: readonly Exercise[],
  storage: Pick<Storage, 'getItem'> | null = safeStorage(),
): QuickRunSettings {
  const defaults = defaultQuickRunSettings(exercises)
  try {
    const raw = storage?.getItem(QUICK_RUN_KEY)
    if (!raw) return defaults
    const parsed = JSON.parse(raw) as Partial<Record<keyof QuickRunSettings, unknown>>
    // Settings saved before `standards` became `lines` still mean the same exercises.
    const saved = Array.isArray(parsed.areas) ? parsed.areas.map((area: unknown) => (area === 'standards' ? 'lines' : area)) : []
    const areas = defaults.areas.filter((area) => saved.includes(area))
    return {
      count: typeof parsed.count === 'number' ? clampQuickRunCount(parsed.count) : defaults.count,
      areas: areas.length > 0 ? areas : defaults.areas,
      routineId: typeof parsed.routineId === 'string' && parsed.routineId.length > 0 ? parsed.routineId : null,
    }
  } catch {
    return defaults
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
