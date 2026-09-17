import { useRef, useState, type ReactNode, type RefObject } from 'react'
import { GOALS, type DemoExercise } from './demo'
import { BeatButton, CountInShell, CountRow, FinalAsk, FooterBar, GhostLink, HeaderBar, NightInFour, PlanDemo, PracticeMethod, Stage, StyleRow, TensionList } from './parts'
import { useCountIn, type CountInDemo } from './useCountIn'

/**
 * Five takes on the Count-in landing page, to choose between in Storybook.
 * Every one shows the same two live moments: ask for something and watch an
 * AI build the plan, then four clicks and the real tab with its cursor.
 * Music practice for a broad audience, guitar first — plain words, no jargon.
 */

interface LandingDemo {
  demo: CountInDemo
  exercise: DemoExercise
  goalIndex: number
  /** A different ask: its plan, and its first exercise on the stage. */
  chooseGoal: (index: number) => void
  running: boolean
  stageRef: RefObject<HTMLDivElement | null>
  /** Any "Count me in" on the page: bring the stage into view, then count. */
  countMeIn: () => void
}

function useLandingDemo(): LandingDemo {
  const [goalIndex, setGoalIndex] = useState(0)
  const exercise = GOALS[goalIndex].demo
  const demo = useCountIn(exercise.notes, exercise.tempoBpm)
  const stageRef = useRef<HTMLDivElement | null>(null)
  const chooseGoal = (index: number) => {
    demo.reset()
    setGoalIndex(index)
  }
  const countMeIn = () => {
    stageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    demo.start()
  }
  return { demo, exercise, goalIndex, chooseGoal, running: demo.phase === 'counting' || demo.phase === 'playing', stageRef, countMeIn }
}

const HEADLINE = 'text-[clamp(2.75rem,7vw,5.5rem)] leading-[0.95] font-semibold text-balance'
const H2 = 'ci-display text-[clamp(1.75rem,3.4vw,2.5rem)] leading-[1.05] font-semibold text-balance'
const EYEBROW = 'ci-num text-xs tracking-[0.08em] text-accent-text uppercase'
const LEDE = 'max-w-[54ch] text-lg leading-relaxed text-fg-2'

const TAGLINE = 'AI music practice · guitar first · any style, any level'
const PROMISE = 'Tell it what you want to learn. An AI builds your plan, one small step a night. You pick up your instrument and wait for four clicks.'

function Section({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`mx-auto w-full max-w-6xl px-5 sm:px-8 ${className}`}>{children}</section>
}

function SectionHead({ eyebrow, children }: { eyebrow: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <p className={EYEBROW}>{eyebrow}</p>
      <h2 className={`${H2} max-w-[24ch]`}>{children}</h2>
    </div>
  )
}

/** The intelligence, as a section: the ask, the plan being built, the way into the stage. */
function PlanSection({ landing, eyebrow = 'The AI part' }: { landing: LandingDemo; eyebrow?: string }) {
  return (
    <Section className="flex flex-col gap-8">
      <SectionHead eyebrow={eyebrow}>Say what you want to learn. Get a plan made for you.</SectionHead>
      <PlanDemo goalIndex={landing.goalIndex} onGoal={landing.chooseGoal} onCount={landing.countMeIn} running={landing.running} />
    </Section>
  )
}

/** 1 — The promise and the demo on one screen, the plan right below it. */
export function LandingOneScreen() {
  const landing = useLandingDemo()
  return (
    <CountInShell>
      <div className="flex min-h-screen flex-col">
        <HeaderBar />
        <main className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-10 px-5 py-8 sm:px-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="flex flex-col items-start gap-6">
            <p className={EYEBROW}>{TAGLINE}</p>
            <h1 className={`ci-display ${HEADLINE}`}>We count you in. You play.</h1>
            <p className={LEDE}>{PROMISE}</p>
            <div className="flex flex-wrap items-center gap-3">
              <BeatButton onClick={landing.countMeIn} disabled={landing.running}>
                Count me in
              </BeatButton>
              <GhostLink href="#sign-up">Create an account</GhostLink>
            </div>
            <div className="mt-2 border-t border-line pt-6">
              <TensionList />
            </div>
          </div>
          <div ref={landing.stageRef}>
            <Stage exercise={landing.exercise} demo={landing.demo} />
          </div>
        </main>
      </div>
      <div className="flex flex-col gap-20 pt-8 pb-24">
        <PlanSection landing={landing} />
      </div>
      <FooterBar />
    </CountInShell>
  )
}

