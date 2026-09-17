import { useMutation } from '@tanstack/react-query'
import { useCallback, useRef, useState } from 'react'
import type { ExerciseRun } from '../appData/run'
import { useTRPC } from './trpc'

/**
 * Saving runs from a player page. A run is saved when it arrives and again
 * when it is rated; the writes are serialized so an older snapshot can never
 * land after a newer one. Every write carries the whole run, so a later one
 * also covers an earlier failure.
 */
export function useRunSaver() {
  const trpc = useTRPC()
  const { mutateAsync: saveRun } = useMutation(trpc.runs.save.mutationOptions())
  // The run whose latest save did not land, kept so it can be sent again.
  const [unsaved, setUnsaved] = useState<ExerciseRun | null>(null)
  const queueRef = useRef(Promise.resolve())
  const save = useCallback(
    (run: ExerciseRun) => {
      queueRef.current = queueRef.current.then(async () => {
        try {
          const result = await saveRun(run)
          setUnsaved(result.status === 'ok' ? null : run)
        } catch {
          setUnsaved(run)
        }
      })
    },
    [saveRun],
  )
  return { save, unsaved }
}

/** Says a run was not saved, and offers to send it again. */
export function UnsavedRunAlert({ unsaved, onRetry }: { unsaved: ExerciseRun | null; onRetry: (run: ExerciseRun) => void }) {
  if (!unsaved) return null
  return (
    <p role="alert" className="mb-2 px-2 text-sm text-danger-text md:px-8">
      This run was not saved.{' '}
      <button
        type="button"
        onClick={() => onRetry(unsaved)}
        className="cursor-pointer underline underline-offset-2 hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
      >
        Try again
      </button>
    </p>
  )
}

/** The player is a full-bleed stage: cancel the shell's page padding and take the viewport — below the phone header, beside the sidebar from md up. */
export const STAGE_FRAME =
  '-mx-4 -my-6 flex h-[calc(100dvh-4.5rem)] min-h-[520px] flex-col px-2 py-2 md:-mx-8 md:-my-7 md:h-dvh'
