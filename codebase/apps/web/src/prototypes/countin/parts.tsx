import { useEffect, useRef, useState, type ReactNode } from 'react'
import { DEFAULT_BEATS_PER_BAR } from '../../content'
import { Score } from '../../score/Score'
import './countin.css'
import { GOALS, STYLES, type DemoExercise } from './demo'
import type { CountInDemo } from './useCountIn'

/**
 * Shared pieces of the Count-in landing prototypes: the token scope, the mark
 * and lockup, the two buttons, and the practice stage the hero demo plays on.
 * Prototype code — chosen pieces graduate into `components/public`.
 */

const FONTS =
  'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap'

export function CountInShell({ children }: { children: ReactNode }) {
  return (
    <div className="ci min-h-screen bg-canvas text-fg antialiased">
      <link rel="stylesheet" href={FONTS} precedence="default" />
      {children}
    </div>
  )
}

/** Three counts swelling into the downbeat. Sized by its height; 58 × 24. */
export function Mark({ className = 'h-[0.72em] w-[1.74em]', thinking = false }: { className?: string; thinking?: boolean }) {
  return (
    <svg viewBox="4 20 58 24" className={`shrink-0 ${thinking ? 'ci-think' : ''} ${className}`} aria-hidden="true">
      <circle cx="8" cy="32" r="2.5" className="fill-fg" />
      <circle cx="20" cy="32" r="3.5" className="fill-fg" />
      <circle cx="34" cy="32" r="4.5" className="fill-fg" />
      <circle cx="52" cy="32" r="9" className="fill-accent" />
    </svg>
  )
}

export function Wordmark() {
  return (
    <span>
      count<span className="text-accent">-</span>in
    </span>
  )
}

export function Lockup({ className = 'text-xl' }: { className?: string }) {
  return (
    <span className={`ci-display inline-flex items-center gap-[0.36em] font-semibold leading-none whitespace-nowrap ${className}`}>
      <Mark />
      <Wordmark />
    </span>
  )
}

const PILL =
  'inline-flex items-center justify-center gap-2 rounded-md px-5 py-3 text-sm font-semibold leading-none transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-default disabled:opacity-60'

/** The one amber action of a view. */
export function BeatButton({ children, onClick, disabled }: { children: ReactNode; onClick?: () => void; disabled?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={`${PILL} bg-accent text-on-accent hover:bg-accent-hover`}>
      <span className="size-2 rounded-full bg-current" aria-hidden="true" />
      {children}
    </button>
  )
}

export function GhostLink({ children, href }: { children: ReactNode; href: string }) {
  return (
    <a href={href} className={`${PILL} border border-line-strong text-fg hover:bg-panel-2`}>
      {children}
    </a>
  )
}

export function HeaderBar() {
  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
      <Lockup />
      <GhostLink href="#sign-in">Sign in</GhostLink>
    </header>
  )
}

export function FooterBar() {
  return (
    <footer className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-6 text-[13px] text-muted sm:px-8">
      <Lockup className="text-base" />
      <span className="ci-num">count-in.ai · practice smart · free during the beta</span>
    </footer>
  )
}

const COUNT_WORDS = ['one', 'two', 'three', 'four']

function statusLine(demo: CountInDemo, tempoBpm: number): string {
  if (demo.phase === 'counting') return COUNT_WORDS[(demo.count ?? 1) - 1]
  if (demo.phase === 'playing') return "You're in."
  if (demo.phase === 'done') return "That's the set. Want tomorrow's?"
  return `${tempoBpm} bpm · four clicks, then you`
}

function countClass(n: number, demo: CountInDemo): string {
  if (demo.phase === 'counting' && demo.count === n) return 'text-accent ci-land'
  if (demo.phase === 'counting' && demo.count !== null && n < demo.count) return 'text-fg'
  if (demo.phase === 'playing') return 'text-fg'
  return 'text-line-strong'
}

/** The four numerals of the count-in, lit as each click lands. */
export function CountRow({ demo, className = 'text-[clamp(2.25rem,6vw,3.25rem)]', spread = false }: { demo: CountInDemo; className?: string; spread?: boolean }) {
  return (
    <div className={`ci-num flex leading-none font-medium ${spread ? 'justify-between' : 'justify-center gap-[0.8em]'} ${className}`} aria-hidden="true">
      {[1, 2, 3, 4].map((n) => (
        <span key={`${n}-${demo.count === n}`} className={`inline-block ${countClass(n, demo)}`}>
          {n}
        </span>
      ))}
    </div>
  )
}

