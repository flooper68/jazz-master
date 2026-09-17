import { useId } from 'react'
import { RATING_MAX, RATING_MIN, RATING_SKIPPED } from '../appData/run'

/**
 * How hard the exercise felt, 1 (easy) to 10 (hard). Optional: pressing the
 * chosen number again clears it. Seven is shown but not on offer — it is the
 * answer people give when they have not decided.
 */

const VALUES = Array.from({ length: RATING_MAX - RATING_MIN + 1 }, (_, index) => RATING_MIN + index)
const BASE =
  'inline-flex h-10 items-center justify-center rounded-lg border text-sm font-medium tabular-nums focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg'

/** What the number means, said back once it is chosen. */
function feel(rating: number): string {
  if (rating <= 3) return 'Comfortable'
  if (rating <= 6) return 'Working on it'
  return 'A real stretch'
}

interface RatingInputProps {
  value: number | null
  onChange: (value: number | null) => void
  /** What is being rated, for assistive tech, when several ratings share a screen. */
  subject?: string
}

export function RatingInput({ value, onChange, subject }: RatingInputProps) {
  const labelId = useId()
  return (
    <div role="group" aria-labelledby={labelId}>
      <div className="flex items-baseline justify-between gap-3">
        <p id={labelId} className="text-sm font-medium text-fg">
          How hard was it?{subject && <span className="sr-only"> {subject}.</span>}{' '}
          <span className="font-normal text-muted">Optional</span>
        </p>
        <p className="text-sm text-accent-text" aria-live="polite">
          {value === null ? '' : `${value}/10 · ${feel(value)}`}
        </p>
      </div>
      <div className="mt-3 grid grid-cols-5 gap-1.5 sm:grid-cols-10">
        {VALUES.map((rating) => {
          const chosen = rating === value
          const skipped = rating === RATING_SKIPPED
          return (
            <button
              key={rating}
              type="button"
              disabled={skipped}
              aria-pressed={chosen}
              aria-label={`${rating} out of ${RATING_MAX}${subject ? ` for ${subject}` : ''}`}
              onClick={() => onChange(chosen ? null : rating)}
              className={`${BASE} ${
                chosen
                  ? 'border-accent bg-accent text-on-accent'
                  : skipped
                    ? 'cursor-not-allowed border-line bg-panel-2 text-muted opacity-50'
                    : 'cursor-pointer border-line bg-panel text-fg hover:border-line-strong'
              }`}
            >
              {rating}
            </button>
          )
        })}
      </div>
      <p className="mt-2 hidden justify-between text-xs text-muted sm:flex" aria-hidden="true">
        <span>Easy</span>
        <span>Hard</span>
      </p>
    </div>
  )
}
