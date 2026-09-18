import { keySignature, midiAt, parseNote, pitchClass, spellMidi, type FretRange, type GuitarString } from '@jazz-master/theory'
import { stringsOf } from './stack'
import type { Exercise } from './types'

/**
 * The shape an exercise makes on the neck: every position it uses, labelled
 * with its note name as the key spells it, roots marked. What the diagram in
 * the About drawer draws.
 */

export interface ShapePosition {
  string: GuitarString
  fret: number
  label: string
  role: 'root' | 'other'
}

export interface ExerciseShape {
  positions: ShapePosition[]
  fretRange: FretRange
}

export function exerciseShape(exercise: Exercise): ExerciseShape {
  const key = exercise.key ? keySignature(exercise.key) : null
  // The tonic when the exercise names one: A minor pentatonic is written in C's signature, and its root is A.
  const tonic = exercise.tonic ? parseNote(exercise.tonic) : null
  const rootPc = tonic ? pitchClass(tonic) : key ? pitchClass(key.tonic) : midiAt(exercise.notes[0].string, exercise.notes[0].fret) % 12
  const seen = new Set<string>()
  const positions: ShapePosition[] = []
  for (const { string, fret } of exercise.notes.flatMap(stringsOf)) {
    const id = `${string}/${fret}`
    if (seen.has(id)) continue
    seen.add(id)
    const midi = midiAt(string, fret)
    const spelled = spellMidi(midi, key)
    const label = spelled.letter + (spelled.accidental < 0 ? 'b'.repeat(-spelled.accidental) : '#'.repeat(spelled.accidental))
    positions.push({ string, fret, label, role: midi % 12 === rootPc ? 'root' : 'other' })
  }
  positions.sort((a, b) => b.string - a.string || a.fret - b.fret)
  const frets = positions.map((position) => position.fret)
  const lowest = Math.min(...frets)
  const highest = Math.max(...frets)
  const min = lowest <= 2 ? 0 : lowest - 1
  const max = Math.max(highest + 1, min + 4)
  return { positions, fretRange: { min, max } }
}