/** 2 — The page as a count-in: say it, the plan, four clicks, you play. */
export function LandingFourBeats() {
  const landing = useLandingDemo()
  return (
    <CountInShell>
      <HeaderBar />
      <main className="flex flex-col gap-24 pt-10 pb-24">
        <Section className="flex flex-col gap-10">
          <div className="flex flex-col items-start gap-6">
            <p className={EYEBROW}>{TAGLINE}</p>
            <h1 className={`ci-display ${HEADLINE}`}>We count you in. You play.</h1>
            <p className={LEDE}>{PROMISE}</p>
          </div>
          <div ref={landing.stageRef}>
            <Stage exercise={landing.exercise} demo={landing.demo} />
          </div>
        </Section>

        <PlanSection landing={landing} />

        <Section className="flex flex-col gap-8">
          <SectionHead eyebrow="How it goes">One, two, three, in.</SectionHead>
          <NightInFour />
        </Section>

        <Section className="flex flex-col gap-8">
          <SectionHead eyebrow="Why it works">Built on how people actually get better.</SectionHead>
          <PracticeMethod />
        </Section>

        <Section className="flex flex-col gap-6">
          <SectionHead eyebrow="Any style">Whatever you want to sound like.</SectionHead>
          <StyleRow />
          <p className="text-[15px] text-muted">Guitar first. More instruments are on the way.</p>
        </Section>

        <Section>
          <FinalAsk onCount={landing.countMeIn} />
        </Section>
      </main>
      <FooterBar />
    </CountInShell>
  )
}

const MANIFESTO: readonly string[] = [
  'You have the instrument and you have the half hour. What you do not have is an answer to the question that eats the half hour: what should I play tonight? So you scroll. A video, a tab, another video. By the time you have chosen, the time has a hole in it.',
  'Watching is not practicing. Lessons and videos are maps of a city you have not walked yet. The walking is what changes your hands, and the walking is the part nobody plans for you.',
  'So an AI plans it. You say what you want, in your own words: teach me jazz, help me with blues solos, I just got a guitar. It builds a plan of small steps, each one an exercise you can play along with. You do not browse it or set it up. You open it and it counts you in.',
  'Then it gets out of the way. A click, a moving note to follow, a loop around the bit you keep fumbling. When you are done the night is written down, and tomorrow the next step is waiting.',
]

/** 3 — A manifesto: the argument in long form, then the plan and the demo as the payoff. */
export function LandingManifesto() {
  const landing = useLandingDemo()
  return (
    <CountInShell>
      <HeaderBar />
      <main className="flex flex-col gap-20 pt-12 pb-24">
        <Section>
          <article className="mx-auto flex max-w-[44rem] flex-col gap-8">
            <p className={EYEBROW}>Why this exists</p>
            <h1 className="ci-display text-[clamp(2.5rem,6vw,4.5rem)] leading-[0.98] font-semibold text-balance">The hardest part of practice is deciding what to practice.</h1>
            {MANIFESTO.map((paragraph, index) => (
              <p key={paragraph} className={index === 0 ? 'text-xl leading-relaxed text-fg' : 'text-lg leading-relaxed text-fg-2'}>
                {paragraph}
              </p>
            ))}
            <p className="ci-display border-l-2 border-accent pl-5 text-2xl leading-snug font-medium">All the tension belongs in the music. None of it belongs in getting started.</p>
          </article>
        </Section>

        <PlanSection landing={landing} eyebrow="Enough reading. Ask it something" />

        <Section className="flex flex-col gap-6">
          <SectionHead eyebrow="Then">Four clicks. Then you.</SectionHead>
          <div ref={landing.stageRef}>
            <Stage exercise={landing.exercise} demo={landing.demo} />
          </div>
        </Section>

        <Section>
          <FinalAsk onCount={landing.countMeIn} />
        </Section>
      </main>
      <FooterBar />
    </CountInShell>
  )
}

