import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import type { LessonKind } from '../../server/lesson/lesson'
import { useLesson } from '../useLesson'

/**
 * The conversation with the teacher (docs/product/next-session-design.md §10),
 * as a column the Teacher page places beside the paths it writes.
 *
 * Which script runs is the page's call, made from what the player already has:
 * no goal means a first lesson, otherwise a check-in. The practice is reachable
 * throughout — a lesson is something you go to, never something you are
 * blocked on.
 */

const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg'
const CARD = 'rounded-2xl border border-line bg-panel'

/** What each tool is called while the teacher is using it, in the player's terms. */
const DOING: Record<string, string> = {
  get_player_bio: 'Remembering you',
  list_player_log: 'Reading past lessons',
  write_player_bio: 'Noting what it learned',
  append_player_log: 'Writing up this lesson',
  get_exercise_state: 'Looking at how it has been going',
  list_runs: 'Reading your practice',
  get_next_session: 'Checking what you would play now',
  list_builtin_exercises: 'Looking through the exercises',
  list_exercises: 'Looking at your own exercises',
  list_goals: 'Reading your goals',
  set_goal: 'Writing your path',
  set_path: 'Changing your path',
  validate_exercise: 'Checking an exercise it wrote',
  create_exercise: 'Adding an exercise for you',
}

export function TeacherChat({ kind, pending }: { kind: LessonKind; pending: boolean }) {
  const queryClient = useQueryClient()
  const lesson = useLesson(kind)
  const [draft, setDraft] = useState('')
  const foot = useRef<HTMLDivElement>(null)
  const said = lesson.messages.length > 0

  // A lesson can write a path or an exercise; the lists the app is showing
  // should agree with it by the time the player looks at them.
  const settled = lesson.messages.length
  useEffect(() => {
    if (!lesson.thinking && settled > 0) void queryClient.invalidateQueries()
  }, [lesson.thinking, settled, queryClient])

  useEffect(() => {
    // Only once there is a conversation to follow: a fresh page should not jump.
    // jsdom has no scrollIntoView, hence the optional call.
    if (lesson.messages.length > 0) foot.current?.scrollIntoView?.({ block: 'end' })
  }, [lesson.streaming, lesson.messages.length, lesson.actions.length])

  function submit(event: React.FormEvent) {
    event.preventDefault()
    const text = draft
    setDraft('')
    void lesson.send(text)
  }

  return (
    <section aria-labelledby="teacher-chat" className="min-w-0">
      <h2 id="teacher-chat" className="sr-only">
        The conversation
      </h2>

      {!said && (
        <div className={`${CARD} p-6`}>
          <p className="font-medium text-fg">
            {pending
              ? 'Looking at what you are working on…'
              : kind === 'first_lesson'
                ? 'What do you want to be able to play?'
                : 'How has practice been going?'}
          </p>
          <p className="mt-1 text-sm text-muted">
            {kind === 'first_lesson'
              ? 'Say it however you like — “comp through Autumn Leaves”, “solo over a blues without running out of ideas”, “get my picking clean at 120”.'
              : 'What is working, what is boring you, anything new you have been playing. It has read your practice already.'}
          </p>
        </div>
      )}

      {said && (
        <ol className="space-y-4" aria-label="The conversation so far">
          {lesson.messages.map((message, index) => (
            <li
              key={index}
              className={message.role === 'user' ? `${CARD} ml-auto max-w-[85%] bg-panel-2 p-4` : 'max-w-[92%] text-fg'}
            >
              <p className="sr-only">{message.role === 'user' ? 'You said' : 'The teacher said'}</p>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
            </li>
          ))}
          {lesson.streaming.length > 0 && (
            <li className="max-w-[92%]">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-fg">{lesson.streaming}</p>
            </li>
          )}
        </ol>
      )}

      {/* What it is doing, while it does it — reading your history is not a spinner. */}
      {lesson.actions.length > 0 && (
        <ul className="mt-4 space-y-1" aria-label="What the teacher is doing">
          {lesson.actions.map((action, index) => (
            <li key={index} className="text-xs text-muted">
              {action.ok ? '· ' : '× '}
              {DOING[action.name] ?? action.name}
            </li>
          ))}
        </ul>
      )}

      {lesson.thinking && lesson.streaming.length === 0 && (
        <p className="mt-4 text-sm text-muted" role="status">
          The teacher is thinking…
        </p>
      )}

      {lesson.error && (
        <p role="alert" className="mt-4 text-sm text-danger-text">
          {lesson.error}
        </p>
      )}

      <form onSubmit={submit} className="mt-5">
        <label htmlFor="lesson-say" className="sr-only">
          What you want to say
        </label>
        <div className="flex items-end gap-2">
          <textarea
            id="lesson-say"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) submit(event)
            }}
            rows={2}
            placeholder={kind === 'first_lesson' ? 'What do you want to play?' : 'How has it been going?'}
            className={`min-h-[3.5rem] flex-1 resize-y rounded-xl border border-line bg-panel px-3 py-2 text-sm text-fg placeholder:text-muted ${FOCUS}`}
          />
          <button
            type="submit"
            disabled={lesson.thinking || draft.trim().length === 0}
            className={`rounded-xl bg-accent px-4 py-3 text-sm font-medium text-accent-fg disabled:opacity-40 ${FOCUS}`}
          >
            Say it
          </button>
        </div>
      </form>

      {said && (
        <button
          type="button"
          onClick={() => {
            lesson.reset()
            setDraft('')
          }}
          className={`mt-3 text-xs text-muted underline-offset-4 hover:underline ${FOCUS}`}
        >
          Start again
        </button>
      )}

      <div ref={foot} />
    </section>
  )
}
