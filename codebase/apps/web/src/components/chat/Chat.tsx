import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { Markdown } from './Markdown'

/**
 * The conversation with the teacher, as pieces (RES-022):
 *
 * - `ChatThread` — the scroll region. It follows new text while the reader is
 *   at the bottom and steps aside the moment they scroll up to read; a *Newest*
 *   button brings them back. The page never scrolls; the thread does.
 * - `AssistantTurn` — one of the teacher's turns: what it did (the steps),
 *   then what it said, streamed in place. The steps belong to the turn and
 *   never move: they open while the turn works and fold to one line when it is
 *   done, the way a working agent's trace does in any current chat.
 * - `PlayerTurn` — what the player said, in a card.
 * - `Composer` — the box and the button, pinned under the thread.
 *
 * Nothing here knows about lessons, tools or tRPC. The app's `TeacherChat` and
 * the Storybook prototypes both render through these, so what the owner judges
 * in a prototype is what the app draws.
 */

const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg'
/** How near the bottom still counts as "at the bottom" — a line, not a pixel. */
const NEAR_BOTTOM = 48

export interface ChatStep {
  label: string
  state: 'running' | 'done' | 'failed'
}

// ---------------------------------------------------------------- thread

interface ChatThreadProps {
  children: ReactNode
  /** Anything that should re-check the scroll: the message count and the streaming text length. */
  follow: unknown[]
  className?: string
  'aria-label'?: string
}

/**
 * Stick-to-bottom, the way every chat does it now: follow while the reader is
 * within a line of the bottom; the moment they scroll up, stop; a button gets
 * them back. Content growth is watched with a ResizeObserver so a streamed
 * paragraph that reflows still keeps the newest line in view — and never with
 * scrollIntoView, whose smooth animations overlap on every chunk.
 */
