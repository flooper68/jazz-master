import { exerciseShape, type Exercise } from '../content'
import { Fretboard } from './Fretboard'

/**
 * The exercise at a glance: the shape it makes on the neck, scaled to fit a
 * fixed box. Decorative beside a title that already names the exercise.
 */
export function ExerciseThumb({ exercise, className = 'h-28' }: { exercise: Exercise; className?: string }) {
  const shape = exerciseShape(exercise)
  return (
    // The svg is taken out of flow so the box alone sets the size; it then
    // letterboxes itself inside (viewBox, xMidYMid meet).
    <div aria-hidden="true" className={`relative overflow-hidden rounded-xl bg-panel-2 ${className}`}>
      <Fretboard
        highlights={shape.positions}
        fretRange={shape.fretRange}
        className="absolute inset-x-3 inset-y-2 h-[calc(100%-1rem)] w-[calc(100%-1.5rem)]"
      />
    </div>
  )
}
