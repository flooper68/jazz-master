import type { ReactNode } from 'react'
import { HistoryIcon, HomeIcon, LessonIcon, ListIcon } from '../../components/icons'
import { AssistantTurn, ChatThread, Composer, PlayerTurn } from '../../components/chat/Chat'
import { stepsOf, type Exchange, type MockGoal, type Script } from './mock'

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

/**
 * The conversation, drawn with the app's own chat pieces (components/chat) so
 * what the owner judges here is what the app draws: the teacher's steps stay
 * with their turn, the text streams in place, the thread follows only while
 * the reader is at the bottom.
 */
export function Conversation({ script, exchanges, placeholder = 'Say something…', className = '' }: { script: Script; exchanges: Exchange[]; placeholder?: string; className?: string }) {
  const next = exchanges[script.shown.length]
  return (
    <div className={`flex min-h-0 flex-col ${className}`}>
      <ChatThread follow={[script.shown.length, script.live?.text.length ?? 0, script.live?.steps.length ?? 0]} className="flex-1">
        {script.shown.map((line, index) =>
          line.who === 'you' ? <PlayerTurn key={index} text={line.text} /> : <AssistantTurn key={index} text={line.text} steps={stepsOf(line)} />,
        )}
        {script.live && next && <AssistantTurn text={script.live.text} steps={script.live.steps} streaming thinking />}
      </ChatThread>
      <div className="mt-3">
        <Composer placeholder={placeholder} onSend={() => {}} inert />
      </div>
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