/** The practice stage: the real tab, the count row, and the one button that starts it. */
export function Stage({ exercise, demo, showCount = true }: { exercise: DemoExercise; demo: CountInDemo; showCount?: boolean }) {
  const running = demo.phase === 'counting' || demo.phase === 'playing'
  return (
    <section aria-label="Try one exercise" className="flex flex-col gap-4 rounded-2xl border border-line bg-panel p-4 sm:p-5">
      <div className="flex items-baseline justify-between gap-3 text-[13px] text-muted">
        <span>{exercise.title}</span>
        <span className="ci-num shrink-0">{exercise.tempoBpm} bpm</span>
      </div>
      {showCount && <CountRow demo={demo} />}
      <Score
        notes={exercise.notes}
        beatsPerBar={DEFAULT_BEATS_PER_BAR}
        keyName={exercise.key}
        view="tab"
        currentIndex={demo.noteIndex}
        loop={null}
        cursorVisible={demo.phase === 'playing'}
        aria-label={exercise.title}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="ci-num text-[13px] text-muted" aria-live="polite">
          {statusLine(demo, exercise.tempoBpm)}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {demo.phase === 'done' && <GhostLink href="#sign-up">Get tomorrow's set</GhostLink>}
          <BeatButton onClick={demo.start} disabled={running}>
            {demo.phase === 'done' ? 'Take it again' : running ? 'Playing' : 'Count me in'}
          </BeatButton>
        </div>
      </div>
    </section>
  )
}

const TENSIONS: readonly { before: string; after: string }[] = [
  { before: 'Deciding what to practice', after: 'An AI builds your plan. Tonight is already chosen.' },
  { before: 'Scrolling for something to play', after: 'One exercise, a click, and a moving note to follow.' },
  { before: 'Wondering if it is working', after: 'Every night you played, on one screen.' },
]

/** The three tensions the product removes, each with its release. */
export function TensionList() {
  return (
    <ul className="grid gap-3">
      {TENSIONS.map((tension) => (
        <li key={tension.before} className="grid grid-cols-[auto_1fr] items-baseline gap-x-3">
          <span className="size-2 translate-y-[-1px] rounded-full bg-accent" aria-hidden="true" />
          <p className="text-[15px] leading-snug text-fg">
            <span className="text-muted line-through decoration-line-strong">{tension.before}</span> {tension.after}
          </p>
        </li>
      ))}
    </ul>
  )
}

const NIGHT: readonly { count: string; title: string; body: string }[] = [
  { count: '1', title: 'Say what you want', body: 'Jazz, your first chords, a blues solo. In your own words, once.' },
  { count: '2', title: 'The plan is built', body: 'A few weeks of small steps, each one an exercise you can play along with.' },
  { count: '3', title: 'Four clicks', body: 'Open it and press one button. The count-in is the last thing we do for you.' },
  { count: 'in', title: 'You play', body: 'Follow the moving note, repeat the tricky bit, move on. Every night you play is kept.' },
]

/** From asking to playing, as the four beats of a count-in. A real sequence, so it is numbered. */
export function NightInFour() {
  return (
    <ol className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
      {NIGHT.map((step) => (
        <li key={step.count} className="flex flex-col gap-3 border-t border-line pt-5">
          <span className={`ci-num text-4xl leading-none font-medium ${step.count === 'in' ? 'text-accent-text' : 'text-fg'}`}>{step.count}</span>
          <h3 className="ci-display text-xl font-semibold">{step.title}</h3>
          <p className="text-[15px] leading-relaxed text-fg-2">{step.body}</p>
        </li>
      ))}
    </ol>
  )
}

const THINKING_MS = 1300
const WEEK_STAGGER_MS = 220

/**
 * The intelligence, shown working: pick something to ask, watch the plan get
 * built, then count into its first exercise. Opens already answered, so
 * the page at rest shows a finished plan rather than an empty box.
 */
export function PlanDemo({ goalIndex, onGoal, onCount, running }: { goalIndex: number; onGoal: (index: number) => void; onCount: () => void; running: boolean }) {
  const goal = GOALS[goalIndex]
  const [thinking, setThinking] = useState(false)
  const [weeksShown, setWeeksShown] = useState(goal.weeks.length)
  const timers = useRef<number[]>([])

  const clear = () => {
    for (const id of timers.current) window.clearTimeout(id)
    timers.current = []
  }
  useEffect(() => clear, [])

  const ask = (index: number) => {
    clear()
    onGoal(index)
    setThinking(true)
    setWeeksShown(0)
    timers.current.push(window.setTimeout(() => setThinking(false), THINKING_MS))
    GOALS[index].weeks.forEach((_, week) => {
      timers.current.push(window.setTimeout(() => setWeeksShown(week + 1), THINKING_MS + (week + 1) * WEEK_STAGGER_MS))
    })
  }

  const ready = !thinking && weeksShown >= goal.weeks.length

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="ci-num text-xs text-muted">Try asking</span>
          {GOALS.map((option, index) => (
            <button
              key={option.ask}
              type="button"
              onClick={() => ask(index)}
              aria-pressed={index === goalIndex}
              className={`rounded-md border px-3.5 py-2 text-[13px] leading-none font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${index === goalIndex ? 'border-transparent bg-cta text-cta-fg' : 'border-line-strong text-fg hover:bg-panel-2'}`}
            >
              {option.ask}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-3 rounded-2xl border border-line bg-panel p-5" aria-live="polite">
          <p className="ml-auto max-w-[85%] rounded-xl bg-panel-2 px-4 py-3 text-[15px] leading-snug">{goal.ask}</p>
          <div className="flex max-w-[92%] items-start gap-3 rounded-xl border border-line px-4 py-3 text-[15px] leading-snug">
            <Mark className="mt-1 h-3 w-[1.8rem]" thinking={thinking} />
            <p className={thinking ? 'text-muted' : 'text-fg'}>{thinking ? 'Building your plan' : goal.reply}</p>
          </div>
        </div>
        <p className="ci-num text-xs leading-relaxed text-muted">Powered by AI. Every exercise it writes is checked to be playable before it reaches you.</p>
      </div>

      <div className={`flex flex-col gap-5 rounded-2xl border border-line bg-panel p-5 transition-opacity duration-300 ${thinking ? 'opacity-40' : 'opacity-100'}`}>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <p className="ci-num text-xs tracking-[0.08em] text-accent-text uppercase">Your plan</p>
            <h3 className="ci-display mt-1 text-2xl font-semibold">{goal.plan}</h3>
          </div>
          <span className="ci-num text-xs text-muted">{goal.weeks.length} weeks · 15 min a night</span>
        </div>
        <ol className="flex flex-col">
          {goal.weeks.map((week, index) => (
            <li
              key={week}
              className={`grid grid-cols-[4.5rem_1fr] items-baseline gap-3 border-t border-line py-2.5 transition-opacity duration-300 ${index < weeksShown ? 'opacity-100' : 'opacity-0'}`}
            >
              <span className="ci-num text-xs text-muted">Week {index + 1}</span>
              <span className="text-[15px] leading-snug">{week}</span>
            </li>
          ))}
        </ol>
        <div className={`flex flex-wrap items-center justify-between gap-3 transition-opacity duration-300 ${ready ? 'opacity-100' : 'opacity-0'}`}>
          <p className="text-[13px] text-muted">First up: {goal.demo.title}</p>
          <BeatButton onClick={onCount} disabled={running || !ready}>
            Count me in
          </BeatButton>
        </div>
      </div>
    </div>
  )
}

const METHOD: readonly { title: string; body: string }[] = [
  { title: 'Slow is fast', body: 'Every exercise starts at a speed you can play cleanly. It goes up a little at a time, every few rounds, so fast arrives without tension.' },
  { title: 'Loop the hard bar', body: 'Mark the bit you keep fumbling and stay there. A small piece, many times, then back into the whole thing.' },
  { title: 'Short, and every night', body: 'Minutes, not hours. Fifteen focused minutes a night moves your hands further than one long Sunday.' },
]

/** The method the player is built around. Principles, not citations — every one names a control that ships. */
export function PracticeMethod() {
  return (
    <ul className="grid gap-8 md:grid-cols-3">
      {METHOD.map((principle) => (
        <li key={principle.title} className="flex flex-col gap-3 border-t border-line pt-5">
          <h3 className="ci-display text-xl font-semibold">{principle.title}</h3>
          <p className="text-[15px] leading-relaxed text-fg-2">{principle.body}</p>
        </li>
      ))}
    </ul>
  )
}

/** One product, any style: the style families the library already speaks. */
export function StyleRow() {
  return (
    <ul className="flex flex-wrap gap-2" aria-label="Styles">
      {STYLES.map((style) => (
        <li key={style} className="rounded-md border border-line px-3.5 py-2 text-[13px] leading-none text-fg-2">
          {style}
        </li>
      ))}
    </ul>
  )
}

/** The closing ask: the lockup at size, and the one amber button. */
export function FinalAsk({ onCount }: { onCount: () => void }) {
  return (
    <div className="flex flex-col items-start gap-6">
      <span className="ci-display flex flex-wrap items-center gap-x-[0.14em] text-[clamp(3rem,10vw,7.5rem)] leading-none font-semibold">
        count
        <Mark className="mt-[0.12em] h-[0.5em] w-[1.21em]" />
        in
      </span>
      <div className="flex flex-wrap items-center gap-3">
        <BeatButton onClick={onCount}>Count me in</BeatButton>
        <span className="ci-num text-[13px] text-muted">free during the beta</span>
      </div>
    </div>
  )
}
