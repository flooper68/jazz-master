import { useEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from 'react'
import { DEFAULT_BEATS_PER_BAR } from '../../../content'
import { Score } from '../../../score/Score'
import { GOALS, STYLES } from './demo'
import { Lockup } from '../../Brand'
import { Button, ButtonLink } from '../../ui/Primitives'
import './downbeat.css'
import type { JoinWaitlist } from './joinWaitlist'
import { useCountIn } from './useCountIn'
import { WaitlistForm } from './WaitlistForm'

/**
 * The public landing page. The brand's one shape is the interaction: the amber dot of the
 * mark is the button, and on the downbeat it opens to fill the screen and
 * becomes the stage. Below it the page is four screens — simple, easy,
 * effective, frictionless — with almost no boxes: strings, giant numerals,
 * one amber thing per screen.
 */

/** True once the element has scrolled into view (and stays true). */
function useInView<T extends Element>(): [RefObject<T | null>, boolean] {
  const ref = useRef<T | null>(null)
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    const node = ref.current
    if (!node || typeof IntersectionObserver === 'undefined') {
      setSeen(true)
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setSeen(true)
          observer.disconnect()
        }
      },
      { threshold: 0.2 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])
  return [ref, seen]
}

function Reveal({ children, className = '', delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const [ref, seen] = useInView<HTMLDivElement>()
  return (
    <div ref={ref} data-in={seen} className={`ci-reveal ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  )
}

const STRING_YS = [14, 28, 42, 56, 70, 84]

/** Six strings across the whole screen, behind the mark; one is plucked on every beat. */
function Strings({ beat }: { beat: number }) {
  const plucked = beat % STRING_YS.length
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="pointer-events-none absolute top-1/2 left-1/2 h-[calc(var(--u)*27)] w-screen -translate-x-1/2 -translate-y-1/2" aria-hidden="true">
      {STRING_YS.map((y, index) => (
        <path
          key={index === plucked ? `${index}-${beat}` : index}
          d={`M0 ${y} Q50 ${y - 9} 100 ${y}`}
          fill="none"
          strokeWidth={index >= 4 ? 1.4 : 1}
          vectorEffect="non-scaling-stroke"
          className={`ci-string ${index === plucked && beat > 0 ? 'ci-pluck' : ''}`}
        />
      ))}
    </svg>
  )
}

const UNIT = { '--u': 'calc(min(84vw, 54rem) / 58)' } as CSSProperties
const DOTS = [
  { size: 5, gap: 6 },
  { size: 7, gap: 6 },
  { size: 9, gap: 4.5 },
]

/** The mark at the size of the screen. Its amber dot is the button. */
function HeroMark({ pulse, beat, onCount, disabled, buttonRef }: { pulse: number | null; beat: number; onCount: () => void; disabled: boolean; buttonRef: RefObject<HTMLButtonElement | null> }) {
  return (
    <div className="relative flex items-center" style={UNIT}>
      <Strings beat={beat} />
      {DOTS.map((dot, index) => (
        <span
          key={index}
          className={`relative block shrink-0 rounded-full transition-colors duration-300 ${pulse === index + 1 ? 'ci-land-big bg-accent' : 'bg-fg'}`}
          style={{ width: `calc(var(--u) * ${dot.size})`, height: `calc(var(--u) * ${dot.size})`, marginRight: `calc(var(--u) * ${dot.gap})` }}
          aria-hidden="true"
        />
      ))}
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={onCount}
        className={`ci-display relative shrink-0 rounded-full bg-accent text-[clamp(0.8rem,1.9vw,1.4rem)] leading-tight font-semibold text-on-accent transition-transform duration-300 hover:scale-[1.04] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent disabled:cursor-default ${pulse === 4 ? 'ci-land-big' : ''}`}
        style={{ width: 'calc(var(--u) * 18)', height: 'calc(var(--u) * 18)' }}
      >
        Count
        <br />
        me in
      </button>
    </div>
  )
}

function Numeral({ children, amber = false }: { children: ReactNode; amber?: boolean }) {
  return (
    <span className={`ci-num block text-[clamp(7rem,20vw,17rem)] leading-[0.8] font-medium tracking-[-0.06em] select-none ${amber ? 'text-accent' : 'ci-outline'}`} aria-hidden="true">
      {children}
    </span>
  )
}

function Beat({ numeral, word, children }: { numeral: string; word: string; children: ReactNode }) {
  return (
    <section className="mx-auto grid min-h-[92vh] w-full max-w-6xl content-center gap-x-12 gap-y-8 px-5 py-24 sm:px-8 lg:grid-cols-[minmax(0,0.42fr)_minmax(0,1fr)]">
      <Reveal className="flex flex-col gap-4">
        <Numeral>{numeral}</Numeral>
        <p className="ci-num text-sm tracking-[0.14em] text-accent-text uppercase">{word}</p>
      </Reveal>
      <div className="flex flex-col gap-8">{children}</div>
    </section>
  )
}

const TYPE_MS = 42

/** The ask, typed at display size. */
function TypedAsk({ text, run }: { text: string; run: number }) {
  const [shown, setShown] = useState(text.length)
  useEffect(() => {
    if (run === 0) return
    setShown(0)
    const id = window.setInterval(() => setShown((n) => (n >= text.length ? n : n + 1)), TYPE_MS)
    return () => window.clearInterval(id)
  }, [run, text])
  return (
    <p className="ci-display ci-caret min-h-[2.1em] text-[clamp(2.25rem,6.2vw,5.25rem)] leading-[1.02] font-semibold text-balance" aria-label={text}>
      {text.slice(0, shown)}
    </p>
  )
}

const REVIEWS = [
  { x: 40, label: 'day 1' },
  { x: 110, label: 'day 3' },
  { x: 215, label: 'day 7' },
  { x: 370, label: 'day 16' },
  { x: 560, label: 'day 35' },
]
const CURVE_TOP = 28
const CURVE_DROP = 132
/** How far memory falls before each repeat: less every time, even as the gaps grow. */
const FADE = [0.62, 0.5, 0.4, 0.32]

/** Memory fading and being brought back: the curve the repeats are timed against. */
function memoryPath(): string {
  let d = `M${REVIEWS[0].x} ${CURVE_TOP}`
  FADE.forEach((fade, index) => {
    const from = REVIEWS[index].x
    const to = REVIEWS[index + 1].x
    for (let step = 1; step <= 24; step++) {
      const t = step / 24
      const y = CURVE_TOP + (CURVE_DROP * fade * (1 - Math.exp(-3 * t))) / (1 - Math.exp(-3))
      d += ` L${(from + (to - from) * t).toFixed(1)} ${y.toFixed(1)}`
    }
    d += ` L${to} ${CURVE_TOP}`
  })
  return d
}
const MEMORY_PATH = memoryPath()
const FORGOTTEN_PATH = `M${REVIEWS[0].x} ${CURVE_TOP} C120 150 260 176 590 184`

/** Repeats at widening gaps, each one just before the thing would have slipped away. */
function SpacingCurve() {
  return (
    <svg viewBox="0 0 600 226" className="h-auto w-full" role="img" aria-label="Memory fades after each practice, and each repeat comes later than the last: day 1, 3, 7, 16 and 35">
      <line x1="20" y1="190" x2="590" y2="190" className="stroke-line-strong" strokeWidth="1" />
      <path d={FORGOTTEN_PATH} pathLength={1} fill="none" strokeWidth="1.2" strokeDasharray="0.012 0.012" className="stroke-muted" opacity="0.7" />
      <path d={MEMORY_PATH} pathLength={1} fill="none" strokeWidth="2" strokeLinejoin="round" className="ci-draw stroke-fg" />
      {REVIEWS.map((review, index) => (
        <g key={review.label}>
          <line x1={review.x} y1={CURVE_TOP} x2={review.x} y2="190" className="stroke-line" strokeWidth="1" />
          <circle cx={review.x} cy={CURVE_TOP} r={3.5 + index * 1.4} className={index === REVIEWS.length - 1 ? 'fill-accent' : 'fill-fg'} />
          <text x={review.x} y="212" textAnchor="middle" className="ci-num fill-muted text-[12px]">
            {review.label}
          </text>
        </g>
      ))}
      <text x="590" y="176" textAnchor="end" className="ci-num fill-muted text-[11px]">
        without repeats
      </text>
    </svg>
  )
}

const TAKE = [0.3, 0.55, 0.8, 0.5, 0.35, 0.7, 0.95, 0.6, 0.4, 0.65, 0.85, 0.45, 0.3, 0.6, 0.9, 0.7, 0.5, 0.75, 1, 0.65, 0.4, 0.55, 0.8, 0.5, 0.35, 0.6, 0.85, 0.55, 0.3, 0.5, 0.75, 0.45, 0.6, 0.9, 0.7, 0.4]
/** The stretch of the take the feedback is about. */
const RUSHED = { from: 17, to: 23 }

/** A take, heard: bars breathing, the rushed stretch in amber. */
function Take() {
  return (
    <div className="ci-wave flex h-24 items-center gap-[3px]" aria-hidden="true">
      {TAKE.map((height, index) => (
        <span
          key={index}
          className={`block w-full rounded-[1px] ${index >= RUSHED.from && index <= RUSHED.to ? 'bg-accent' : 'bg-fg'}`}
          style={{ height: `${height * 100}%`, animationDelay: `${(index % 9) * -160}ms` }}
        />
      ))}
    </div>
  )
}

/** One thing the AI does for you: a hairline, a title, a sentence, and something to look at. */
function Does({ title, body, children, delay = 0, className = '' }: { title: string; body: string; children: ReactNode; delay?: number; className?: string }) {
  return (
    <Reveal delay={delay} className={`relative flex flex-col gap-5 pt-6 ${className}`}>
      <span className="ci-rule absolute inset-x-0 top-0 h-px bg-line-strong" />
      <div className="flex flex-col gap-2">
        <h3 className="ci-display text-2xl font-semibold">{title}</h3>
        <p className="max-w-[48ch] text-[15px] leading-relaxed text-fg-2">{body}</p>
      </div>
      {children}
    </Reveal>
  )
}

function Nudge({ when, text }: { when: string; text: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-line bg-panel px-4 py-3">
      <span className="mt-1.5 size-2.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
      <div className="flex flex-col gap-0.5">
        <span className="ci-num text-xs text-muted">{when}</span>
        <span className="text-[15px] leading-snug">{text}</span>
      </div>
    </div>
  )
}

export function LandingDownbeat({ onJoin }: { onJoin?: JoinWaitlist }) {
  const [goalIndex, setGoalIndex] = useState(0)
  const [typeRun, setTypeRun] = useState(0)
  const goal = GOALS[goalIndex]
  const demo = useCountIn(goal.demo.notes, goal.demo.tempoBpm)
  const running = demo.phase === 'counting' || demo.phase === 'playing'
  const open = demo.phase === 'playing' || demo.phase === 'done'

  const heroRef = useRef<HTMLElement | null>(null)
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const [origin, setOrigin] = useState<CSSProperties>({})

  // Slow ambient time while nothing is happening: one beat a second.
  const [ambient, setAmbient] = useState(0)
  useEffect(() => {
    if (demo.phase !== 'idle' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = window.setInterval(() => setAmbient((n) => n + 1), 1000)
    return () => window.clearInterval(id)
  }, [demo.phase])
  const pulse = demo.phase === 'counting' ? demo.count : demo.phase === 'idle' && ambient > 0 ? ((ambient - 1) % 4) + 1 : null
  const stringBeat = demo.phase === 'counting' ? 100 + (demo.count ?? 0) : ambient

  // The self-playing tab of screen three.
  const [tabRef, tabSeen] = useInView<HTMLDivElement>()
  const [tabIndex, setTabIndex] = useState(0)
  useEffect(() => {
    if (!tabSeen || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = window.setInterval(() => setTabIndex((n) => (n + 1) % goal.demo.notes.length), 330)
    return () => window.clearInterval(id)
  }, [tabSeen, goal])

  const count = () => {
    const hero = heroRef.current
    const button = buttonRef.current
    if (hero && button) {
      const from = button.getBoundingClientRect()
      const within = hero.getBoundingClientRect()
      setOrigin({ '--x': `${from.left + from.width / 2 - within.left}px`, '--y': `${from.top + from.height / 2 - within.top}px` } as CSSProperties)
    }
    hero?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    demo.start()
  }

  const chooseGoal = (index: number) => {
    demo.reset()
    setGoalIndex(index)
    setTypeRun((n) => n + 1)
  }

  return (
    <div className="min-h-screen bg-canvas text-fg antialiased">
      <section ref={heroRef} className="relative flex min-h-screen flex-col overflow-hidden">
        <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <span className="flex items-center gap-3">
            <Lockup />
            <span className="ci-num rounded-sm border border-line-strong px-1.5 py-1 text-[10px] leading-none tracking-[0.14em] text-muted uppercase">Beta</span>
          </span>
          <nav className="flex items-center gap-2" aria-label="Account">
            <ButtonLink href="/sign-in" variant="quiet" size="lg">
              Sign in
            </ButtonLink>
            <ButtonLink href="#beta" size="lg">
              Join the beta
            </ButtonLink>
          </nav>
        </header>

        <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-[7vh] px-5 pb-8 text-center">
          <p className="ci-num text-xs tracking-[0.14em] text-accent-text uppercase">Frictionless music practice · powered by AI</p>
          <HeroMark pulse={pulse} beat={stringBeat} onCount={count} disabled={running} buttonRef={buttonRef} />
          <div className="flex flex-col items-center gap-5">
            <h1 className="ci-display text-[clamp(3.25rem,10vw,8.5rem)] leading-[0.9] font-semibold text-balance">Practice smart.</h1>
            <p className="max-w-[46ch] text-lg leading-relaxed text-fg-2">
              Describe your goal. Get a plan made for you. Five minutes free? You'll always practice the right thing.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-3">
              <ButtonLink href="#beta" size="lg">
                Join the beta
              </ButtonLink>
              <ButtonLink href="/sign-in" variant="link" className="text-sm">
                Already in the beta? Sign in
              </ButtonLink>
            </div>
          </div>
        </div>
        <p className="ci-num relative z-10 pb-6 text-center text-xs tracking-[0.14em] text-muted uppercase">Free during the beta · or press the amber dot and try it first</p>

        <div className="ci-wipe absolute inset-0 z-20 bg-accent" data-open={open} style={origin} aria-hidden="true" />
        <div className="ci-wipe ci-wipe-late absolute inset-0 z-30 flex flex-col bg-canvas" data-open={open} style={origin} aria-hidden={!open}>
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
            <Lockup />
            <Button variant="link" onClick={demo.reset} tabIndex={open ? 0 : -1} className="text-sm">
              Close
            </Button>
          </div>
          <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center gap-8 px-5 pb-16 sm:px-8">
            <div className="flex items-baseline justify-between gap-3">
              <p className="ci-display text-[clamp(2rem,5vw,4rem)] leading-none font-semibold">{demo.phase === 'done' ? "That's the set." : "You're in."}</p>
              <p className="ci-num text-sm text-muted">
                {goal.demo.title} · {goal.demo.tempoBpm} bpm
              </p>
            </div>
            <Score
              notes={goal.demo.notes}
              beatsPerBar={DEFAULT_BEATS_PER_BAR}
              keyName={goal.demo.key}
              view="tab"
              zoom={1.25}
              currentIndex={demo.noteIndex}
              loop={null}
              cursorVisible={demo.phase === 'playing'}
              aria-label={goal.demo.title}
            />
            <div className={`flex flex-wrap items-center gap-3 transition-opacity duration-500 ${demo.phase === 'done' ? 'opacity-100' : 'opacity-0'}`}>
              <ButtonLink href="#beta" variant="accent" size="lg" onClick={demo.reset} tabIndex={demo.phase === 'done' ? 0 : -1}>
                Join the beta and get my plan
              </ButtonLink>
              <Button variant="secondary" size="lg" onClick={count} tabIndex={demo.phase === 'done' ? 0 : -1}>
                Take it again
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Beat numeral="1" word="Simple">
        <Reveal className="flex flex-col gap-6">
          <p className="text-lg text-fg-2">No forms, no levels to pick, no library to dig through. One sentence:</p>
          <TypedAsk text={goal.ask} run={typeRun} />
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[15px]">
            <span className="ci-num text-xs tracking-[0.1em] text-muted uppercase">or say</span>
            {GOALS.map((option, index) =>
              index === goalIndex ? null : (
                <Button key={option.ask} variant="link" onClick={() => chooseGoal(index)} className="text-[15px]">
                  {option.ask}
                </Button>
              ),
            )}
          </div>
        </Reveal>
      </Beat>

      <Beat numeral="2" word="Easy">
        <Reveal className="flex flex-col gap-3">
          <h2 className="ci-display text-[clamp(2rem,4.6vw,3.75rem)] leading-[1] font-semibold text-balance">AI builds the plan. You never decide what to practice again.</h2>
          <p className="max-w-[52ch] text-lg leading-relaxed text-fg-2">{goal.reply}</p>
        </Reveal>
        <ol key={goal.plan} className="flex flex-col">
          {goal.weeks.map((week, index) => (
            <li key={week}>
              <Reveal delay={index * 140} className="relative grid grid-cols-[5.5rem_1fr] items-baseline gap-4 py-5">
                <span className="ci-rule absolute inset-x-0 top-0 h-px bg-line-strong" />
                <span className="ci-num text-sm text-muted">Week {index + 1}</span>
                <span className="ci-display text-[clamp(1.25rem,2.4vw,1.75rem)] leading-snug font-medium">{week}</span>
              </Reveal>
            </li>
          ))}
        </ol>
      </Beat>

      <Beat numeral="3" word="Effective">
        <Reveal className="flex flex-col gap-3">
          <h2 className="ci-display text-[clamp(2rem,4.6vw,3.75rem)] leading-[1] font-semibold text-balance">A coach that remembers everything, so you do not have to.</h2>
          <p className="max-w-[52ch] text-lg leading-relaxed text-fg-2">It guides every step, listens to how it went, and uses the research on how memory works to decide what comes back, and when.</p>
        </Reveal>

        <Does title="Guides you" body="Every step is something you play along with: a click, and a moving note to follow. No reading ahead, no guessing the rhythm.">
          <div ref={tabRef}>
            <Score
              notes={goal.demo.notes}
              beatsPerBar={DEFAULT_BEATS_PER_BAR}
              keyName={goal.demo.key}
              view="tab"
              currentIndex={tabIndex % goal.demo.notes.length}
              loop={null}
              cursorVisible
              aria-label={`${goal.demo.title}, playing itself`}
            />
          </div>
        </Does>

        <Does title="Repeats at the right moment" body="Things fade unless they come back, and the best time to bring them back is just before they slip. The gaps get longer every time. You never track any of it.">
          <SpacingCurve />
        </Does>

        <div className="grid gap-x-10 gap-y-8 md:grid-cols-2">
          <Does title="Listens to you play" body="It hears your take and notices what you cannot while you are busy playing: a rushed bar, a note that did not ring.">
            <Take />
            <p className="text-[15px] leading-snug">
              <span className="text-accent-text">Bar 3 rushed a little.</span> Tomorrow starts there, slower.
            </p>
          </Does>
          <Does title="Reminds you" body="A nudge at the time you actually practice, with what is waiting and how long it takes. Miss a night and the plan simply moves." delay={140}>
            <div className="flex flex-col gap-2">
              <Nudge when="Tonight · 9:00 pm" text="Your next step is ready. 12 minutes." />
              <Nudge when="Thursday" text="Time to bring back last week's chords. 5 minutes." />
            </div>
          </Does>
        </div>
      </Beat>

      <div className="overflow-hidden border-y border-line py-6" aria-hidden="true">
        <div className="ci-marquee ci-display flex w-max gap-10 text-[clamp(2.5rem,7vw,5.5rem)] leading-none font-semibold whitespace-nowrap">
          {[...STYLES, ...STYLES].map((style, index) => (
            <span key={`${style}-${index}`} className={index % 3 === 0 ? 'text-fg' : 'ci-outline'}>
              {style}
            </span>
          ))}
        </div>
      </div>
      <p className="sr-only">Any style: {STYLES.join(', ')}. Guitar first, more instruments on the way.</p>

      <section id="beta" className="relative scroll-mt-0 overflow-hidden bg-accent text-on-accent">
        <div className="pointer-events-none absolute top-1/2 right-[-10vw] size-[70vw] -translate-y-1/2" aria-hidden="true">
          {[0, 1.5, 3].map((delay) => (
            <span key={delay} className="ci-ripple absolute inset-0 rounded-full border border-on-accent" style={{ animationDelay: `${delay}s` }} />
          ))}
        </div>
        <div className="relative mx-auto grid min-h-[86vh] w-full max-w-6xl content-center gap-x-12 gap-y-8 px-5 py-24 sm:px-8 lg:grid-cols-[minmax(0,0.42fr)_minmax(0,1fr)]">
          <Reveal className="flex flex-col gap-4">
            <span className="ci-num block text-[clamp(7rem,20vw,17rem)] leading-[0.8] font-medium tracking-[-0.06em]" aria-hidden="true">
              in
            </span>
            <p className="ci-num text-sm tracking-[0.14em] uppercase">Frictionless</p>
          </Reveal>
          <Reveal className="flex flex-col items-start gap-8" delay={120}>
            <h2 className="ci-display text-[clamp(2.75rem,7vw,6rem)] leading-[0.94] font-semibold text-balance">We count you in. You play.</h2>
            <p className="max-w-[46ch] text-lg leading-relaxed">Nothing to set up and nothing to decide. Count-in is in beta: it is free, guitar comes first, and what you tell us shapes what gets built next.</p>
            <WaitlistForm goal={goal.ask} onJoin={onJoin} />
            <button type="button" onClick={count} className="rounded-sm text-[15px] font-semibold underline underline-offset-4 hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-accent">
              Or try it first
            </button>
            <p className="text-[15px]">
              Already in the beta?{' '}
              <a href="/sign-in" className="rounded-sm font-semibold underline underline-offset-4 hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-accent">
                Sign in
              </a>
              <span className="ci-num ml-3 text-[13px]">guitar first · free during the beta</span>
            </p>
          </Reveal>
        </div>
      </section>

      <footer className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-6 text-[13px] text-muted sm:px-8">
        <Lockup className="text-base text-fg" />
        <span className="ci-num">count-in.ai · practice smart · free during the beta</span>
      </footer>
    </div>
  )
}
