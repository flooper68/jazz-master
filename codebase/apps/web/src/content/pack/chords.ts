import { phrase, tab } from '../authoring'
import type { Exercise } from '../types'

/*
 * Chords a note at a time: these teach a shape the way a teacher does before
 * asking for it strummed — held down, its notes played one by one, low to
 * high. The guide-tone and bass-line exercises are harmony played as a
 * single line, which is how it is heard in a band. The shapes struck whole,
 * in progressions, are in progressions.ts.
 */

const FOUR_PASSES = { kind: 'repetitions', count: 4 } as const

export const CHORDS: readonly Exercise[] = [
  {
    id: 'chords-open-chords',
    title: 'Open chords — C, A, G, E, D a note at a time',
    area: 'chords',
    level: 1,
    styles: ['folk-acoustic', 'pop', 'rock', 'country'],
    voicings: ['open'],
    about: [
      'The five open major chords, each held down and picked string by string from its bass note up. If a note buzzes or is muted by a neighbouring finger you will hear it here, where a strum would hide it.',
      'These five shapes — C, A, G, E, D — are also the five ways any chord lies on the neck, which is why the system for finding chords everywhere is named after them.',
    ],
    tempoBpm: 66,
    duration: FOUR_PASSES,
    notes: tab('5/3 4/2 3/0 2/1 1/0:2 | 5/0 4/2 3/2 2/2 1/0:2 | 6/3 5/2 4/0 3/0 2/0 1/3:1.5 | 6/0 5/2 4/2 3/1 2/0 1/0:1.5 | 4/0 3/2 2/3 1/2 2/3 3/2 4/0:1'),
  },
  {
    id: 'chords-shell-voicings',
    title: 'Shell voicings — root, third and seventh',
    area: 'chords',
    level: 2,
    styles: ['jazz', 'jazz/swing'],
    voicings: ['shell'],
    beatsPerBar: 3,
    about: [
      'A jazz chord reduced to what defines it: the root, the third — major or minor — and the seventh. Three notes, three strings, and the fifth left out because nobody misses it. First with the root on the low E string as Gmaj7, G7, Gm7; then with the root on the A string as Cmaj7, C7, Cm7.',
      'Between one chord and the next exactly one note moves, by one fret. Watch which, and you are watching what makes a chord major, dominant or minor.',
    ],
    tempoBpm: 72,
    duration: FOUR_PASSES,
    notes: tab('6/3:1 4/4:1 3/4:1 | 6/3:1 4/3:1 3/4:1 | 6/3:1 4/3:1 3/3:1 | 5/3:1 4/2:1 3/4:1 | 5/3:1 4/2:1 3/3:1 | 5/3:1 4/1:1 3/3:1'),
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
    beatsPerBar: 3,
    about: [
      'The ii–V–I in shells, roots alternating between the A and low E strings so the hand barely moves. Follow the top two notes: C falls to B while F stays, then F falls to E while B stays. Those two voices are the whole cadence.',
      'Once the shapes are secure, put the pick down and pluck all three notes together, four to the bar.',
    ],
    tempoBpm: 72,
    duration: FOUR_PASSES,
    notes: tab('5/5:1 4/3:1 3/5:1 | 6/3:1 4/3:1 3/4:1 | 5/3:1 4/2:1 3/4:1 | 5/3:3'),
  },
  ...(
    [
      { kind: 'maj7', name: 'Cmaj7', tab: '4/5:1 3/5:1 2/5:1 1/7:1 | 4/9:1 3/9:1 2/8:1 1/8:1 | 4/10:1 3/12:1 2/12:1 1/12:1 | 4/14:1 3/16:1 2/13:1 1/15:1' },
      { kind: '7', name: 'C7', tab: '4/5:1 3/5:1 2/5:1 1/6:1 | 4/8:1 3/9:1 2/8:1 1/8:1 | 4/10:1 3/12:1 2/11:1 1/12:1 | 4/14:1 3/15:1 2/13:1 1/15:1' },
      { kind: 'm7', name: 'Cm7', tab: '4/5:1 3/5:1 2/4:1 1/6:1 | 4/8:1 3/8:1 2/8:1 1/8:1 | 4/10:1 3/12:1 2/11:1 1/11:1 | 4/13:1 3/15:1 2/13:1 1/15:1' },
    ] as const
  ).map(({ kind, name, tab: source }): Exercise => ({
    id: `chords-drop-2-${kind}`,
    title: `${name} — drop 2 on the top four strings`,
    area: 'chords',
    level: 3,
    styles: ['jazz'],
    voicings: ['drop-2'],
    techniques: ['position-shift'],
    series: 'drop-2-top-four',
    about: [
      `${name} in its four inversions up the neck, each a bar, each played from the D string to the high E. A drop 2 voicing takes a close-position chord and drops its second-highest note an octave, which is what makes four-note jazz chords fall under four fingers.`,
      'The four shapes are one chord: the same notes with a different one on top. Comping and chord-melody are both a matter of choosing the inversion whose top note you want to hear.',
    ],
    tempoBpm: 72,
    duration: FOUR_PASSES,
    notes: tab(source),
  })),
  {
    id: 'chords-guide-tones-ii-v-i',
    title: 'Dm7 – G7 – Cmaj7 — guide tones',
    area: 'chords',
    level: 2,
    key: 'C',
    styles: ['jazz'],
    contexts: ['major-ii-V-I'],
    about: [
      'The third and seventh of each chord, as half notes: C and F over Dm7, B and F over G7, B and E over Cmaj7. These two notes say what a chord is; everything else can be left to the rest of the band.',
      'Notice how little moves. C slides down to B, then F slides down to E — two half steps carry the whole progression. A solo built on these notes cannot help sounding like the changes.',
    ],
    tempoBpm: 80,
    duration: FOUR_PASSES,
    notes: phrase('C4:2 F4:2 | B3:2 F4:2 | B3:2 E4:2 | E4:4', { min: 5, max: 9 }),
  },
  {
    id: 'chords-guide-tones-cycle',
    title: 'Guide tones around the cycle of dominants',
    area: 'chords',
    level: 3,
    styles: ['jazz'],
    contexts: ['cycle-of-fourths'],
    about: [
      'C7, F7, B♭7, E♭7, A♭7, D♭7, two guide tones to the bar, lower voice first. When dominant chords move round the cycle, the third of one chord falls a half step to become the seventh of the next, and the seventh falls a half step to become the third. The pair just sinks, a fret at a time.',
      'This is the mechanism under every chain of ii–Vs. Hear it once and you will hear it in every standard.',
    ],
    tempoBpm: 84,
    duration: FOUR_PASSES,
    notes: phrase('E4:2 Bb4:2 | Eb4:2 A4:2 | D4:2 Ab4:2 | Db4:2 G4:2 | C4:2 Gb4:2 | B3:2 F4:2 | Bb3:4', { min: 5, max: 9 }),
  },
  {
    id: 'chords-walking-bass-blues',
    title: 'Walking bass through an F blues',
    area: 'chords',
    level: 3,
    key: 'F',
    styles: ['jazz/blues', 'jazz/swing'],
    contexts: ['jazz-blues'],
    about: [
      'A quarter note on every beat, outlining each chord of a twelve-bar jazz blues and arriving at the next root by a half step. Guitarists who can walk a bass line understand harmony from the bottom, and are most of the way to accompanying themselves.',
      'The recipe for a bar: root on one, chord tones on two and three, and on four a note a half step above or below where you are going.',
    ],
    tempoBpm: 108,
    duration: { kind: 'repetitions', count: 2 },
    notes: phrase(
      'F2:1 A2:1 C3:1 B2:1 | Bb2:1 D3:1 F3:1 Gb3:1 | F3:1 Eb3:1 D3:1 C3:1 | F2:1 G2:1 A2:1 B2:1 | ' +
        'Bb2:1 D3:1 F3:1 D3:1 | B2:1 D3:1 F3:1 Ab3:1 | F3:1 A3:1 F3:1 Eb3:1 | D3:1 F#3:1 A3:1 Ab3:1 | ' +
        'G3:1 F3:1 D3:1 Db3:1 | C3:1 E3:1 G3:1 Gb3:1 | F3:1 A3:1 D3:1 F#3:1 | G2:1 Bb2:1 C3:1 Gb2:1',
      { min: 0, max: 4 },
    ),
  },
]
