import { useId } from 'react'
import { LONGEST_NOTE } from '../appData/note'

/**
 * A sentence about the sitting, at the end of it — the one place the user
 * writes rather than taps. Nothing reads it but them: no AI, no scheduler
 * (that is steps 5–6). It is kept because what someone writes at the end of a
 * session is worth more later than anything the numbers could be made to say.
 *
 * Optional, saved as it is left, and clearing it removes it.
 */

interface SessionNoteInputProps {
  value: string
  onChange: (value: string) => void
  /** Left the field: the moment the note is written away. */
  onCommit: () => void
  /** The note could not be saved; the text stands and can be tried again. */
  failed?: boolean
}

export function SessionNoteInput({ value, onChange, onCommit, failed = false }: SessionNoteInputProps) {
  const labelId = useId()
  return (
    <div>
      <label htmlFor={labelId} className="text-sm font-medium text-fg">
        Anything worth remembering? <span className="font-normal text-muted">Optional</span>
      </label>
      <textarea
        id={labelId}
        value={value}
        rows={3}
        maxLength={LONGEST_NOTE}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onCommit}
        placeholder="What clicked, what did not, what to try next time."
        className="mt-2 block w-full resize-y rounded-xl border border-line bg-panel px-3 py-2 text-sm text-fg placeholder:text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
      />
      {failed && (
        <p role="alert" className="mt-1.5 text-sm text-danger-text">
          Your note could not be saved. It is still here — leave the box again to retry.
        </p>
      )}
    </div>
  )
}
