import { useCallback, useEffect, useRef, useState } from 'react'

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

export const BIO = `Plays rock and blues, five or six years, mostly by ear. Came for jazz — wants to blow over changes and comp behind a singer. Knows open and barre chords, the minor pentatonic in two boxes, one major scale shape. No seventh arpeggios before this month; the m7 and 7 shapes are landing, the maj7 is not yet. Practises ten minutes at a time, several times a day, on the sofa. Bored by spider exercises; lit up by Autumn Leaves. Comfortable to about 80 BPM on anything new.`

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
 * One entry of the practice log: a *period*, summarised — what the focus was,
 * what the player learned, what changed — with the conversation behind it
 * readable on request (owner decision 2026-09-20).
 */
export interface MockLogEntry {
  period: string
  kind: 'onboarding' | 'after_session' | 'on_demand' | 'check_in'
  focus: string
  learned: string
  changed: string | null
  summary: string
  conversation?: Exchange[]
}

export const LOG: MockLogEntry[] = [
  {
    period: 'Today · check-in',
    kind: 'check_in',
    focus: 'Two weeks into the ii–V–I path.',
    learned: 'The m7 and 7 shapes are solid at 72; the maj7 is not, and the stretch is the reason.',
    changed: 'Autumn Leaves added to stage 2 as shell voicings at 96. Spider drills dropped. maj7 moved to the fifth-string root for a week.',
    summary: 'Two weeks in. The three shapes are nearly solid; the maj7 lags. Asked for Autumn Leaves — added its changes to stage 2, and agreed to revisit comping once stage 2 opens fully.',
  },
  {
    period: '2 – 12 September · after a session',
    kind: 'after_session',
    focus: 'Getting the three arpeggio shapes under the fingers.',
    learned: 'C7 from the fifth-string root felt like a wall at 72; fine at 66. Tremolo drills are boring and were only ever a warm-up.',
    changed: 'C7 target dropped to 66 for a week; tremolo out of the path.',
    summary: 'The C7 arpeggio felt like a wall at 72. Dropped its target to 66 for a week; he said the tremolo drills are boring and could go.',
  },
  {
    period: '1 September · first lesson',
    kind: 'onboarding',
    focus: 'Where to start: what he can play, what he wants.',
    learned: 'Rock and blues by ear for years; chords and pentatonics solid, no seventh arpeggios. A C major scale and an m7 shape both fine at 70.',
    changed: 'A four-stage path written, from the three shapes to a line of his own.',
    summary: 'First lesson. Wants to solo over a ii–V–I in F and comp standards. Probed with a C major scale and an m7 shape; both fine at 70. Wrote a four-stage path from arpeggio shapes to a line.',
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
  /** Exchanges revealed so far; the last may still be typing. */
  shown: Exchange[]
  /** The text of the line being typed, when the teacher is mid-sentence. */
  typing: string
  done: boolean
  /** Whether the path has been rewritten by a line that landed. */
  pathRewritten: boolean
  replay(): void
}

/**
 * Plays a scripted exchange as if it were happening: the teacher types, the
 * player answers after a beat. Autoplays on mount so a story is alive the
 * moment it opens, and a recording needs no clicks.
 */
export function useScript(exchanges: Exchange[], { autoplay = true, speed = 1 } = {}): Script {
  const [index, setIndex] = useState(autoplay ? 0 : -1)
  const [typed, setTyped] = useState(0)
  const [run, setRun] = useState(0)
  const timer = useRef<number | null>(null)

  const current = index >= 0 && index < exchanges.length ? exchanges[index] : null
  const pathRewritten = exchanges.slice(0, index).some((item) => item.rewritesPath) || (current?.rewritesPath === true && typed >= current.text.length)

  useEffect(() => {
    if (!current) return
    const total = current.text.length
    if (typed < total) {
      // The teacher types; the player's line arrives whole after a pause.
      const step = current.who === 'teacher' ? Math.max(1, Math.round(3 * speed)) : total
      const delay = current.who === 'teacher' ? 18 / speed : 900 / speed
      timer.current = window.setTimeout(() => setTyped((before) => Math.min(total, before + step)), delay)
    } else {
      const rest = current.who === 'teacher' ? 1400 / speed : 700 / speed
      timer.current = window.setTimeout(() => {
        setIndex((before) => before + 1)
        setTyped(0)
      }, rest)
    }
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current)
    }
  }, [current, typed, speed, run])

  const replay = useCallback(() => {
    setIndex(0)
    setTyped(0)
    setRun((before) => before + 1)
  }, [])

  const shown = exchanges.slice(0, index)
  const typing = current ? current.text.slice(0, typed) : ''
  return { shown, typing: current && typed < current.text.length ? typing : '', done: index >= exchanges.length, pathRewritten, replay }
}

/** The line being typed, as an exchange, so a prototype can render it in place. */
export function typingLine(script: Script, exchanges: Exchange[]): Exchange | null {
  const next = exchanges[script.shown.length]
  if (!next || script.typing.length === 0) return null
  return { ...next, text: script.typing }
}

LOG[0].conversation = CHECK_IN