export function ChatThread({ children, follow, className = '', 'aria-label': label = 'The conversation' }: ChatThreadProps) {
  const region = useRef<HTMLDivElement>(null)
  const content = useRef<HTMLDivElement>(null)
  const [pinned, setPinned] = useState(true)
  const [behind, setBehind] = useState(false)

  const toBottom = useCallback(() => {
    const el = region.current
    if (el) el.scrollTop = el.scrollHeight
  }, [])

  // The reader's intent, read from where they are.
  const onScroll = useCallback(() => {
    const el = region.current
    if (!el) return
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= NEAR_BOTTOM
    setPinned(atBottom)
    if (atBottom) setBehind(false)
  }, [])

  // New content: follow if pinned, otherwise remember there is something below.
  // `follow` is the caller's list of things that mean "content changed", read as one key.
  const changed = follow.map(String).join('|')
  useLayoutEffect(() => {
    if (pinned) toBottom()
    else setBehind(true)
  }, [changed, pinned, toBottom])

  // A streamed paragraph grows without a message count changing; watch its size.
  useEffect(() => {
    const el = content.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => {
      if (pinned) toBottom()
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [pinned, toBottom])

  return (
    <div className={`relative min-h-0 ${className}`}>
      <div
        ref={region}
        onScroll={onScroll}
        role="log"
        aria-label={label}
        aria-live="polite"
        className="h-full overflow-y-auto overscroll-contain pr-1 [scrollbar-gutter:stable]"
      >
        <div ref={content} className="space-y-5 pb-2">
          {children}
        </div>
      </div>
      {!pinned && behind && (
        <button
          type="button"
          onClick={() => {
            toBottom()
            setPinned(true)
            setBehind(false)
          }}
          className={`absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full border border-line bg-panel px-3 py-1 text-xs font-medium text-fg shadow-md ${FOCUS}`}
        >
          ↓ Newest
        </button>
      )}
    </div>
  )
}

// ---------------------------------------------------------------- steps

/** A small mark for a step's state; text says the rest. */
function StepMark({ state }: { state: ChatStep['state'] }) {
  if (state === 'running') {
    return <span aria-hidden="true" className="inline-block h-3 w-3 shrink-0 animate-spin rounded-full border-[1.5px] border-accent border-t-transparent" />
  }
  return (
    <span aria-hidden="true" className={`inline-block w-3 shrink-0 text-center text-[11px] leading-3 ${state === 'done' ? 'text-accent-text' : 'text-danger-text'}`}>
      {state === 'done' ? '✓' : '×'}
    </span>
  )
}

/**
 * What the teacher did during a turn. Open while any step runs — each on its
 * own line, the running one spinning — and folded to a single line once the
 * turn has spoken, with a disclosure for the reader who wants the detail.
 */
export function Steps({ steps, working }: { steps: readonly ChatStep[]; working: boolean }) {
  const [open, setOpen] = useState(false)
  if (steps.length === 0) return null
  const failed = steps.filter((step) => step.state === 'failed').length
  const expanded = working || open
  const summary = `${steps[steps.length - 1].label}${steps.length > 1 ? ` · ${steps.length} steps` : ''}${failed ? ` · ${failed} failed` : ''}`
  return (
    <div className="mb-2 text-xs text-muted">
      {expanded ? (
        <ul className="space-y-1" aria-label="What the teacher did">
          {steps.map((step, index) => (
            <li key={index} className="flex items-center gap-2">
              <StepMark state={step.state} />
              <span className={step.state === 'running' ? 'text-fg-2' : ''}>{step.label}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {!working && (
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          className={`mt-0.5 flex items-center gap-2 rounded text-left text-muted hover:text-fg-2 ${FOCUS}`}
        >
          {!open && <StepMark state={failed ? 'failed' : 'done'} />}
          <span>{open ? 'Hide what it did' : summary}</span>
        </button>
      )}
    </div>
  )
}

// ---------------------------------------------------------------- turns

interface AssistantTurnProps {
  text: string
  steps?: readonly ChatStep[]
  /** The turn is still being written: a caret at the end, and the steps stay open. */
  streaming?: boolean
  /** Nothing has come back yet — not a step, not a word. */
  thinking?: boolean
}

export function AssistantTurn({ text, steps = [], streaming = false, thinking = false }: AssistantTurnProps) {
  const working = streaming || thinking
  const silent = thinking && text.length === 0 && steps.length === 0
  return (
    <div className="max-w-[92%]">
      <p className="sr-only">The teacher said</p>
      <Steps steps={steps} working={working} />
      {silent ? (
        <p className="text-sm text-muted" role="status">
          <span className="inline-block animate-pulse">Thinking…</span>
        </p>
      ) : text.length > 0 ? (
        <div className="relative">
          <Markdown text={text} />
          {streaming && (
            <span aria-hidden="true" className="ml-0.5 inline-block h-4 w-1.5 -translate-y-px animate-pulse bg-accent align-middle" />
          )}
        </div>
      ) : null}
    </div>
  )
}

export function PlayerTurn({ text }: { text: string }) {
  return (
    <div className="ml-auto max-w-[85%] rounded-2xl border border-line bg-panel-2 px-4 py-3">
      <p className="sr-only">You said</p>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-fg">{text}</p>
    </div>
  )
}

// ---------------------------------------------------------------- composer

interface ComposerProps {
  placeholder: string
  disabled?: boolean
  onSend(text: string): void
  /** Storybook prototypes draw the box without wiring it. */
  inert?: boolean
}

export function Composer({ placeholder, disabled = false, onSend, inert = false }: ComposerProps) {
  const [draft, setDraft] = useState('')
  function submit(event: React.FormEvent) {
    event.preventDefault()
    const text = draft.trim()
    if (text.length === 0 || disabled || inert) return
    setDraft('')
    onSend(text)
  }
  return (
    <form onSubmit={submit} className="flex items-end gap-2 border-t border-line pt-3">
      <label htmlFor="lesson-say" className="sr-only">
        What you want to say
      </label>
      <textarea
        id="lesson-say"
        value={draft}
        readOnly={inert}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) submit(event)
        }}
        rows={1}
        placeholder={placeholder}
        className={`max-h-40 min-h-[2.75rem] flex-1 resize-none rounded-xl border border-line bg-panel px-3 py-2.5 text-sm text-fg placeholder:text-muted ${FOCUS}`}
      />
      <button
        type="submit"
        disabled={disabled || inert || draft.trim().length === 0}
        className={`rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-accent-fg disabled:opacity-40 ${FOCUS}`}
      >
        Say it
      </button>
    </form>
  )
}
