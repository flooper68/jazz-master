import { exerciseSource } from '../content'

/**
 * Says where an exercise comes from, wherever one is listed: the pack that
 * ships with the app, or the user's own library. The user's own stand out;
 * the pack's mark stays quiet, because most of what is on the page is pack.
 */
interface SourceTagProps {
  exerciseId: string
  /** Where the pack is the unremarkable default — a history row, the player — mark only the user's own. */
  only?: 'yours'
  className?: string
}

export function SourceTag({ exerciseId, only, className = '' }: SourceTagProps) {
  const yours = exerciseSource(exerciseId) === 'yours'
  if (only === 'yours' && !yours) return null
  return (
    <span
      data-source={yours ? 'yours' : 'pack'}
      className={`inline-block rounded-md px-1.5 py-0.5 align-middle font-sans text-[11px] font-medium whitespace-nowrap ${
        yours ? 'bg-accent/15 text-accent-text' : 'border border-line text-muted'
      } ${className}`}
    >
      {yours ? 'Yours' : 'Built-in'}
    </span>
  )
}
