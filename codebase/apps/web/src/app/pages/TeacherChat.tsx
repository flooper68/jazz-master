import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { AssistantTurn, ChatThread, Composer, PlayerTurn } from '../../components/chat/Chat'
import type { LessonKind } from '../../server/lesson/lesson'
import { useLesson } from '../useLesson'

/**
 * The conversation with the teacher (docs/product/next-session-design.md §10),
 * as a column the Teacher page places beside the paths it writes.
 *
 * Drawn with the shared chat pieces (components/chat, RES-022): the thread
 * scrolls itself and follows the newest line only while the reader is there;
 * the teacher's steps belong to the turn they happened in; the composer stays
 * put under the thread. The page never jumps.
 *
 * Which script runs is the page's call, made from what the player already has:
 * no goal means a first lesson, otherwise a check-in. The practice is reachable
 * throughout — a lesson is something you go to, never something you are
 * blocked on.
 */

const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg'

export function TeacherChat({ kind, pending }: { kind: LessonKind; pending: boolean }) {
  const queryClient = useQueryClient()
  const lesson = useLesson(kind)
  const said = lesson.messages.length > 0

  // A lesson can write a path or an exercise; the lists the app is showing
  // should agree with it by the time the player looks at them.
  const settled = lesson.messages.length
  useEffect(() => {
    if (!lesson.thinking && settled > 0) void queryClient.invalidateQueries()
  }, [lesson.thinking, settled, queryClient])

  return (
    <section aria-labelledby="teacher-chat" className="flex min-h-[24rem] min-w-0 flex-col lg:h-[calc(100dvh-13rem)]">
      <h2 id="teacher-chat" className="sr-only">
        The conversation
      </h2>

      <ChatThread follow={[lesson.messages.length, lesson.live?.text.length ?? 0, lesson.live?.steps.length ?? 0]} className="flex-1">
        {!said && (
          <div className="rounded-2xl border border-line bg-panel p-6">
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

        {lesson.messages.map((message, index) =>
          message.role === 'user' ? (
            <PlayerTurn key={index} text={message.content} />
          ) : (
            <AssistantTurn key={index} text={message.content} steps={message.steps} />
          ),
        )}
        {lesson.live && <AssistantTurn text={lesson.live.text} steps={lesson.live.steps} streaming thinking={lesson.thinking} />}

        {lesson.error && (
          <p role="alert" className="text-sm text-danger-text">
            {lesson.error}
          </p>
        )}
      </ChatThread>

      <div className="mt-3">
        <Composer
          placeholder={kind === 'first_lesson' ? 'What do you want to play?' : 'How has it been going?'}
          disabled={lesson.thinking}
          onSend={(text) => void lesson.send(text)}
        />
        {said && (
          <button type="button" onClick={lesson.reset} className={`mt-2 text-xs text-muted underline-offset-4 hover:underline ${FOCUS}`}>
            Start again
          </button>
        )}
      </div>
    </section>
  )
}
