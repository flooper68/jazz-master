import { RATING_MAX, RATING_MIN, RATING_SKIPPED } from '../appData/run'

/**
 * How hard the exercise felt, 1 (easy) to 10 (hard). Optional: pressing the
 * chosen number again clears it. Seven is shown but not on offer — it is the
 * answer people give when they have not decided.
 */

const VALUES = Array.from({ length: RATING_MAX - RATING_MIN + 1 }, (_, index) => RATING_MIN + index)
const BASE =
  'inline-flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-medium tabular-nums focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg'

interface RatingInputProps {
  value: number | null
  onChange: (value: number | null) => void
}

export function RatingInput({ value, onChange }: RatingInputProps) {
  return (
    <div role="group" aria-labelledby="rating-label" className="w-fit max-w-full">
      <p id="rating-label" className="text-sm font-medium text-fg">
        How hard was it? <span className="font-normal text-muted">Optional</span>
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {VALUES.map((rating) => {
          const chosen = rating === value
          const skipped = rating === RATING_SKIPPED
          return (
            <button
              key={rating}
              type="button"
              disabled={skipped}
              aria-pressed={chosen}
              aria-label={`${rating} out of ${RATING_MAX}`}
              onClick={() => onChange(chosen ? null : rating)}
              className={`${BASE} ${
                chosen
                  ? 'border-fg bg-fg text-panel'
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
      <p className="mt-1.5 flex justify-between text-xs text-muted" aria-hidden="true">
        <span>Easy</span>
        <span>Hard</span>
      </p>
    </div>
  )
}
