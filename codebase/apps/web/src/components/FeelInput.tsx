import { useId } from 'react'
import { FEELS, FEEL_LABELS, FEEL_MEANINGS, type Feel } from '../appData/run'

/**
 * How it felt, beside how it went. The two are different questions and the app
 * uses them differently: the answer to "how did it go" moves the schedule, and
 * this one never does — it decides what a session opens on, what it ends on,
 * and what a bad week looks like (docs/product/next-session-design.md §8).
 *
 * Optional, with nothing chosen for you, and pressing the chosen one again
 * clears it — the same gesture the rating has. Saying nothing reads as fine.
 */

const BASE =
  'inline-flex h-9 items-center justify-center rounded-lg border px-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg'

interface FeelInputProps {
  value: Feel | null
  onChange: (value: Feel | null) => void
  /** What is being answered about, for assistive tech, when several share a screen. */
  subject?: string
}

export function FeelInput({ value, onChange, subject }: FeelInputProps) {
  const labelId = useId()
  return (
    <div role="group" aria-labelledby={labelId}>
      <div className="flex items-baseline justify-between gap-3">
        <p id={labelId} className="text-sm font-medium text-fg">
          How did it feel?{subject && <span className="sr-only"> {subject}.</span>}{' '}
          <span className="font-normal text-muted">Optional</span>
        </p>
        <p className="text-sm text-accent-text" aria-live="polite">
          {value === null ? '' : FEEL_MEANINGS[value]}
        </p>
      </div>
      <div className="mt-2.5 grid grid-cols-3 gap-1.5">
        {FEELS.map((feel) => {
          const chosen = feel === value
          return (
            <button
              key={feel}
              type="button"
              aria-pressed={chosen}
              aria-label={`${FEEL_LABELS[feel]}${subject ? ` for ${subject}` : ''}`}
              onClick={() => onChange(chosen ? null : feel)}
              className={`${BASE} cursor-pointer ${
                chosen ? 'border-accent bg-accent text-on-accent' : 'border-line bg-panel text-fg hover:border-line-strong'
              }`}
            >
              {FEEL_LABELS[feel]}
            </button>
          )
        })}
      </div>
    </div>
  )
}
