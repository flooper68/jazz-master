import { useCallback, useRef, useState } from 'react'
import type { LessonKind } from '../server/lesson/lesson'

/**
 * A conversation with the teacher, from the page's side
 * (docs/product/next-session-design.md §10).
 *
 * The Worker keeps no state, so the whole conversation goes up each turn and
 * this hook is where it lives. A turn streams back as server-sent events:
 * sentences as they are written, and a line for each tool the teacher used, so
 * the player watches it read their history rather than a spinner.
 *
 * Nothing here touches the practice. When a lesson writes a path, the app's
 * own lists are what change — which is why a finished turn invalidates them
 * through the caller rather than through anything in here.
 */

export interface LessonMessage {
  role: 'user' | 'assistant'
  content: string
}

/** What the teacher did while answering, in the order it did it. */
export interface LessonAction {
  name: string
  ok: boolean
}

export interface Lesson {
  messages: readonly LessonMessage[]
  /** The assistant turn being written right now, or '' between turns. */
  streaming: string
  actions: readonly LessonAction[]
  thinking: boolean
  error: string | null
  send(text: string): Promise<void>
  reset(): void
}

type ServerEvent =
  | { type: 'text'; text: string }
  | { type: 'tool'; name: string; ok: boolean }
  | { type: 'done' }
  | { type: 'error'; message: string }

export function useLesson(kind: LessonKind): Lesson {
  const [messages, setMessages] = useState<LessonMessage[]>([])
  const [streaming, setStreaming] = useState('')
  const [actions, setActions] = useState<LessonAction[]>([])
  const [thinking, setThinking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // The turns the server has already seen, so a failed turn does not leave the
  // conversation disagreeing with itself.
  const settled = useRef<LessonMessage[]>([])

  const reset = useCallback(() => {
    settled.current = []
    setMessages([])
    setStreaming('')
    setActions([])
    setError(null)
    setThinking(false)
  }, [])

  const send = useCallback(
    async (text: string) => {
      const said = text.trim()
      if (said.length === 0 || thinking) return

      const turns = [...settled.current, { role: 'user' as const, content: said }]
      setMessages(turns)
      setStreaming('')
      setActions([])
      setError(null)
      setThinking(true)

      let answer = ''
      try {
        const response = await fetch('/api/lesson', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ kind, turns }),
        })
        if (!response.ok || !response.body) {
          setError(
            response.status === 401
              ? 'Sign in again to talk to the teacher.'
              : 'The teacher could not be reached. Try again in a moment.',
          )
          setThinking(false)
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
              setStreaming(answer)
            } else if (event.type === 'tool') {
              setActions((before) => [...before, { name: event.name, ok: event.ok }])
            } else if (event.type === 'error') {
              setError(event.message)
            }
          }
        }
      } catch {
        setError('The lesson was interrupted. Try again in a moment.')
      }

      setThinking(false)
      setStreaming('')
      if (answer.length > 0) {
        const finished = [...turns, { role: 'assistant' as const, content: answer }]
        settled.current = finished
        setMessages(finished)
      } else {
        // Nothing came back: keep the player's turn on screen but do not send it
        // again as history, or the next turn asks the teacher to answer twice.
        settled.current = settled.current.length > 0 ? settled.current : []
      }
    },
    [kind, thinking],
  )

  return { messages, streaming, actions, thinking, error, send, reset }
}
