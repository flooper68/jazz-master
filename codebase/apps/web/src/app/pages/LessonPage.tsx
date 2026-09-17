import { useMutation } from '@tanstack/react-query'
import { useNavigate, useParams } from '@tanstack/react-router'
import { useCallback, useRef, useState } from 'react'
import type { PracticeSession } from '../../appData/session'
import { PracticeRunner } from '../../components/PracticeRunner'
import { LESSONS, type Lesson } from '../../content'
import { useTRPC } from '../trpc'
import NotFoundPage from './NotFoundPage'

const lessonById = new Map(LESSONS.map((lesson) => [lesson.id, lesson]))

/** The lesson player page: one run of the lesson named in the URL. */
export default function LessonPage() {
  // Loose params so the page also renders inside Storybook's ad hoc router;
  // the route file's loader already turned an unknown id into a 404.
  const { lessonId } = useParams({ strict: false })
  const lesson = lessonById.get(lessonId ?? '')

  if (!lesson) return <NotFoundPage />

  // Keyed on the lesson so a lesson-to-lesson navigation starts a fresh run
  // (new session identity, new reducer) instead of grading the old one.
  return <LessonRun key={lesson.id} lesson={lesson} />
}

function LessonRun({ lesson }: { lesson: Lesson }) {
  const navigate = useNavigate()
  const trpc = useTRPC()
  const { mutateAsync: saveSession } = useMutation(
    trpc.sessions.upsert.mutationOptions(),
  )
  const [saveFailed, setSaveFailed] = useState(false)
  // The run's identity is minted once, when the run mounts — not in render.
  const [run] = useState(() => ({
    sessionId: crypto.randomUUID(),
    startedAt: Date.now(),
  }))
  // Every finished exercise upserts the same record; serialize the writes so
  // an older snapshot can never land after a newer one. Every write carries
  // the whole record, so a failed save is covered by the next one.
  const saveQueueRef = useRef(Promise.resolve())
  const saveSessionProgress = useCallback(
    (session: PracticeSession) => {
      saveQueueRef.current = saveQueueRef.current.then(async () => {
        try {
          const result = await saveSession(session)
          setSaveFailed(result.status !== 'ok')
        } catch {
          setSaveFailed(true)
        }
      })
      return saveQueueRef.current
    },
    [saveSession],
  )

  // The player is a full-bleed stage: cancel the shell's page padding and
  // take the viewport height below the header.
  return (
    <div className="-mx-4 -my-6 flex h-[calc(100dvh-4.5rem)] min-h-[520px] flex-col px-2 py-2 md:-mx-10 md:-my-10">
      {saveFailed && (
        <p role="alert" className="mb-3 text-sm text-danger-text">
          The last save failed. Your progress is sent again with the next exercise.
        </p>
      )}
      <PracticeRunner
        lesson={lesson}
        sessionId={run.sessionId}
        startedAt={run.startedAt}
        onSessionChange={saveSessionProgress}
        onExit={() => void navigate({ to: '/' })}
      />
    </div>
  )
}
