import { useId } from 'react'
import { DIFFICULTIES, DIFFICULTY_LABELS, DIFFICULTY_MEANINGS, type Difficulty } from '../appData/run'

/**
 * How it went, in one tap: Again · Hard · Good · Easy. Anki's four, in the
 * same order, with no safe middle to hide in and nothing chosen for you — the
 * answer is what moves the exercise's next review and its tempo. Optional:
 * pressing the chosen answer again clears it.
 */

const BASE =
  'inline-flex h-9 items-center justify-center rounded-lg border px-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg'

interface RatingInputProps {
  value: Difficulty | null
  onChange: (value: Difficulty | null) => void
  /** What is being rated, for assistive tech, when several ratings share a screen. */
  subject?: string
}

export function RatingInput({ value, onChange, subject }: RatingInputProps) {
  const labelId = useId()
  return (
    <div role="group" aria-labelledby={labelId}>
      <div className="flex items-baseline justify-between gap-3">
        <p id={labelId} className="text-sm font-medium text-fg">
          How did it go?{subject && <span className="sr-only"> {subject}.</span>}{' '}
          <span className="font-normal text-muted">Optional</span>
        </p>
        <p className="text-sm text-accent-text" aria-live="polite">
          {value === null ? '' : DIFFICULTY_MEANINGS[value]}
        </p>
      </div>
      <div className="mt-2.5 grid grid-cols-4 gap-1.5">
        {DIFFICULTIES.map((difficulty) => {
          const chosen = difficulty === value
          return (
            <button
              key={difficulty}
              type="button"
              aria-pressed={chosen}
              aria-label={`${DIFFICULTY_LABELS[difficulty]}${subject ? ` for ${subject}` : ''}`}
              onClick={() => onChange(chosen ? null : difficulty)}
              className={`${BASE} cursor-pointer ${
                chosen
                  ? 'border-accent bg-accent text-on-accent'
                  : 'border-line bg-panel text-fg hover:border-line-strong'
              }`}
            >
              {DIFFICULTY_LABELS[difficulty]}
            </button>
          )
        })}
      </div>
    </div>
  )
}
