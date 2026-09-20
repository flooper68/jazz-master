import { useCallback, useEffect, useRef, useState } from 'react'
import type { ChatStep } from '../../components/chat/Chat'

/**
 * Mock data and a scripted conversation for the four teacher prototypes
 * (Prototypes/…). Nothing here touches the app: no tRPC, no scheduler. The
 * point is to see the *shape* of the merged goals-and-teacher screen with
 * something alive in it, so the owner can judge feel before it is built.
 */

export interface MockStage {
  title: string
  items: { title: string; target: number; best: number | null }[]
  solidity: number
  open: boolean
}

export interface MockGoal {
  title: string
  stages: MockStage[]
}

export const GOAL: MockGoal = {
  title: 'Blow over a ii–V–I in F at a medium swing',
  stages: [
    {
      title: 'The three shapes under the fingers',
      solidity: 0.67,
      open: true,
      items: [
        { title: 'Cm7 arpeggio — root on the sixth string', target: 72, best: 76 },
        { title: 'C7 arpeggio — root on the fifth string', target: 72, best: 72 },
        { title: 'Cmaj7 arpeggio — root on the sixth string', target: 72, best: 64 },
      ],
    },
    {
      title: 'The changes in time',
      solidity: 0.2,
      open: true,
      items: [
        { title: 'Gm7 – C7 – Fmaj7 — arpeggios up and down', target: 100, best: 85 },
        { title: 'Dm7 – G7 – Cmaj7 — shell voicings', target: 84, best: null },
      ],
    },
    {
      title: 'A line that swings',
      solidity: 0,
      open: false,
      items: [
        { title: 'Dm7 – G7 – Cmaj7 — a line of chord tones', target: 110, best: null },
        { title: 'Gm7 – C7 – Fmaj7 — a bebop line', target: 100, best: null },
      ],
    },
    {
      title: 'Say it your own way',
      solidity: 0,
      open: false,
      items: [{ title: 'Dm7 – G7♭9 – Cmaj7 — enclosures and a flat nine', target: 104, best: null }],
    },
  ],
}

/** The path after the check-in below: the teacher added a tune to stage 2. */
export const GOAL_AFTER: MockGoal = {
  ...GOAL,
  stages: GOAL.stages.map((stage, index) =>
    index === 1
      ? { ...stage, items: [...stage.items, { title: 'Autumn Leaves — the changes, shell voicings', target: 96, best: null }] }
      : stage,
  ),
}

export const BIO = `Plays rock and blues, five or six years, mostly by ear. Came for jazz — wants to **blow over changes** and **comp behind a singer**.

Knows open and barre chords, the minor pentatonic in two boxes, one major scale shape. No seventh arpeggios before this month; the m7 and 7 shapes are landing, the maj7 is not yet.

Practises ten minutes at a time, several times a day, on the sofa. Comfortable to about 80 BPM on anything new.

Bored by spider exercises. Lit up by *Autumn Leaves*.`

/** A second goal, so "current goals" is plural in the prototypes. */
export const GOAL_TWO: MockGoal = {
  title: 'Play jazz standards — comp, play the head, and walk a bass line',
  stages: [
    { title: 'The changes under your fingers', solidity: 0.33, open: true, items: [{ title: 'Shell voicings — root, third and seventh', target: 60, best: 60 }, { title: 'Dm7 – G7 – Cmaj7 — guide tones', target: 66, best: null }] },
    { title: 'Comping a whole form', solidity: 0, open: false, items: [{ title: 'Dm7 – G7 – Cmaj7 — drop 2, one voice moving', target: 72, best: null }, { title: 'F blues — three-note voicings, four to the bar', target: 96, best: null }] },
    { title: 'A tune, played through', solidity: 0, open: false, items: [{ title: 'Jazz blues in F — a solo study', target: 84, best: null }] },
  ],
}

export const GOALS: MockGoal[] = [GOAL, GOAL_TWO]

/**
 * One entry of the practice log — a *sync*: the period it closed, summarised
 * as one structured text in markdown (what the focus was, what the player
 * learned, what changed), with the conversation behind it readable on request
 * (owner decisions 2026-09-20).
 */