/** 4 — The count as a poster: four giant numerals are the hero, and they light up. */
export function LandingGiantCount() {
  const landing = useLandingDemo()
  return (
    <CountInShell>
      <HeaderBar />
      <main className="flex flex-col gap-20 pb-24">
        <Section className="flex flex-col gap-10 pt-4">
          <CountRow demo={landing.demo} spread className="text-[clamp(6rem,24vw,19rem)] tracking-[-0.06em]" />
          <div className="grid items-end gap-8 lg:grid-cols-[minmax(0,1fr)_auto]">
            <div className="flex flex-col gap-5">
              <p className={EYEBROW}>{TAGLINE}</p>
              <h1 className="ci-display text-[clamp(2.25rem,5vw,4rem)] leading-[0.98] font-semibold text-balance">We count you in. You play.</h1>
              <p className={LEDE}>{PROMISE}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <BeatButton onClick={landing.countMeIn} disabled={landing.running}>
                Count me in
              </BeatButton>
              <GhostLink href="#sign-up">Create an account</GhostLink>
            </div>
          </div>
        </Section>

        <Section>
          <div ref={landing.stageRef}>
            <Stage exercise={landing.exercise} demo={landing.demo} showCount={false} />
          </div>
        </Section>

        <PlanSection landing={landing} />

        <Section className="grid gap-10 lg:grid-cols-2">
          <h2 className={`${H2} max-w-[18ch]`}>The hardest part of practice is deciding what to practice.</h2>
          <TensionList />
        </Section>
      </main>
      <FooterBar />
    </CountInShell>
  )
}

/** 5 — Ask, plan, play: the conversation is the hero, and the stage is where it leads. */
export function LandingAskPlanPlay() {
  const landing = useLandingDemo()
  return (
    <CountInShell>
      <HeaderBar />
      <main className="flex flex-col gap-24 pt-8 pb-24">
        <Section className="flex flex-col gap-10">
          <div className="flex flex-col items-start gap-6">
            <p className={EYEBROW}>{TAGLINE}</p>
            <h1 className={`ci-display ${HEADLINE}`}>Tell it what you want to learn.</h1>
            <p className={LEDE}>An AI turns it into a plan of small steps, one a night. Then we count you in, and you play. Try it:</p>
          </div>
          <PlanDemo goalIndex={landing.goalIndex} onGoal={landing.chooseGoal} onCount={landing.countMeIn} running={landing.running} />
        </Section>

        <Section className="flex flex-col gap-6">
          <SectionHead eyebrow="Then this happens">Four clicks, and a moving note to follow.</SectionHead>
          <div ref={landing.stageRef}>
            <Stage exercise={landing.exercise} demo={landing.demo} />
          </div>
        </Section>

        <Section className="flex flex-col gap-8">
          <SectionHead eyebrow="Why it works">Built on how people actually get better.</SectionHead>
          <PracticeMethod />
        </Section>

        <Section className="flex flex-col gap-6">
          <SectionHead eyebrow="Any style">Whatever you want to sound like.</SectionHead>
          <StyleRow />
          <p className="text-[15px] text-muted">Guitar first. More instruments are on the way.</p>
        </Section>

        <Section>
          <FinalAsk onCount={landing.countMeIn} />
        </Section>
      </main>
      <FooterBar />
    </CountInShell>
  )
}
