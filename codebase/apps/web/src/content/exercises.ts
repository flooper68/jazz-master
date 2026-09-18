import { ARPEGGIOS_AFTER_II_V_I, ARPEGGIOS_BEFORE_II_V_I } from './pack/arpeggios'
import { CHORDS } from './pack/chords'
import { ETUDES } from './pack/etudes'
import { LINES_AFTER_BEBOP_LINE, LINES_BEFORE_BEBOP_LINE } from './pack/lines'
import { PATTERNS } from './pack/patterns'
import { PROGRESSIONS } from './pack/progressions'
import { SCALES } from './pack/scales'
import { TECHNIQUE } from './pack/technique'
import type { Exercise } from './types'

/**
 * The five exercises the app began with, written as literal tabs: a series of
 * notes (string, fret, beats) the player renders and steps through. The scale
 * tabs were produced by `scaleTab` in authoring.ts — one note per eighth, up
 * through the open position and back down. Their ids are in users' run
 * history and routines, so they stay as they are.
 */
const FOUNDING: readonly Exercise[] = [
  {
    id: 'scales-major-open-c',
    title: 'C major — open position',
    area: 'scales',
    level: 1,
    key: 'C',
    series: 'major-open',
    about: [
      'The major scale is the ruler everything else in jazz is measured against. Chord symbols, the modes, the ii–V–I — all of them are described as alterations of it, so knowing it under the fingers in every key is the first real investment.',
      'The open position is the lowest place on the neck to play it: the four frets nearest the nut plus the open strings. It uses a different fingering in every key, which is exactly the point — the scale has to become a sound you find, not a shape you memorise.',
      'Play each note with an even, singing tone and let the click carry the time. Say the note names as you go when the tempo allows; naming what you play is how the neck becomes a map.',
      'C major has no sharps or flats, so every fretted note here is a natural. From the low E string climb to the high E and back, ending on the root held to the bar line.',
      'Fingering: first finger on the first fret, second on the second, third on the third — one finger per fret, the fourth finger free for the fourth fret on the G string.',
    ],
    tempoBpm: 60,
    duration: { kind: 'minutes', minutes: 2 },
    notes: [
      { string: 6, fret: 0, beats: 0.5 },
      { string: 6, fret: 1, beats: 0.5 },
      { string: 6, fret: 3, beats: 0.5 },
      { string: 5, fret: 0, beats: 0.5 },
      { string: 5, fret: 2, beats: 0.5 },
      { string: 5, fret: 3, beats: 0.5 },
      { string: 4, fret: 0, beats: 0.5 },
      { string: 4, fret: 2, beats: 0.5 },
      { string: 4, fret: 3, beats: 0.5 },
      { string: 3, fret: 0, beats: 0.5 },
      { string: 3, fret: 2, beats: 0.5 },
      { string: 3, fret: 4, beats: 0.5 },
      { string: 2, fret: 0, beats: 0.5 },
      { string: 2, fret: 1, beats: 0.5 },
      { string: 2, fret: 3, beats: 0.5 },
      { string: 1, fret: 0, beats: 0.5 },
      { string: 1, fret: 1, beats: 0.5 },
      { string: 1, fret: 3, beats: 0.5 },
      { string: 1, fret: 1, beats: 0.5 },
      { string: 1, fret: 0, beats: 0.5 },
      { string: 2, fret: 3, beats: 0.5 },
      { string: 2, fret: 1, beats: 0.5 },
      { string: 2, fret: 0, beats: 0.5 },
      { string: 3, fret: 4, beats: 0.5 },
      { string: 3, fret: 2, beats: 0.5 },
      { string: 3, fret: 0, beats: 0.5 },
      { string: 4, fret: 3, beats: 0.5 },
      { string: 4, fret: 2, beats: 0.5 },
      { string: 4, fret: 0, beats: 0.5 },
      { string: 5, fret: 3, beats: 0.5 },
      { string: 5, fret: 2, beats: 0.5 },
      { string: 5, fret: 0, beats: 0.5 },
      { string: 6, fret: 3, beats: 0.5 },
      { string: 6, fret: 1, beats: 0.5 },
      // Held to the bar line: 34 eighths and a dotted half make five bars.
      { string: 6, fret: 0, beats: 3 },
    ],
  },
  {
    id: 'scales-major-open-g',
    title: 'G major — open position',
    area: 'scales',
    level: 1,
    key: 'G',
    series: 'major-open',
    about: [
      'The open-position major scale again, a fifth up — the story of the scale is told with C major. One sharp: F♯. Everything else is the same as C major, so listen for the one note that moves — the F on the low E, D and high E strings has stepped up a fret.',
    ],
    tempoBpm: 60,
    duration: { kind: 'minutes', minutes: 2 },
    notes: [
      { string: 6, fret: 0, beats: 0.5 },
      { string: 6, fret: 2, beats: 0.5 },
      { string: 6, fret: 3, beats: 0.5 },
      { string: 5, fret: 0, beats: 0.5 },
      { string: 5, fret: 2, beats: 0.5 },
      { string: 5, fret: 3, beats: 0.5 },
      { string: 4, fret: 0, beats: 0.5 },
      { string: 4, fret: 2, beats: 0.5 },
      { string: 4, fret: 4, beats: 0.5 },
      { string: 3, fret: 0, beats: 0.5 },
      { string: 3, fret: 2, beats: 0.5 },
      { string: 3, fret: 4, beats: 0.5 },
      { string: 2, fret: 0, beats: 0.5 },
      { string: 2, fret: 1, beats: 0.5 },
      { string: 2, fret: 3, beats: 0.5 },
      { string: 1, fret: 0, beats: 0.5 },
      { string: 1, fret: 2, beats: 0.5 },
      { string: 1, fret: 3, beats: 0.5 },
      { string: 1, fret: 2, beats: 0.5 },
      { string: 1, fret: 0, beats: 0.5 },
      { string: 2, fret: 3, beats: 0.5 },
      { string: 2, fret: 1, beats: 0.5 },
      { string: 2, fret: 0, beats: 0.5 },
      { string: 3, fret: 4, beats: 0.5 },
      { string: 3, fret: 2, beats: 0.5 },
      { string: 3, fret: 0, beats: 0.5 },
      { string: 4, fret: 4, beats: 0.5 },
      { string: 4, fret: 2, beats: 0.5 },
      { string: 4, fret: 0, beats: 0.5 },
      { string: 5, fret: 3, beats: 0.5 },
      { string: 5, fret: 2, beats: 0.5 },
      { string: 5, fret: 0, beats: 0.5 },
      { string: 6, fret: 3, beats: 0.5 },
      { string: 6, fret: 2, beats: 0.5 },
      // Held to the bar line: 34 eighths and a dotted half make five bars.
      { string: 6, fret: 0, beats: 3 },
    ],
  },
  {
    id: 'scales-major-open-f',
    title: 'F major — open position',
    area: 'scales',
    level: 1,
    key: 'F',
    series: 'major-open',
    about: [
      'The open-position major scale once more, this time on the flat side of C. One flat: B♭. The B string is the trap — its open note is out of the key, so the scale takes the first fret there instead. F major is the first key where the open strings stop doing the work for you.',
    ],
    tempoBpm: 60,
    duration: { kind: 'minutes', minutes: 2 },
    notes: [
      { string: 6, fret: 0, beats: 0.5 },
      { string: 6, fret: 1, beats: 0.5 },
      { string: 6, fret: 3, beats: 0.5 },
      { string: 5, fret: 0, beats: 0.5 },
      { string: 5, fret: 1, beats: 0.5 },
      { string: 5, fret: 3, beats: 0.5 },
      { string: 4, fret: 0, beats: 0.5 },
      { string: 4, fret: 2, beats: 0.5 },
      { string: 4, fret: 3, beats: 0.5 },
      { string: 3, fret: 0, beats: 0.5 },
      { string: 3, fret: 2, beats: 0.5 },
      { string: 3, fret: 3, beats: 0.5 },
      { string: 2, fret: 1, beats: 0.5 },
      { string: 2, fret: 3, beats: 0.5 },
      { string: 1, fret: 0, beats: 0.5 },
      { string: 1, fret: 1, beats: 0.5 },
      { string: 1, fret: 3, beats: 0.5 },
      { string: 1, fret: 1, beats: 0.5 },
      { string: 1, fret: 0, beats: 0.5 },
      { string: 2, fret: 3, beats: 0.5 },
      { string: 2, fret: 1, beats: 0.5 },
      { string: 3, fret: 3, beats: 0.5 },
      { string: 3, fret: 2, beats: 0.5 },
      { string: 3, fret: 0, beats: 0.5 },
      { string: 4, fret: 3, beats: 0.5 },
      { string: 4, fret: 2, beats: 0.5 },
      { string: 4, fret: 0, beats: 0.5 },
      { string: 5, fret: 3, beats: 0.5 },
      { string: 5, fret: 1, beats: 0.5 },
      { string: 5, fret: 0, beats: 0.5 },
      { string: 6, fret: 3, beats: 0.5 },
      { string: 6, fret: 1, beats: 0.5 },
      // Held to the bar line: 32 eighths and a whole note make five bars.
      { string: 6, fret: 0, beats: 4 },
    ],
  },
  {
    id: 'lines-ii-v-i-f-arpeggios',
    title: 'Gm7 – C7 – Fmaj7 — arpeggios up and down',
    area: 'arpeggios',
    level: 2,
    key: 'F',
    styles: ['jazz'],
    contexts: ['major-ii-V-I'],
    about: [
      'The ii–V–I is the most common chord movement in jazz: in F major that is Gm7 to C7 to Fmaj7. The bass moves down in fifths, the harmony leans forward twice and then lands, and most standards are built from chains of this one cadence.',
      'Every chord in it comes from the F major scale, so the same seven notes fit all three — what changes is which of them feel like home. Lines that work outline the chord tones on the strong beats and use the rest of the scale, plus the odd chromatic note, to get between them.',
      'Each bar arpeggiates one chord up to its ninth and back: Gm9, C9, then Fmaj9, landing on a whole-note F. Hear how the top note of each arpeggio — A, D, G — is the colour tone that makes the chord sound like jazz.',
      'Keep the eighths even; the arpeggio is a scale skipping every other note, so any unevenness shows at once. Once the chord tones are in your hands, the bebop line shows how they get connected in real playing.',
    ],
    tempoBpm: 80,
    duration: { kind: 'repetitions', count: 4 },
    notes: [
      // Gm9 up and down, one bar of eighths.
      { string: 4, fret: 5, beats: 0.5 },
      { string: 3, fret: 3, beats: 0.5 },
      { string: 2, fret: 3, beats: 0.5 },
      { string: 1, fret: 1, beats: 0.5 },
      { string: 1, fret: 5, beats: 0.5 },
      { string: 1, fret: 1, beats: 0.5 },
      { string: 2, fret: 3, beats: 0.5 },
      { string: 3, fret: 3, beats: 0.5 },
      // C9 up and down.
      { string: 3, fret: 5, beats: 0.5 },
      { string: 2, fret: 5, beats: 0.5 },
      { string: 1, fret: 3, beats: 0.5 },
      { string: 1, fret: 6, beats: 0.5 },
      { string: 1, fret: 10, beats: 0.5 },
      { string: 1, fret: 6, beats: 0.5 },
      { string: 1, fret: 3, beats: 0.5 },
      { string: 2, fret: 5, beats: 0.5 },
      // Fmaj9 up and down.
      { string: 4, fret: 3, beats: 0.5 },
      { string: 3, fret: 2, beats: 0.5 },
      { string: 3, fret: 5, beats: 0.5 },
      { string: 2, fret: 5, beats: 0.5 },
      { string: 1, fret: 3, beats: 0.5 },
      { string: 2, fret: 5, beats: 0.5 },
      { string: 3, fret: 5, beats: 0.5 },
      { string: 3, fret: 2, beats: 0.5 },
      // Land on the root.
      { string: 4, fret: 3, beats: 4 },
    ],
  },
  {
    id: 'lines-ii-v-i-f-line',
    title: 'Gm7 – C7 – Fmaj7 — a bebop line',
    area: 'lines',
    level: 2,
    key: 'F',
    styles: ['jazz/bebop'],
    contexts: ['major-ii-V-I'],
    feel: 'swing-8',
    about: [
      'The same Gm7 – C7 – Fmaj7 as the arpeggio exercise, in the same position around the fifth to eighth frets — learn the arpeggios first so the chord tones are already under your fingers. A line in the bebop manner: up the Gm7 arpeggio, down the scale, then over C7 the third, fifth, seventh and root before the one chromatic note — A♭, the flat thirteenth of C7 — which slides down to A, the third of Fmaj7, on the downbeat.',
      'That resolution is the whole lesson: a note outside the key placed a half step above its target lands the change. Play the line until the A♭ sounds inevitable rather than wrong.',
    ],
    tempoBpm: 90,
    duration: { kind: 'repetitions', count: 4 },
    notes: [
      // Gm7: up the arpeggio from the 5th, down the scale.
      { string: 3, fret: 7, beats: 0.5 },
      { string: 2, fret: 6, beats: 0.5 },
      { string: 1, fret: 5, beats: 0.5 },
      { string: 1, fret: 8, beats: 0.5 },
      { string: 1, fret: 6, beats: 0.5 },
      { string: 1, fret: 5, beats: 0.5 },
      { string: 2, fret: 8, beats: 0.5 },
      { string: 2, fret: 6, beats: 0.5 },
      // C7: 3–5–b7–root, then the b13 approaching the 3rd of F.
      { string: 2, fret: 5, beats: 0.5 },
      { string: 2, fret: 8, beats: 0.5 },
      { string: 1, fret: 6, beats: 0.5 },
      { string: 1, fret: 8, beats: 0.5 },
      { string: 1, fret: 6, beats: 1 },
      { string: 1, fret: 4, beats: 1 },
      // Fmaj7: resolve to the 3rd, walk down to the 5th.
      { string: 1, fret: 5, beats: 1 },
      { string: 2, fret: 6, beats: 0.5 },
      { string: 2, fret: 5, beats: 0.5 },
      { string: 3, fret: 5, beats: 2 },
      // Fmaj7: close on the root.
      { string: 2, fret: 8, beats: 1 },
      { string: 1, fret: 5, beats: 1 },
      { string: 2, fret: 6, beats: 2 },
    ],
  },
]

function founding(id: string): Exercise {
  const exercise = FOUNDING.find((candidate) => candidate.id === id)
  if (!exercise) throw new Error(`No founding exercise "${id}"`)
  return exercise
}

/**
 * The exercise pack. The list groups by area, so what this order decides is
 * the order within each area, which is the order to learn them in; the
 * sections are built in pack/, each with the helpers in authoring.ts.
 */
export const EXERCISES: readonly Exercise[] = [
  ...TECHNIQUE,
  founding('scales-major-open-c'),
  founding('scales-major-open-g'),
  founding('scales-major-open-f'),
  ...SCALES,
  ...PATTERNS,
  ...ARPEGGIOS_BEFORE_II_V_I,
  founding('lines-ii-v-i-f-arpeggios'),
  ...ARPEGGIOS_AFTER_II_V_I,
  ...CHORDS,
  ...PROGRESSIONS,
  ...LINES_BEFORE_BEBOP_LINE,
  founding('lines-ii-v-i-f-line'),
  ...LINES_AFTER_BEBOP_LINE,
  ...ETUDES,
]
