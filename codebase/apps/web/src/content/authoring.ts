import {
  midiAt,
  parseNote,
  scalePositions,
  STANDARD_TUNING,
  STRING_NUMBERS,
  type FretRange,
  type GuitarString,
  type ScaleType,
} from '@jazz-master/theory'
import type { StringFret, TabNote } from './types'

/**
 * Authoring helpers: theory in, tab out. The pack (see pack/) builds its tabs
 * with these when it loads; the player only ever sees the notes that come out,
 * and never calls anything here.
 */

/**
 * A scale played up through a fret window and back down, one note per eighth.
 * Notes are ordered by pitch, so the tab reads as the scale sounds; the top
 * note is not repeated at the turn, and the final root is held to the end of
 * its bar so the exercise closes on a bar line.
 */
export function scaleTab(
  root: string,
  scale: ScaleType,
  window: FretRange,
  beats = 0.5,
  beatsPerBar = 4,
): TabNote[] {
  const parsedRoot = parseNote(root)
  if (!parsedRoot) throw new Error(`Unparseable root "${root}"`)
  const up = scalePositions({ root: parsedRoot, type: scale }, window, STANDARD_TUNING)
    .map(({ string, fret }) => ({ string, fret, beats }))
    .sort((a, b) => midiAt(a.string, a.fret) - midiAt(b.string, b.fret))
  const down = up.slice(0, -1).reverse()
  const tab = [...up, ...down]
  const total = tab.length * beats
  const remainder = (beatsPerBar - (total % beatsPerBar)) % beatsPerBar
  const last = tab[tab.length - 1]
  tab[tab.length - 1] = { ...last, beats: last.beats + remainder }
  return tab
}

/*
 * The rest of the pack is written the way a teacher would say it — "A minor
 * pentatonic, fifth position", "Dm7 G7 Cmaj7, arpeggios", "D F A C, then B" —
 * and these helpers turn that into a tab: pitches first, then the one place
 * in a fret window each pitch is played. A tab made this way cannot hold a
 * wrong note for the fingering to hide, and its fingering stays in position.
 *
 * Pitch sets here are semitones above a root, not spelled notes: a tab needs
 * where to play, never what to call it, so the scales the theory package does
 * not spell yet (bebop, altered, diminished) need nothing from it.
 */

export const SCALE_STEPS = {
  major: [0, 2, 4, 5, 7, 9, 11],
  naturalMinor: [0, 2, 3, 5, 7, 8, 10],
  harmonicMinor: [0, 2, 3, 5, 7, 8, 11],
  melodicMinor: [0, 2, 3, 5, 7, 9, 11],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  locrian: [0, 1, 3, 5, 6, 8, 10],
  phrygianDominant: [0, 1, 4, 5, 7, 8, 10],
  hungarianMinor: [0, 2, 3, 6, 7, 8, 11],
  majorPentatonic: [0, 2, 4, 7, 9],
  minorPentatonic: [0, 3, 5, 7, 10],
  blues: [0, 3, 5, 6, 7, 10],
  majorBlues: [0, 2, 3, 4, 7, 9],
  bebopDominant: [0, 2, 4, 5, 7, 9, 10, 11],
  bebopMajor: [0, 2, 4, 5, 7, 8, 9, 11],
  altered: [0, 1, 3, 4, 6, 8, 10],
  lydianDominant: [0, 2, 4, 6, 7, 9, 10],
  halfWholeDiminished: [0, 1, 3, 4, 6, 7, 9, 10],
  wholeTone: [0, 2, 4, 6, 8, 10],
} as const satisfies Record<string, readonly number[]>

export const CHORD_STEPS = {
  major: [0, 4, 7],
  minor: [0, 3, 7],
  diminished: [0, 3, 6],
  augmented: [0, 4, 8],
  maj7: [0, 4, 7, 11],
  '7': [0, 4, 7, 10],
  m7: [0, 3, 7, 10],
  m7b5: [0, 3, 6, 10],
  dim7: [0, 3, 6, 9],
  '6': [0, 4, 7, 9],
  m6: [0, 3, 7, 9],
  mMaj7: [0, 3, 7, 11],
} as const satisfies Record<string, readonly number[]>