export interface MockLogEntry {
  period: string
  kind: 'onboarding' | 'after_session' | 'on_demand' | 'check_in'
  /** Markdown. The teacher writes it; the practice log renders it. */
  summary: string
  changedPath: boolean
  conversation?: Exchange[]
}

export const LOG: MockLogEntry[] = [
  {
    period: 'Today · check-in',
    kind: 'check_in',
    changedPath: true,
    summary: `**Two weeks into the ii–V–I path.** The m7 and 7 shapes are solid at 72; the maj7 is not, and the sixth-string stretch is the reason.

**What changed**
- *Autumn Leaves* added to stage 2 as shell voicings at 96 — it is the same ii–V–I, in G minor.
- The spider drills are out; they were a warm-up, not the work.
- The maj7 moves to the fifth-string root for a week.

**Next time:** comping the whole form, once stage 2 is mostly solid.`,
  },
  {
    period: '2 – 12 September · after a session',
    kind: 'after_session',
    changedPath: true,
    summary: `**Getting the three arpeggio shapes under the fingers.** The C7 from the fifth-string root felt like a wall at 72 and fine at 66; the tremolo drills were boring and only ever a warm-up.

**What changed**
- C7 target dropped to 66 for a week.
- Tremolo out of the path.`,
  },
  {
    period: '1 September · first lesson',
    kind: 'onboarding',
    changedPath: true,
    summary: `**Where to start.** Rock and blues by ear for years; chords and pentatonics solid, no seventh arpeggios. Wants to solo over a ii–V–I in F and comp standards behind a singer.

**Probed:** a C major scale and an m7 shape, both fine at 70.

**What changed:** a four-stage path written, from the three shapes to a line of his own.`,
  },
]

export type Who = 'you' | 'teacher'

export interface Exchange {
  who: Who
  text: string
  /** What the teacher did while writing this — shown as small lines under it. */
  doing?: string[]
  /** The path changes after this line lands; prototypes animate it. */
  rewritesPath?: boolean
}

/** A check-in, scripted: the conversation every prototype plays. */
export const CHECK_IN: Exchange[] = [
  {
    who: 'teacher',
    doing: ['Remembering you', 'Reading past lessons', 'Looking at how it has been going'],
    text: 'Two weeks in. The m7 and the 7 shapes are solid now — you got the C7 through at 72 three days running. The maj7 is still sitting at 64. How has it felt?',
  },
  { who: 'you', text: 'The maj7 fingering is awkward, the stretch on the sixth string. And honestly the spider drills are boring me.' },
  {
    who: 'teacher',
    doing: ['Reading your practice'],
    text: 'Then we drop the spiders — they were a warm-up, not the work. For the maj7, try it from the fifth-string root for a week; the stretch is a fret smaller. I’ll swap that in. Anything you’ve been enjoying?',
  },
  { who: 'you', text: 'I keep coming back to Autumn Leaves. Could we do something with that?' },
  {
    who: 'teacher',
    doing: ['Looking through the exercises', 'Adding an exercise for you', 'Changing your path'],
    text: 'Yes — it’s the same ii–V–I you’re already working on, in G minor. I’ve added the changes as shell voicings to stage two, at 96, so it shows up as soon as you’ve played the arpeggio line once more. When stage two is mostly solid we can talk about comping the whole form.',
    rewritesPath: true,
  },
  { who: 'you', text: 'Perfect.' },
  {
    who: 'teacher',
    doing: ['Noting what it learned', 'Writing up this lesson'],
    text: 'Noted. I’ll check in again in a week — or catch me after a session any time.',
  },
]

/** The first lesson, scripted, for the prototype that starts from nothing. */
export const FIRST_LESSON: Exchange[] = [
  { who: 'teacher', text: 'Hi — I’ll put together a path for you. First: what do you want to be able to play?' },
  { who: 'you', text: 'Jazz standards. Solo over the changes, and comp behind a singer.' },
  {
    who: 'teacher',
    text: 'Good. What can you already play? Pick what’s true — open chords, barre chords, a major scale, a seventh arpeggio, a ii–V–I.',
  },
  { who: 'you', text: 'Open and barre chords, minor pentatonic. Never really done arpeggios.' },
  {
    who: 'teacher',
    doing: ['Looking through the exercises'],
    text: 'Then arpeggios are where the path starts. Play this one for me — a C major scale, then an m7 shape — and rate them honestly. Nobody’s listening; the rating is yours.',
  },
  { who: 'you', text: 'Both fine at 70. The m7 shape was new but it made sense.' },
  {
    who: 'teacher',
    doing: ['Writing your path', 'Noting what it learned', 'Writing up this lesson'],
    text: 'That’s a baseline. Four stages: the three seventh-chord shapes, then the changes in time, then a line that swings, then your own. Targets a little under the pack’s — we’ll raise them. Your first session is ready.',
    rewritesPath: true,
  },
]

