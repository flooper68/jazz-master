import type { ReactNode } from 'react'
import { HistoryIcon, HomeIcon, LessonIcon, ListIcon } from '../../components/icons'
import type { Exchange, MockGoal, Script } from './mock'

/** The app shell, mocked: enough sidebar to place a prototype in the real frame. */
export function Shell({ current, children, phone = false }: { current: string; children: ReactNode; phone?: boolean }) {
  // The nav as the prototypes propose it: the teacher second, the practice log beside it.
  const nav = [
    { label: 'Home', icon: HomeIcon },
    { label: 'Teacher', icon: LessonIcon },
    { label: 'Practice log', icon: HistoryIcon },
    { label: 'Exercises', icon: ListIcon },
    { label: 'History', icon: HistoryIcon },
  ]
  if (phone) {
    return (
      <div className="mx-auto flex h-[844px] w-[390px] flex-col overflow-hidden rounded-[2.2rem] border-8 border-fg/90 bg-canvas text-fg shadow-2xl">
        <div className="flex-1 overflow-y-auto px-4 pb-20 pt-6">{children}</div>
        <nav className="absolute bottom-0 flex w-[374px] justify-around border-t border-line bg-panel px-2 py-2 text-[10px]" style={{ borderRadius: '0 0 1.7rem 1.7rem' }}>
          {nav.map((item) => (
            <span key={item.label} className={`flex flex-col items-center gap-0.5 ${item.label === current ? 'text-fg' : 'text-muted'}`}>
              <item.icon />
              {item.label}
            </span>
          ))}
        </nav>
      </div>
    )
  }
  return (
    <div className="flex min-h-screen bg-canvas text-fg">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-line px-4 py-6 lg:flex">
        <p className="font-display text-xl font-bold tracking-tight">
          <span className="text-muted">•••</span>
          <span className="text-accent">•</span> count-in
        </p>
        <p className="mt-1 text-xs text-muted">Practice smart.</p>
        <button type="button" className="mt-5 rounded-xl bg-accent px-4 py-3 text-left text-sm font-semibold text-accent-fg">
          ▶ Next session
        </button>
        <ul className="mt-5 space-y-1 text-sm">
          {nav.map((item) => (
            <li key={item.label} className={`flex items-center gap-3 rounded-xl px-3 py-2 ${item.label === current ? 'bg-panel-2 font-medium' : 'text-fg-2'}`}>
              <item.icon />
              {item.label}
            </li>
          ))}
        </ul>
      </aside>
      <main className="min-w-0 flex-1 px-6 py-8 lg:px-10">{children}</main>
    </div>
  )
}

/** One line of the conversation, as the app draws it: the player in a card, the teacher plain. */
export function Bubble({ line, live = false }: { line: Exchange; live?: boolean }) {
  return (
    <li className={line.who === 'you' ? 'ml-auto max-w-[85%] rounded-2xl border border-line bg-panel-2 p-3.5' : 'max-w-[92%]'}>
      {line.who === 'teacher' && line.doing && !live && (
        <ul className="mb-1.5 space-y-0.5 text-[11px] text-muted">
          {line.doing.map((step) => (
            <li key={step}>· {step}</li>
          ))}
        </ul>
      )}
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-fg">
        {line.text}
        {live && <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse bg-accent align-middle" aria-hidden="true" />}
      </p>
    </li>
  )
}

/** The conversation, with the line being typed at the end. */
export function Conversation({ script, exchanges, className = '' }: { script: Script; exchanges: Exchange[]; className?: string }) {
  const next = exchanges[script.shown.length]
  const live = next && script.typing.length > 0 ? { ...next, text: script.typing } : null
  return (
    <ol className={`space-y-3 ${className}`} aria-label="The conversation">
      {script.shown.map((line, index) => (
        <Bubble key={index} line={line} />
      ))}
      {live && (
        <>
          {live.doing && (
            <li className="text-[11px] text-muted">
              {live.doing.map((step) => (
                <span key={step} className="mr-3">
                  · {step}
                </span>
              ))}
            </li>
          )}
          <Bubble line={live} live />
        </>
      )}
    </ol>
  )
}

/** The reply box, inert: prototypes play a script, they do not send. */
export function SayIt({ placeholder = 'Say something…', compact = false }: { placeholder?: string; compact?: boolean }) {
  return (
    <div className={`flex items-end gap-2 ${compact ? '' : 'mt-4'}`}>
      <div className={`flex-1 rounded-xl border border-line bg-panel px-3 py-2 text-sm text-muted ${compact ? 'min-h-[2.5rem]' : 'min-h-[3.25rem]'}`}>{placeholder}</div>
      <button type="button" className="rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-accent-fg opacity-60">
        Say it
      </button>
    </div>
  )
}

/** Stage chips, as the app draws them, with the one that just changed lit. */
export function StageChips({ goal, changedIndex = null }: { goal: MockGoal; changedIndex?: number | null }) {
  return (
    <ol className="flex flex-wrap gap-1.5" aria-label={`Stages of ${goal.title}`}>
      {goal.stages.map((stage, index) => (
        <li
          key={stage.title}
          className={`rounded-lg px-2 py-1 text-xs font-medium tabular-nums transition-all duration-700 ${
            stage.open ? 'bg-accent-soft text-accent-text' : 'bg-panel-2 text-muted'
          } ${changedIndex === index ? 'ring-2 ring-accent' : ''}`}
        >
          {stage.title} · {stage.open ? `${Math.round(stage.solidity * 100)}%` : 'locked'}
        </li>
      ))}
    </ol>
  )
}

/** A solidity bar: how much of a stage is played through at the target. */
export function SolidityBar({ value, open }: { value: number; open: boolean }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-panel-2" aria-hidden="true">
      <div className={`h-full rounded-full transition-all duration-700 ${open ? 'bg-accent' : 'bg-line'}`} style={{ width: `${Math.max(open ? 4 : 0, value * 100)}%` }} />
    </div>
  )
}

export const QUIET = 'rounded-lg border border-line bg-panel px-2.5 py-1 text-xs text-fg-2 hover:border-line-strong'
