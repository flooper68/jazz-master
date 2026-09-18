import { useEffect, useRef, useState } from 'react'
import { quickRunSettings, routineExercises, setQuickRunSettings } from '../appData/quickRun'
import type { Routine } from '../appData/routine'
import type { Exercise } from '../content'
import { ChevronDownIcon, PlayIcon } from './icons'

/**
 * The primary action: one press plays what the app decided — the next session
 * worked out from the run history, with a reason behind every slot. The
 * chevron beside it opens the one override there is: a practice routine
 * played as prepared instead, which is remembered.
 */

const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg'

export interface QuickRunButtonProps {
  exercises: readonly Exercise[]
  /** The user's practice routines, offered as what to play instead of the next session. */
  routines: readonly Routine[]
  /**
   * What is on offer: its name, how many exercises, roughly how long, and the
   * routine it came from — the page has already resolved the override, so the
   * panel marks what is actually going to play.
   */
  next: { label: string; count: number; seconds: number; routineId: string | null }
  /** Called when the user presses Play; the page works out the plan afresh. */
  onStart: () => void
  /** Folded sidebar: just the icon, from md up; one press still starts a session. */
  iconOnly?: boolean
}

export function QuickRunButton({ exercises, routines, next, onStart, iconOnly = false }: QuickRunButtonProps) {
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

  const { label, count } = next
  const minutes = Math.max(Math.round(next.seconds / 60), 1)
  // The plan has already decided whether the named routine still stands.
  const routine = next.routineId === null ? null : (routines.find((item) => item.id === next.routineId) ?? null)

  return (
    <div ref={rootRef} className="relative flex">
      <button
        type="button"
        onClick={onStart}
        disabled={count === 0}
        aria-label={`Play ${label}: ${count} ${count === 1 ? 'exercise' : 'exercises'}, about ${minutes} min`}
        title={iconOnly ? label : undefined}
        className={`inline-flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-l-lg bg-accent px-2.5 py-1.5 text-sm font-semibold text-on-accent hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60 ${FOCUS} ${
          iconOnly ? 'md:justify-center md:rounded-lg md:px-0' : ''
        }`}
      >
        <PlayIcon />
        {/* Three links share the phone row: there the icon speaks for itself. */}
        <span className={`hidden truncate min-[480px]:inline ${iconOnly ? 'md:sr-only' : ''}`}>{label}</span>
        {/* Only where the sidebar has been dragged wide enough for it (see the container in Layout). */}
        <span className={`ml-auto hidden font-normal whitespace-nowrap opacity-80 tabular-nums ${iconOnly ? '' : '@[15rem]:inline'}`}>
          {count} · ~{minutes} min
        </span>
      </button>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label="What to play next"
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
          aria-label="What to play next"
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
                  onChange={() => setQuickRunSettings({ ...quickRunSettings(), routineId: null })}
                />
                The next session
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
                      onChange={() => setQuickRunSettings({ ...quickRunSettings(), routineId: item.id })}
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

          <p className="mt-3 border-t border-line pt-3 text-xs text-muted">
            {routine
              ? `${routine.name}, as prepared: ${count} ${count === 1 ? 'exercise' : 'exercises'} in order — about ${minutes} min.`
              : count === 0
                ? 'Nothing to practise yet — add an exercise and it shows up here.'
                : `Worked out from what you have played: ${count} ${count === 1 ? 'exercise' : 'exercises'} — about ${minutes} min. Home says why each one is there.`}
          </p>
        </div>
      )}
    </div>
  )
}