export interface Script {
  /** Exchanges revealed so far, complete. */
  shown: Exchange[]
  /** The teacher's turn in progress — or finished and waiting its beat before it joins `shown`. Null between turns. */
  live: { text: string; steps: ChatStep[]; done: boolean } | null
  done: boolean
  /** Whether the path has been rewritten by a line that landed. */
  pathRewritten: boolean
  replay(): void
}

/** The player's line arrives whole after a beat; the teacher works, then types. */
const BEATS = { step: 520, type: 16, afterTeacher: 1300, afterPlayer: 650, playerThinks: 900 }

/**
 * Plays a scripted exchange as if it were happening. A teacher line with
 * `doing` first shows its steps running one by one, then types; the player's
 * line lands after a pause. Autoplays on mount so a story is alive the moment
 * it opens, and a recording needs no clicks.
 */
export function useScript(exchanges: Exchange[], { autoplay = true, speed = 1 } = {}): Script {
  const [index, setIndex] = useState(autoplay ? 0 : -1)
  // How far into the current line: steps landed, then characters typed.
  const [stepsDone, setStepsDone] = useState(0)
  const [typed, setTyped] = useState(0)
  const [run, setRun] = useState(0)
  const timer = useRef<number | null>(null)

  const current = index >= 0 && index < exchanges.length ? exchanges[index] : null
  const stepsOf = current?.doing ?? []
  const inSteps = current?.who === 'teacher' && stepsDone < stepsOf.length
  const finished = current !== null && !inSteps && typed >= current.text.length
  const pathRewritten = exchanges.slice(0, index).some((item) => item.rewritesPath) || (current?.rewritesPath === true && finished)

  useEffect(() => {
    if (!current) return
    let delay: number
    let tick: () => void
    if (inSteps) {
      delay = BEATS.step / speed
      tick = () => setStepsDone((before) => before + 1)
    } else if (typed < current.text.length) {
      const whole = current.who === 'you'
      delay = (whole ? BEATS.playerThinks : BEATS.type) / speed
      tick = () => setTyped((before) => (whole ? current.text.length : Math.min(current.text.length, before + 3)))
    } else {
      delay = (current.who === 'teacher' ? BEATS.afterTeacher : BEATS.afterPlayer) / speed
      tick = () => {
        setIndex((before) => before + 1)
        setStepsDone(0)
        setTyped(0)
      }
    }
    timer.current = window.setTimeout(tick, delay)
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current)
    }
  }, [current, inSteps, stepsDone, typed, speed, run])

  const replay = useCallback(() => {
    setIndex(0)
    setStepsDone(0)
    setTyped(0)
    setRun((before) => before + 1)
  }, [])

  const shown = exchanges.slice(0, index)
  // A finished line stays live, drawn exactly as it will be once shown, until
  // the index moves on — otherwise it vanishes for a beat and comes back.
  const live: Script['live'] =
    current && current.who === 'teacher'
      ? {
          text: current.text.slice(0, typed),
          steps: stepsOf.slice(0, Math.min(stepsOf.length, stepsDone + 1)).map((label, at): ChatStep => ({ label, state: at < stepsDone ? 'done' : 'running' })),
          done: finished,
        }
      : null
  return { shown, live, done: index >= exchanges.length, pathRewritten, replay }
}

/** A finished teacher line's steps, all done, for the turn it belongs to. */
export function stepsOf(line: Exchange): ChatStep[] {
  return (line.doing ?? []).map((label) => ({ label, state: 'done' as const }))
}

LOG[0].conversation = CHECK_IN
