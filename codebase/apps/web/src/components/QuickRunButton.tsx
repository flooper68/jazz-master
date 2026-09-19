import { useEffect, useId, useRef, useState } from 'react'
import { quickRunSettings, SESSION_MINUTES, setQuickRunSettings } from '../appData/quickRun'
import { ChevronDownIcon, PlayIcon } from './icons'

/**
 * The primary action: one press plays what the app decided — the next session
 * worked out from the run history, with a reason behind every slot. The
 * chevron beside it asks the only question worth asking first: how long have
 * you got. The answer is remembered, and it is the same one the home card
 * takes, because a session is a length of time before it is a list (JM-5).
 */

const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg'

export interface QuickRunButtonProps {
  /**
   * What is on offer: its name, how many exercises and roughly how long — the
   * page has already worked the plan out, so the panel can say what is
   * actually going to play.
   */
  next: { label: string; count: number; seconds: number }
  /** Called when the user presses Play; the page works out the plan afresh. */
  onStart: () => void
  /** Folded sidebar: just the icon, from md up; one press still starts a session. */
  iconOnly?: boolean
}

export function QuickRunButton({ next, onStart, iconOnly = false }: QuickRunButtonProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const lengthName = useId()

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
  const chosenMinutes = quickRunSettings().sessionMinutes

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
        aria-label="How long have you got?"
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
          aria-label="How long have you got?"
          className="fade-in absolute top-full right-0 z-30 mt-2 w-72 rounded-2xl border border-line bg-panel p-4 text-left shadow-lg shadow-shade md:right-auto md:left-0"
        >
          <fieldset>
            <legend className="float-left mb-2 w-full text-sm font-medium text-fg">How long have you got?</legend>
            <div className="clear-both flex flex-wrap gap-1.5">
              {SESSION_MINUTES.map((option) => {
                const chosen = option === chosenMinutes
                return (
                  <label
                    key={option}
                    className={`cursor-pointer rounded-lg px-2.5 py-1 text-sm font-semibold tabular-nums focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-fg ${
                      chosen ? 'bg-cta text-cta-fg' : 'bg-panel-2 text-fg-2 hover:text-fg'
                    }`}
                  >
                    <input
                      type="radio"
                      name={lengthName}
                      value={option}
                      checked={chosen}
                      onChange={() => setQuickRunSettings({ ...quickRunSettings(), sessionMinutes: option })}
                      className="sr-only"
                    />
                    {option} min
                  </label>
                )
              })}
            </div>
          </fieldset>

          <p className="mt-3 border-t border-line pt-3 text-xs text-muted">
            {count === 0
              ? 'Nothing to practise yet — add an exercise and it shows up here.'
              : `Worked out from what you have played: ${count} ${count === 1 ? 'exercise' : 'exercises'} — about ${minutes} min. Home says why each one is there.`}
          </p>
        </div>
      )}
    </div>
  )
}