export type ChordKind = keyof typeof CHORD_STEPS

/** Note lengths the score can draw, longest first (see NOTE_LENGTHS_IN_BEATS; repeated here so authoring stays free of the input schema). */
const DRAWABLE_BEATS = [4, 3, 2, 1.5, 1, 0.75, 0.5, 0.375, 0.25]

const NOTE_NAME = /^([A-G])([#b]?)(-?\d)$/
const LETTER_STEPS: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }

/** Scientific pitch to MIDI: `C4` is 60, the guitar's low E is `E2`, 40. */
export function midiOfName(name: string): number {
  const match = NOTE_NAME.exec(name)
  if (!match) throw new Error(`Unreadable pitch "${name}"`)
  const accidental = match[2] === '#' ? 1 : match[2] === 'b' ? -1 : 0
  return (Number(match[3]) + 1) * 12 + LETTER_STEPS[match[1]] + accidental
}

function pitchClassOf(root: string): number {
  return midiOfName(`${root}4`) % 12
}

/**
 * Where a pitch is played inside a fret window: the highest string that has
 * it, so a line crosses strings instead of stretching along one. A pitch the
 * window misses by a fret (the gap a four-fret position leaves between
 * strings) is reached by that one-fret stretch; anything further is an error
 * in the writing, and says so.
 */
export function placeIn(midi: number, window: FretRange, stretch = 1): { string: GuitarString; fret: number } {
  for (let reach = 0; reach <= stretch; reach += 1) {
    for (const string of STRING_NUMBERS) {
      const fret = midi - midiAt(string, 0)
      if (fret >= Math.max(window.min - reach, 0) && fret <= window.max + reach) return { string, fret }
    }
  }
  throw new Error(`MIDI ${midi} cannot be played in frets ${window.min}–${window.max}`)
}

/** Every pitch of a set that lies strictly inside the window, low to high, each once. */
function pitchesIn(rootPitchClass: number, steps: readonly number[], window: FretRange): number[] {
  const lowest = midiAt(6, window.min)
  const highest = midiAt(1, window.max)
  const pitches: number[] = []
  for (let midi = lowest; midi <= highest; midi += 1) {
    const inSet = steps.includes((((midi - rootPitchClass) % 12) + 12) % 12)
    const playable = STRING_NUMBERS.some((string) => {
      const fret = midi - midiAt(string, 0)
      return fret >= window.min && fret <= window.max
    })
    if (inSet && playable) pitches.push(midi)
  }
  return pitches
}

/** For the runs, whose pitches were chosen because the position has them: no stretch, so a slip in choosing them is an error here, not a note out of position. */
function strictlyIn(midi: number, window: FretRange): { string: GuitarString; fret: number } {
  return placeIn(midi, window, 0)
}

/**
 * Stretch the last notes so the tab ends on a bar line, using only lengths the
 * score can draw: the final note takes as much as it can, the ones before it
 * the rest. A run of eighths two beats short of the bar line ends quarter,
 * half — a written-out slowing down, which is how one is played.
 */
export function closeOnBarLine(notes: readonly TabNote[], beatsPerBar = 4): TabNote[] {
  const closed = notes.map((note) => ({ ...note }))
  const total = closed.reduce((sum, note) => sum + note.beats, 0)
  let owed = (beatsPerBar - (total % beatsPerBar)) % beatsPerBar
  for (let index = closed.length - 1; index >= 0 && owed > 1e-9; index -= 1) {
    const longest = DRAWABLE_BEATS.find((beats) => beats <= closed[index].beats + owed + 1e-9) ?? closed[index].beats
    owed -= longest - closed[index].beats
    closed[index].beats = longest
  }
  if (owed > 1e-9) throw new Error('The tab cannot be closed on a bar line with drawable note lengths')
  return closed
}

function upAndDown(pitches: readonly number[], window: FretRange, beats: number, beatsPerBar: number): TabNote[] {
  const path = [...pitches, ...pitches.slice(0, -1).reverse()]
  return closeOnBarLine(path.map((midi) => ({ ...strictlyIn(midi, window), beats })), beatsPerBar)
}

interface RunOptions {
  beats?: number
  beatsPerBar?: number
  /** Start and end on the lowest root rather than the lowest note of the position. */
  fromRoot?: boolean
  /** For a sequence: how many scale notes to cover, counted up from the lowest root. A long cell through a whole position is a minute of playing; an octave and a bit says the same thing. */
  span?: number
}

/**
 * A scale through one position. From the bottom: lowest note to highest and
 * back. From the root: up from the lowest root to the top of the position,
 * down to its bottom, and back up to the root — the way the position is
 * practised when the point is to hear the scale from its tonic.
 */
export function scaleRun(root: string, scale: keyof typeof SCALE_STEPS, window: FretRange, options: RunOptions = {}): TabNote[] {
  const { beats = 0.5, beatsPerBar = 4, fromRoot = false } = options
  const rootPitchClass = pitchClassOf(root)
  const pitches = pitchesIn(rootPitchClass, SCALE_STEPS[scale], window)
  if (!fromRoot) return upAndDown(pitches, window, beats, beatsPerBar)
  const start = pitches.findIndex((midi) => midi % 12 === rootPitchClass)
  if (start === -1) throw new Error(`No ${root} in frets ${window.min}–${window.max}`)
  const path = [...pitches.slice(start), ...pitches.slice(0, -1).reverse(), ...pitches.slice(1, start + 1)]
  return closeOnBarLine(path.map((midi) => ({ ...strictlyIn(midi, window), beats })), beatsPerBar)
}

/** An arpeggio through one position, lowest chord tone to highest and back. */
export function arpeggioRun(root: string, chord: ChordKind, window: FretRange, options: RunOptions = {}): TabNote[] {
  const { beats = 0.5, beatsPerBar = 4 } = options
  return upAndDown(pitchesIn(pitchClassOf(root), CHORD_STEPS[chord], window), window, beats, beatsPerBar)
}

/**
 * A scale played in a repeating cell — thirds are `[0, 2]`, groups of four
 * `[0, 1, 2, 3]`, diatonic triads `[0, 2, 4]` — climbing a step at a time
 * through the position, then the same cell mirrored on the way down.
 */
export function sequenceRun(
  root: string,
  scale: keyof typeof SCALE_STEPS,
  window: FretRange,
  cell: readonly number[],
  options: RunOptions = {},
): TabNote[] {
  const { beats = 0.5, beatsPerBar = 4, span } = options
  const rootPitchClass = pitchClassOf(root)
  const inPosition = pitchesIn(rootPitchClass, SCALE_STEPS[scale], window)
  const lowestRoot = inPosition.findIndex((midi) => midi % 12 === rootPitchClass)
  if (span !== undefined && (lowestRoot === -1 || lowestRoot + span > inPosition.length)) {
    throw new Error(`Frets ${window.min}–${window.max} do not hold ${span} notes of ${root} ${scale} from the root`)
  }
  const pitches = span === undefined ? inPosition : inPosition.slice(lowestRoot, lowestRoot + span)
  const reach = Math.max(...cell)
  const path: number[] = []
  for (let index = 0; index + reach < pitches.length; index += 1) path.push(...cell.map((step) => pitches[index + step]))
  for (let index = pitches.length - 1; index - reach >= 0; index -= 1) path.push(...cell.map((step) => pitches[index - step]))
  return closeOnBarLine(path.map((midi) => ({ ...strictlyIn(midi, window), beats })), beatsPerBar)
}

/**
 * Three notes on every string, from a starting fret on the sixth: the
 * fingering that trades staying in position for the same picking pattern on
 * each string. Up and back down.
 */
export function threePerStringRun(root: string, scale: keyof typeof SCALE_STEPS, startFret: number, options: RunOptions = {}): TabNote[] {
  const { beats = 0.5, beatsPerBar = 4 } = options
  const rootPitchClass = pitchClassOf(root)
  const steps: readonly number[] = SCALE_STEPS[scale]
  let midi = midiAt(6, startFret)
  if (!steps.includes((((midi - rootPitchClass) % 12) + 12) % 12)) throw new Error(`Fret ${startFret} on the sixth string is not in ${root} ${scale}`)
  const up: TabNote[] = []
  for (const string of [...STRING_NUMBERS].reverse()) {
    for (let count = 0; count < 3; count += 1) {
      up.push({ string, fret: midi - midiAt(string, 0), beats })
      do midi += 1
      while (!steps.includes((((midi - rootPitchClass) % 12) + 12) % 12))
    }
  }
  return closeOnBarLine([...up, ...up.slice(0, -1).reverse()], beatsPerBar)
}

export interface ChordOfBar {
  root: string
  chord: ChordKind
}

/**
 * Arpeggios through a chord progression, a bar of eighths per entry. A bar
 * with one chord climbs root–3–5–7–root and comes back 7–5–3; a bar with two
 * gives each four notes up from its root. Every arpeggio starts from the
 * lowest root the position has, so the ear hears the bass move.
 */
export function arpeggiosThrough(bars: readonly (readonly ChordOfBar[])[], window: FretRange): TabNote[] {
  const notes: TabNote[] = []
  for (const bar of bars) {
    if (bar.length !== 1 && bar.length !== 2) throw new Error('A bar holds one chord or two')
    for (const { root, chord } of bar) {
      const rootPitchClass = pitchClassOf(root)
      const tones = pitchesIn(rootPitchClass, CHORD_STEPS[chord], window)
      const from = tones.findIndex((midi) => midi % 12 === rootPitchClass)
      const climb = tones.slice(from, from + 5)
      const wanted = bar.length === 1 ? 5 : 4
      if (from === -1 || climb.length < wanted) throw new Error(`${root}${chord} does not fit frets ${window.min}–${window.max}`)
      const path = bar.length === 1 ? [...climb, climb[3], climb[2], climb[1]] : climb.slice(0, 4)
      notes.push(...path.map((midi) => ({ ...strictlyIn(midi, window), beats: 0.5 })))
    }
  }
  return notes
}

/**
 * A line written as pitches: `D4 F4 A4 C5 | B4:1 G4:1 E4:2`. A pitch is an
 * eighth unless `:beats` says otherwise, `*4` repeats it, and bar lines are
 * for the reader. Each pitch is played where `placeIn` finds it.
 */
export function phrase(source: string, window: FretRange, beats = 0.5): TabNote[] {
  return source
    .split(/\s+/)
    .filter((token) => token && token !== '|')
    .flatMap((token) => {
      const [, name, length, times] = /^([^:*]+)(?::([\d.]+))?(?:\*(\d+))?$/.exec(token) ?? []
      if (!name) throw new Error(`Unreadable token "${token}"`)
      const note = { ...placeIn(midiOfName(name), window), beats: length ? Number(length) : beats }
      return Array.from({ length: times ? Number(times) : 1 }, () => ({ ...note }))
    })
}

/** `5/3` as a place on the neck; null when the text is not one. */
function stringFret(text: string): StringFret | null {
  const [, string, fret] = /^([1-6])\/(\d+)$/.exec(text) ?? []
  return string ? { string: Number(string) as GuitarString, fret: Number(fret) } : null
}

/**
 * A chord from the strings it is played on, in any order: the lowest string
 * becomes the note and the rest stack above it. Every string at most once.
 */
export function chordOf(positions: readonly StringFret[], beats: number): TabNote {
  if (positions.length === 0) throw new Error('A chord needs at least one string')
  const sorted = [...positions].sort((a, b) => b.string - a.string)
  for (let index = 1; index < sorted.length; index += 1) {
    if (sorted[index].string === sorted[index - 1].string) throw new Error(`String ${sorted[index].string} is struck twice in one chord`)
  }
  const [bass, ...above] = sorted
  return above.length ? { ...bass, beats, above } : { ...bass, beats }
}

/**
 * A tab written directly, for when the fingering is the point: `6/3 4/5:1
 * 3/0*2`, string/fret, eighths unless told. Strings joined with `+` are
 * struck together, a chord: `5/3+4/2+3/0+2/1+1/0:4`.
 */
export function tab(source: string, beats = 0.5): TabNote[] {
  return source
    .split(/\s+/)
    .filter((token) => token && token !== '|')
    .flatMap((token) => {
      const [, places, length, times] = /^([1-6]\/\d+(?:\+[1-6]\/\d+)*)(?::([\d.]+))?(?:\*(\d+))?$/.exec(token) ?? []
      if (!places) throw new Error(`Unreadable token "${token}"`)
      const positions = places.split('+').map((place) => stringFret(place) as StringFret)
      const note = chordOf(positions, length ? Number(length) : beats)
      return Array.from({ length: times ? Number(times) : 1 }, () => ({ ...note }))
    })
}

/**
 * A chord shape as a chord box writes it, low E to high E: `x32010` is open
 * C, `x` a string not struck. Frets past 9 take a dash between strings:
 * `x-10-12-12-12-10`.
 */
export function shape(box: string): StringFret[] {
  const frets = box.includes('-') ? box.split('-') : [...box]
  if (frets.length !== STRING_NUMBERS.length) throw new Error(`A shape names six strings, low to high: "${box}"`)
  return frets.flatMap((fret, index) => {
    if (fret === 'x') return []
    if (!/^\d+$/.test(fret)) throw new Error(`Unreadable fret "${fret}" in shape "${box}"`)
    return [{ string: (STRING_NUMBERS.length - index) as GuitarString, fret: Number(fret) }]
  })
}

/**
 * A chord the way it is taught: every string picked from the bass up, one to
 * an eighth, then the whole shape struck and held to the bar line. A buzz or
 * a string muted by a stray finger is heard in the picking, which a strum
 * would hide; the strum is what the picking was for.
 */
export function pickThenStrike(box: string, beatsPerBar = 4, beats = 0.5): TabNote[] {
  const positions = shape(box)
  const held = beatsPerBar - positions.length * beats
  if (!DRAWABLE_BEATS.some((length) => Math.abs(length - held) < 1e-9)) {
    throw new Error(`Picking "${box}" leaves ${held} beats for the chord, which the score cannot draw`)
  }
  return [...positions.map(({ string, fret }) => ({ string, fret, beats })), chordOf(positions, held)]
}

/**
 * A progression strummed from named shapes: `C G:2 Am:2 | F*4`, one strum a
 * beat unless told, `:beats` for a longer one, `*times` to strike it again.
 * Bar lines are for the reader. Each name looks up its shape in `shapes`.
 */
export function strum(source: string, shapes: Record<string, string>, beats = 1): TabNote[] {
  return source
    .split(/\s+/)
    .filter((token) => token && token !== '|')
    .flatMap((token) => {
      const [, name, length, times] = /^([^:*]+)(?::([\d.]+))?(?:\*(\d+))?$/.exec(token) ?? []
      const box = name ? shapes[name] : undefined
      if (!box) throw new Error(`No shape for "${token}"`)
      const chord = chordOf(shape(box), length ? Number(length) : beats)
      return Array.from({ length: times ? Number(times) : 1 }, () => ({ ...chord }))
    })
}
