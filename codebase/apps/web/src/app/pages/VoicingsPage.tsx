import { ChordDiagram, type Grip } from '../../components/ChordDiagram'

// Sample open-position grips until EPIC-002 brings the real voicing library.
const SAMPLE_GRIPS: { label: string; grip: Grip }[] = [
  { label: 'Cmaj7', grip: { frets: ['x', 3, 2, 0, 0, 0], fingers: [0, 3, 2, 0, 0, 0] } },
  { label: 'Dm7', grip: { frets: ['x', 'x', 0, 2, 1, 1], fingers: [0, 0, 0, 2, 1, 1] } },
  { label: 'G7', grip: { frets: [3, 2, 0, 0, 0, 1], fingers: [3, 2, 0, 0, 0, 1] } },
  { label: 'Fmaj7', grip: { frets: ['x', 'x', 3, 2, 1, 0], fingers: [0, 0, 3, 2, 1, 0] } },
]

export default function VoicingsPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-bold tracking-tight">Voicings</h1>
      <p className="mt-4 text-zinc-300">
        Jazz chord voicing library and drills — coming soon. A first taste:
      </p>
      <div className="mt-6 grid max-w-xl grid-cols-[repeat(auto-fill,minmax(6.5rem,1fr))] gap-4">
        {SAMPLE_GRIPS.map(({ label, grip }) => (
          <ChordDiagram key={label} label={label} grip={grip} />
        ))}
      </div>
    </div>
  )
}
