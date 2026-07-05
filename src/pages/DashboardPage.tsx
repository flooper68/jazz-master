import { Fretboard, type FretboardHighlight } from '../components/Fretboard'
import { noteName, pitchClass, positionsOf, spellChord } from '../theory'

// Temporary TASK-003 demo: Cmaj7 chord tones in open position.
const chordNotes = spellChord('C', 'maj7')
const rootPc = pitchClass(chordNotes[0])
const demoHighlights: FretboardHighlight[] = chordNotes.flatMap((note) =>
  positionsOf(note, { min: 0, max: 5 }).map((position) => ({
    ...position,
    label: noteName(note),
    role: pitchClass(note) === rootPc ? ('root' as const) : ('other' as const),
  })),
)

export default function DashboardPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-bold tracking-tight">Dashboard</h1>
      <p className="mt-4 text-zinc-300">
        Welcome. Practice modules will land here — chord voicings, progression
        drills, repertoire, and ear training.
      </p>
      <section className="mt-8 max-w-2xl">
        <h2 className="text-sm font-medium text-zinc-400">
          Fretboard preview — Cmaj7 tones, frets 0–5
        </h2>
        <div className="mt-2 rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <Fretboard
            highlights={demoHighlights}
            fretRange={{ min: 0, max: 5 }}
            aria-label="Cmaj7 chord tones on the fretboard, frets 0 to 5"
          />
        </div>
      </section>
    </div>
  )
}
