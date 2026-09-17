import { exerciseShape, type Exercise } from '../content'
import { Fretboard } from './Fretboard'
import { CloseIcon } from './icons'

/**
 * The lesson's story and the exercise's notes, with the shape the exercise
 * makes on the neck — roots in the accent colour, every other note named.
 * A drawer down the right edge of the screen; it stays while playing until
 * closed.
 */

interface AboutPanelProps {
  exercise: Exercise
  /** The lesson intro, shown with the first exercise. */
  intro?: readonly string[]
  onClose: () => void
}

export function AboutPanel({ exercise, intro = [], onClose }: AboutPanelProps) {
  const shape = exerciseShape(exercise)
  const paragraphs = [...intro, ...(exercise.about ?? [])]
  return (
    <aside
      aria-label={`About ${exercise.title}`}
      className="flex h-full flex-col overflow-hidden border-l border-line bg-panel/95 shadow-lg backdrop-blur-md"
      data-about
    >
      <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-3">
        <h3 className="font-display text-base font-semibold tracking-tight text-fg">About this exercise</h3>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          data-tip="Close (I)"
          className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-muted hover:bg-panel-2 hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
        >
          <CloseIcon />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        <figure>
          <Fretboard
            highlights={shape.positions}
            fretRange={shape.fretRange}
            aria-label={`${exercise.title} on the neck, ${shape.positions.length} positions, roots marked`}
          />
          <figcaption className="mt-1 text-center text-xs text-muted">
            The shape on the neck · roots in colour
          </figcaption>
        </figure>
        <div className="mt-5 space-y-3 text-[15px] leading-relaxed text-fg-2">
          {paragraphs.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      </div>
    </aside>
  )
}
