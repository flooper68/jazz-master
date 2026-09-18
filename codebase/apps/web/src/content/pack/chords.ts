import { chordOf, pickThenStrike, shape, strum } from '../authoring'
import type { Exercise } from '../types'

/*
 * The chords area is chords: in every exercise here the strings sound
 * together. A shape is learned the way a teacher teaches it — picked string
 * by string, so a buzz has nowhere to hide, then struck whole — and the
 * progressions that use the shapes are in progressions.ts. Harmony played as
 * a single line belongs to the areas that name it: guide tones are in
 * arpeggios, a walking bass in lines.
 */

const FOUR_PASSES = { kind: 'repetitions', count: 4 } as const

/** The five open shapes, low E to high E; `x` is a string the chord leaves out. */
const OPEN_SHAPES = ['x32010', 'x02220', '320003', '022100', 'xx0232'] as const

/** Root, third and seventh, the fifth left out: the same three shapes from the low E string and from the A string. */
const SHELL_SHAPES = ['3x44xx', '3x34xx', '3x33xx', 'x324xx', 'x323xx', 'x313xx'] as const

const SHELLS_II_V_I = { Dm7: 'x535xx', G7: '3x34xx', Cmaj7: 'x324xx' } as const

/** Each inversion struck twice a bar, so the four shapes of one chord take four bars. */
function twiceABar(boxes: readonly string[]): Exercise['notes'] {
  return boxes.flatMap((box) => {
    const positions = shape(box)
    return [chordOf(positions, 2), chordOf(positions, 2)]
  })
}

export const CHORDS: readonly Exercise[] = [
  {
    id: 'chords-open-chords',
    title: 'Open chords — picked string by string, then strummed',
    area: 'chords',
    level: 1,
    styles: ['folk-acoustic', 'pop', 'rock', 'country'],
    voicings: ['open'],
    techniques: ['strumming'],
    about: [
      'The five open major chords, a bar each: the shape held down and picked from its bass note up, then struck whole and left to ring to the bar line. If a note buzzes or is muted by a neighbouring finger you will hear it in the picking, where a strum would hide it — and the strum is the reward for fixing it.',
      'These five shapes — C, A, G, E, D — are also the five ways any chord lies on the neck, which is why the system for finding chords everywhere is named after them.',
    ],
    tempoBpm: 66,
    duration: FOUR_PASSES,
    notes: OPEN_SHAPES.flatMap((box) => pickThenStrike(box)),
  },
  {
    id: 'chords-shell-voicings',
    title: 'Shell voicings — root, third and seventh',
    area: 'chords',
    level: 2,
    styles: ['jazz', 'jazz/swing'],
    voicings: ['shell'],
    techniques: ['strumming'],
    beatsPerBar: 3,
    about: [
      'A jazz chord reduced to what defines it: the root, the third — major or minor — and the seventh. Three notes, three strings, and the fifth left out because nobody misses it. First with the root on the low E string as Gmaj7, G7, Gm7; then with the root on the A string as Cmaj7, C7, Cm7.',
      'Each bar picks the three notes and then plucks them together. Between one chord and the next exactly one note moves, by one fret. Watch which, and you are watching what makes a chord major, dominant or minor.',
      'The strings in between are silenced by the fretting fingers lying flat across them, so the hand can pluck through and only three sound.',
    ],
    tempoBpm: 72,
    duration: FOUR_PASSES,
    notes: SHELL_SHAPES.flatMap((box) => pickThenStrike(box, 3)),
  },
  {
    id: 'chords-shells-ii-v-i',
    title: 'Dm7 – G7 – Cmaj7 — shell voicings',
    area: 'chords',
    level: 2,
    key: 'C',
    styles: ['jazz', 'jazz/swing'],
    contexts: ['major-ii-V-I'],
    voicings: ['shell'],
    techniques: ['strumming'],
    beatsPerBar: 3,
    about: [
      'The ii–V–I in shells, three plucks to the bar, roots alternating between the A and low E strings so the hand barely moves. Follow the top two notes: C falls to B while F stays, then F falls to E while B stays. Those two voices are the whole cadence.',
      'All three notes together, and short — a chord here is a rhythm as much as a harmony. The last bar holds, so the cadence has somewhere to land.',
    ],
    tempoBpm: 72,
    duration: FOUR_PASSES,
    notes: strum('Dm7*3 | G7*3 | Cmaj7*3 | Cmaj7:3', SHELLS_II_V_I),
  },
  ...(
    [
      { kind: 'maj7', name: 'Cmaj7', boxes: ['xx5557', 'xx9988', 'x-x-10-12-12-12', 'x-x-14-16-13-15'] },
      { kind: '7', name: 'C7', boxes: ['xx5556', 'xx8988', 'x-x-10-12-11-12', 'x-x-14-15-13-15'] },
      { kind: 'm7', name: 'Cm7', boxes: ['xx5546', 'xx8888', 'x-x-10-12-11-11', 'x-x-13-15-13-15'] },
    ] as const
  ).map(({ kind, name, boxes }): Exercise => ({
    id: `chords-drop-2-${kind}`,
    title: `${name} — drop 2 on the top four strings`,
    area: 'chords',
    level: 3,
    styles: ['jazz'],
    voicings: ['drop-2'],
    techniques: ['position-shift', 'strumming'],
    series: 'drop-2-top-four',
    about: [
      `${name} in its four inversions up the neck, a bar each, struck on one and on three. A drop 2 voicing takes a close-position chord and drops its second-highest note an octave, which is what makes four-note jazz chords fall under four fingers.`,
      'The four shapes are one chord: the same notes with a different one on top. Listen to that top note climb from bar to bar. Comping and chord-melody are both a matter of choosing the inversion whose top note you want to hear.',
      'Only the four highest strings sound. Let the strumming hand travel no further than it must, and keep the two low strings quiet under the palm.',
    ],
    tempoBpm: 72,
    duration: FOUR_PASSES,
    notes: twiceABar(boxes),
  })),
]
