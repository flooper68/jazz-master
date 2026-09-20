import { useCallback, useRef, useState } from 'react'
import type { ChatStep } from '../components/chat/Chat'
import type { LessonKind } from '../server/lesson/lesson'

/**
 * A conversation with the teacher, from the page's side
 * (docs/product/next-session-design.md §10).
 *
 * The Worker keeps no state, so the whole conversation goes up each turn and
 * this hook is where it lives. A turn streams back as server-sent events:
 * sentences as they are written, and each tool as it starts and as it lands,
 * so the player watches the teacher read their history rather than a spinner.
 * The steps belong to the turn they happened in and stay with it.
 *
 * Nothing here touches the practice. When a lesson writes a path, the app's
 * own lists are what change — which is why a finished turn invalidates them
 * through the caller rather than through anything in here.
 */

export interface LessonMessage {
  role: 'user' | 'assistant'
  content: string
  /** What the teacher did while writing this turn; only on assistant turns. */
  steps?: ChatStep[]
}

export interface Lesson {
  messages: readonly LessonMessage[]
  /** The assistant turn being written right now, or null between turns. */
  live: { text: string; steps: ChatStep[] } | null
  thinking: boolean
  error: string | null
  send(text: string): Promise<void>
  reset(): void
}

/** What each tool is called while the teacher is using it, in the player's terms. */
export const DOING: Record<string, string> = {
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

type ServerEvent =
  | { type: 'text'; text: string }
  | { type: 'tool_start'; name: string }
  | { type: 'tool'; name: string; ok: boolean }
  | { type: 'done' }
  | { type: 'error'; message: string }

export function useLesson(kind: LessonKind): Lesson {
  const [messages, setMessages] = useState<LessonMessage[]>([])
  const [live, setLive] = useState<Lesson['live']>(null)
  const [thinking, setThinking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // The turns the server has already seen, so a failed turn does not leave the
  // conversation disagreeing with itself.
  const settled = useRef<LessonMessage[]>([])

  const reset = useCallback(() => {
    settled.current = []
    setMessages([])
    setLive(null)
    setError(null)
    setThinking(false)
  }, [])

  const send = useCallback(
    async (text: string) => {
      const said = text.trim()
      if (said.length === 0 || thinking) return

      const turns = [...settled.current, { role: 'user' as const, content: said }]
      setMessages(turns)
      setLive({ text: '', steps: [] })
      setError(null)
      setThinking(true)

      let answer = ''
      const steps: ChatStep[] = []
      const publish = () => setLive({ text: answer, steps: [...steps] })

      try {
        const response = await fetch('/api/lesson', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ kind, turns: turns.map(({ role, content }) => ({ role, content })) }),
        })
        if (!response.ok || !response.body) {
          setError(
            response.status === 401
              ? 'Sign in again to talk to the teacher.'
              : 'The teacher could not be reached. Try again in a moment.',
          )
          setThinking(false)
          setLive(null)
          return
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        for (;;) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          // SSE frames are separated by a blank line; a partial one waits.
          const frames = buffer.split('\n\n')
          buffer = frames.pop() ?? ''
          for (const frame of frames) {
            const line = frame.split('\n').find((part) => part.startsWith('data: '))
            if (!line) continue
            let event: ServerEvent
            try {
              event = JSON.parse(line.slice(6)) as ServerEvent
            } catch {
              continue
            }
            if (event.type === 'text') {
              answer += (answer.length > 0 ? '\n\n' : '') + event.text
              publish()
            } else if (event.type === 'tool_start') {
              steps.push({ label: DOING[event.name] ?? event.name, state: 'running' })
              publish()
            } else if (event.type === 'tool') {
              // The running step for this tool lands; a start that never arrived gets one now.
              const running = [...steps].reverse().find((step) => step.state === 'running')
              if (running) running.state = event.ok ? 'done' : 'failed'
              else steps.push({ label: DOING[event.name] ?? event.name, state: event.ok ? 'done' : 'failed' })
              publish()
            } else if (event.type === 'error') {
              setError(event.message)
            }
          }
        }
      } catch {
        setError('The lesson was interrupted. Try again in a moment.')
      }

      setThinking(false)
      setLive(null)
      // A step still marked running when the stream ends did not report back.
      for (const step of steps) if (step.state === 'running') step.state = 'failed'
      if (answer.length > 0 || steps.length > 0) {
        const finished = [...turns, { role: 'assistant' as const, content: answer, steps }]
        settled.current = finished
        setMessages(finished)
      }
      // Nothing came back at all: the player's turn stays on screen but is not
      // sent again as history, or the next turn asks the teacher to answer twice.
    },
    [kind, thinking],
  )

  return { messages, live, thinking, error, send, reset }
}
