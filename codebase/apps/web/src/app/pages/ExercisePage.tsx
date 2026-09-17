import { useMutation } from '@tanstack/react-query'
import { useNavigate, useParams } from '@tanstack/react-router'
import { useCallback, useRef, useState } from 'react'
import type { ExerciseRun } from '../../appData/run'
import { ExerciseRunner } from '../../components/ExerciseRunner'
import { EXERCISES, type Exercise } from '../../content'
import { useTRPC } from '../trpc'
import NotFoundPage from './NotFoundPage'

const exerciseById = new Map(EXERCISES.map((exercise) => [exercise.id, exercise]))

/** The player page: the exercise named in the URL, its runs saved as they are played. */
export default function ExercisePage() {
  // Loose params so the page also renders inside Storybook's ad hoc router;
  // the route file's loader already turned an unknown id into a 404.
  const { exerciseId } = useParams({ strict: false })
  const exercise = exerciseById.get(exerciseId ?? '')

  if (!exercise) return <NotFoundPage />

  // Keyed on the exercise so an exercise-to-exercise navigation starts afresh.
  return <ExerciseStage key={exercise.id} exercise={exercise} />
}

function ExerciseStage({ exercise }: { exercise: Exercise }) {
  const navigate = useNavigate()
  const trpc = useTRPC()
  const { mutateAsync: saveRun } = useMutation(trpc.runs.save.mutationOptions())
  // The run whose latest save did not land, kept so it can be sent again.
  const [unsaved, setUnsaved] = useState<ExerciseRun | null>(null)
  // A run is saved when it arrives and again when it is rated; serialize the
  // writes so an older snapshot can never land after a newer one. Every write
  // carries the whole run, so a later one also covers an earlier failure.
  const saveQueueRef = useRef(Promise.resolve())
  const save = useCallback(
    (run: ExerciseRun) => {
      saveQueueRef.current = saveQueueRef.current.then(async () => {
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

  // The player is a full-bleed stage: cancel the shell's page padding and
  // take the viewport height below the header.
  return (
    <div className="-mx-4 -my-6 flex h-[calc(100dvh-4.5rem)] min-h-[520px] flex-col px-2 py-2 md:-mx-10 md:-my-10">
      {unsaved && (
        <p role="alert" className="mb-2 px-2 text-sm text-danger-text md:px-8">
          This run was not saved.{' '}
          <button
            type="button"
            onClick={() => save(unsaved)}
            className="cursor-pointer underline underline-offset-2 hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
          >
            Try again
          </button>
        </p>
      )}
      <ExerciseRunner
        exercise={exercise}
        onRunChange={save}
        onExit={() => void navigate({ to: '/' })}
      />
    </div>
  )
}
