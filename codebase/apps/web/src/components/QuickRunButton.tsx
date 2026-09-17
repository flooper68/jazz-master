import { useEffect, useRef, useState } from 'react'
import {
  areasOf,
  clampQuickRunCount,
  loadQuickRunSettings,
  planQuickRun,
  QUICK_RUN_MAX,
  QUICK_RUN_MIN,
  quickRunPool,
  routineExercises,
  saveQuickRunSettings,
  type QuickRunPlan,
  type QuickRunSettings,
} from '../appData/quickRun'
import type { Routine } from '../appData/routine'
import { exerciseSeconds, type Exercise } from '../content'
import { AREA_LABELS } from './areaLabels'
import { ChevronDownIcon, MinusIcon, PlusIcon, ShuffleIcon } from './icons'

/**
 * Quick run: one press starts a session — a few random exercises, or one of
 * the user's practice routines played as prepared. The chevron beside it
 * opens the settings — which of the two, and for the random draw how many and
 * from which areas — which are remembered.
 */

const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg'
const STEP_BUTTON = `inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-line bg-panel text-fg hover:border-line-strong disabled:cursor-not-allowed disabled:opacity-40 ${FOCUS}`

interface QuickRunButtonProps {
  exercises: readonly Exercise[]
  /** The user's practice routines, offered as what to play instead of a random draw. */
  routines: readonly Routine[]
  /** Called with what to play, in playing order. */
  onStart: (plan: QuickRunPlan) => void
  /** Folded sidebar: just the icon, from md up; one press still starts a run. */
  iconOnly?: boolean
}

