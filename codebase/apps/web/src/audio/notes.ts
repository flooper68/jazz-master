import type { PositionedNote } from '@jazz-master/theory'

const OPEN_STRING_MIDI: Record<PositionedNote['string'], number> = {
  1: 64,
  2: 59,
  3: 55,
  4: 50,
  5: 45,
  6: 40,
}

const FLAT_NOTE_NAMES: readonly string[] = [
  'C',
  'Db',
  'D',
  'Eb',
  'E',
  'F',
  'Gb',
  'G',
  'Ab',
  'A',
  'Bb',
  'B',
]

/** Convert a guitar fretboard position to sounding MIDI pitch. */
export function midiForPosition(position: Pick<PositionedNote, 'string' | 'fret'>): number {
  return OPEN_STRING_MIDI[position.string] + position.fret
}

/** FluidR3/midi-js-soundfonts use flat filenames: `Bb2.mp3`, not `A#2.mp3`. */
export function fluidSampleName(midi: number): string {
  if (!Number.isInteger(midi)) {
    throw new Error(`Invalid MIDI note: ${midi}`)
  }
  const pitchClass = ((midi % 12) + 12) % 12
  const octave = Math.floor(midi / 12) - 1
  return `${FLAT_NOTE_NAMES[pitchClass]}${octave}`
}
