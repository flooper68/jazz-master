import { EXERCISES, type TabNote } from '../../../content'

/** What the stage needs of an exercise — less than the app's `Exercise`, so a demo tab can be written inline. */
export interface DemoExercise {
  title: string
  tempoBpm: number
  notes: readonly TabNote[]
  key?: string
}

/** One thing a visitor can ask for, and what comes back: a plan, and a first tab to play. */
export interface Goal {
  /** What the visitor says. */
  ask: string
  /** What the assistant answers, before the plan. */
  reply: string
  plan: string
  weeks: readonly string[]
  demo: DemoExercise
}

const eighth = (string: TabNote['string'], fret: number): TabNote => ({ string, fret, beats: 0.5 })

/** Two bars of A minor pentatonic, box one. */
const BLUES_LICK: readonly TabNote[] = [
  eighth(3, 7), eighth(3, 5), eighth(4, 7), eighth(4, 5), eighth(3, 5), eighth(3, 7), eighth(2, 5), eighth(2, 8),
  eighth(1, 5), eighth(2, 8), eighth(2, 5), eighth(3, 7), eighth(3, 5), eighth(3, 7), { string: 4, fret: 7, beats: 1 },
]

const quarter = (string: TabNote['string'], fret: number): TabNote => ({ string, fret, beats: 1 })

/** One octave of C major in open position: the first eight notes most players learn. */
const FIRST_NOTES: readonly TabNote[] = [quarter(5, 3), quarter(4, 0), quarter(4, 2), quarter(4, 3), quarter(3, 0), quarter(3, 2), quarter(2, 0), quarter(2, 1)]

const bebop = EXERCISES.find((exercise) => exercise.id === 'lines-ii-v-i-f-line')
const JAZZ_DEMO: DemoExercise = bebop
  ? { title: 'A first jazz line', tempoBpm: bebop.tempoBpm, notes: bebop.notes, key: bebop.key }
  : { title: 'A blues lick in A', tempoBpm: 96, notes: BLUES_LICK }

/** Sample asks and sample plans, in plain words. Illustrative — the wording of a real plan is the assistant's. */
export const GOALS: readonly Goal[] = [
  {
    ask: 'Teach me jazz',
    reply: 'Happy to. We start with the sound, not the theory. Four weeks, fifteen minutes a night. Your first exercise is ready.',
    plan: 'Your first month of jazz',
    weeks: ['Three jazz chords that sound good right away', 'Make them move: the progression behind most jazz tunes', 'Play the notes inside the chords, and your first jazz line', 'A jazz blues: play the chords, then play over them'],
    demo: JAZZ_DEMO,
  },
  {
    ask: 'I just got a guitar. Where do I start?',
    reply: 'Right here. One small thing a night, and it adds up fast. Four weeks, fifteen minutes a night. Your first exercise is ready.',
    plan: 'Your first month on guitar',
    weeks: ['Your first notes, one string at a time', 'A scale you can play from memory', 'Your first three chords, and changing between them', 'Strumming in time, and a whole song shape'],
    demo: { title: 'Your first eight notes — C major', tempoBpm: 80, notes: FIRST_NOTES },
  },
  {
    ask: 'I want to play blues solos',
    reply: 'Five notes will take you a long way. Four weeks, fifteen minutes a night, ending with a solo that is yours. Your first exercise is ready.',
    plan: 'Blues soloing from zero',
    weeks: ['The five notes every blues solo uses', 'Bends and vibrato: making a note sing', 'Short phrases, and leaving space', 'A full solo over a 12-bar blues'],
    demo: { title: 'A blues lick in A', tempoBpm: 96, notes: BLUES_LICK },
  },
]

/** The style families the library's vocabulary already covers (content/taxonomy.ts). */
export const STYLES: readonly string[] = ['Jazz', 'Blues', 'Rock', 'Metal', 'Funk & soul', 'Country', 'Folk & acoustic', 'Classical', 'Latin & flamenco', 'Pop']