export function QuickRunButton({ exercises, routines, onStart, iconOnly = false }: QuickRunButtonProps) {
  const [settings, setSettings] = useState<QuickRunSettings>(() => loadQuickRunSettings(exercises))
  useEffect(() => saveQuickRunSettings(settings), [settings])
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  // The panel closes on a press outside it and on Escape, like the player's menus.
  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const pool = quickRunPool(exercises, settings)
  // The chosen routine, while it still exists and still has something to play; otherwise the draw stands in.
  const chosen = routines.find((routine) => routine.id === settings.routineId)
  const prepared = chosen ? routineExercises(chosen, exercises) : []
  const routine = chosen && prepared.length > 0 ? chosen : null
  const drawn = routine ? prepared.length : Math.min(settings.count, pool.length)
  // A routine's length is known; a draw's is what a run of this size takes on average.
  const seconds = routine
    ? prepared.reduce((sum, exercise) => sum + exerciseSeconds(exercise), 0)
    : (pool.reduce((sum, exercise) => sum + exerciseSeconds(exercise), 0) / Math.max(pool.length, 1)) * drawn
  const minutes = Math.max(Math.round(seconds / 60), 1)
  const setCount = (count: number) => setSettings((current) => ({ ...current, count: clampQuickRunCount(count) }))

  function toggleArea(area: QuickRunSettings['areas'][number]): void {
    setSettings((current) => {
      const has = current.areas.includes(area)
      // Never down to no areas: there would be nothing to draw from.
      if (has && current.areas.length === 1) return current
      const areas = areasOf(exercises).filter((item) => (item === area ? !has : current.areas.includes(item)))
      return { ...current, areas }
    })
  }

  return (
    <div ref={rootRef} className="relative flex">
      <button
        type="button"
        onClick={() => onStart(planQuickRun(exercises, settings, routines))}
        aria-label={
          routine
            ? `Quick run: ${routine.name}, ${drawn} ${drawn === 1 ? 'exercise' : 'exercises'}, about ${minutes} min`
            : `Quick run: ${drawn} random ${drawn === 1 ? 'exercise' : 'exercises'}, about ${minutes} min`
        }
        title={iconOnly ? 'Quick run' : undefined}
        className={`inline-flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-l-lg bg-accent px-2.5 py-1.5 text-sm font-semibold text-on-accent hover:bg-accent-hover ${FOCUS} ${
          iconOnly ? 'md:justify-center md:rounded-lg md:px-0' : ''
        }`}
      >
        <ShuffleIcon />
        {/* Three links share the phone row: there the icon speaks for itself. */}
        <span className={`hidden truncate min-[480px]:inline ${iconOnly ? 'md:sr-only' : ''}`}>Quick run</span>
        {/* Only where the sidebar has been dragged wide enough for it (see the container in Layout). */}
        <span className={`ml-auto hidden font-normal whitespace-nowrap opacity-80 tabular-nums ${iconOnly ? '' : '@[15rem]:inline'}`}>
          {drawn} · ~{minutes} min
        </span>
      </button>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label="Quick run settings"
        aria-expanded={open}
        aria-haspopup="dialog"
        className={`inline-flex cursor-pointer items-center rounded-r-lg border-l border-on-accent/20 bg-accent px-2.5 text-on-accent hover:bg-accent-hover ${FOCUS} ${
          iconOnly ? 'md:hidden' : ''
        }`}
      >
        <ChevronDownIcon />
      </button>
      {open && (
        <div
          role="dialog"
          aria-label="Quick run settings"
          className="fade-in absolute top-full right-0 z-30 mt-2 w-72 rounded-2xl border border-line bg-panel p-4 text-left shadow-lg shadow-shade md:right-auto md:left-0"
        >
          <fieldset>
            <legend className="float-left mb-2 w-full text-sm font-medium text-fg">Play</legend>
            <div className="clear-both space-y-1.5">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-fg-2">
                <input
                  type="radio"
                  name="quick-run-source"
                  className="accent-cta"
                  checked={routine === null}
                  onChange={() => setSettings((current) => ({ ...current, routineId: null }))}
                />
                A random draw
              </label>
              {routines.map((item) => {
                const playable = routineExercises(item, exercises).length
                return (
                  <label key={item.id} className={`flex items-center gap-2 text-sm ${playable > 0 ? 'cursor-pointer text-fg-2' : 'text-muted'}`}>
                    <input
                      type="radio"
                      name="quick-run-source"
                      className="accent-cta"
                      disabled={playable === 0}
                      checked={routine?.id === item.id}
                      onChange={() => setSettings((current) => ({ ...current, routineId: item.id }))}
                    />
                    <span className="truncate">{item.name}</span>
                    <span className="ml-auto text-xs text-muted tabular-nums">{playable}</span>
                  </label>
                )
              })}
            </div>
            {routines.length === 0 && (
              <p className="mt-2 text-xs text-muted">No routines yet — put one together under Routines and it shows up here.</p>
            )}
          </fieldset>

          {routine === null && (
          <>
          <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-3">
            <p id="quick-run-count" className="text-sm font-medium text-fg">
              Exercises
            </p>
            <div className="flex items-center gap-2" role="group" aria-labelledby="quick-run-count">
              <button
                type="button"
                onClick={() => setCount(settings.count - 1)}
                disabled={settings.count <= QUICK_RUN_MIN}
                aria-label="Fewer exercises"
                className={STEP_BUTTON}
              >
                <MinusIcon />
              </button>
              <output className="w-6 text-center font-display text-lg font-bold tabular-nums" aria-live="polite">
                {settings.count}
              </output>
              <button
                type="button"
                onClick={() => setCount(settings.count + 1)}
                disabled={settings.count >= QUICK_RUN_MAX}
                aria-label="More exercises"
                className={STEP_BUTTON}
              >
                <PlusIcon />
              </button>
            </div>
          </div>

          <fieldset className="mt-4 border-t border-line pt-3">
            <legend className="float-left mb-2 w-full text-sm font-medium text-fg">Draw from</legend>
            <div className="clear-both space-y-1.5">
              {areasOf(exercises).map((area) => (
                <label key={area} className="flex cursor-pointer items-center gap-2 text-sm text-fg-2">
                  <input
                    type="checkbox"
                    className="accent-cta"
                    checked={settings.areas.includes(area)}
                    onChange={() => toggleArea(area)}
                  />
                  {AREA_LABELS[area]}
                  <span className="ml-auto text-xs text-muted tabular-nums">
                    {exercises.filter((exercise) => exercise.area === area).length}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          </>
          )}

          <p className="mt-3 border-t border-line pt-3 text-xs text-muted">
            {routine
              ? `${routine.name}, as prepared: ${drawn} ${drawn === 1 ? 'exercise' : 'exercises'} in order — about ${minutes} min.`
              : drawn < settings.count
              ? `Only ${pool.length} to draw from — the run will have ${drawn}.`
              : `${drawn} random ${drawn === 1 ? 'exercise' : 'exercises'}, easier first — about ${minutes} min.`}
          </p>
        </div>
      )}
    </div>
  )
}
