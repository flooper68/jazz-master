import type { FretRange } from '@jazz-master/theory'
import { arpeggioRun, arpeggiosThrough, phrase, tab, type ChordKind, type ChordOfBar } from '../authoring'
import type { Exercise } from '../types'

const FOUR_PASSES = { kind: 'repetitions', count: 4 } as const
const TWO_PASSES = { kind: 'repetitions', count: 2 } as const

function chord(root: string, kind: ChordKind): ChordOfBar {
  return { root, chord: kind }
}

/** A progression a bar per chord, closed with a whole note on the root it comes home to. */
function throughAndHome(bars: readonly (readonly ChordOfBar[])[], window: FretRange, home: string): Exercise['notes'] {
  return [...arpeggiosThrough(bars, window), ...phrase(`${home}:4`, window)]
}

const TRIAD_WINDOWS: readonly FretRange[] = [{ min: 2, max: 5 }, { min: 5, max: 8 }, { min: 7, max: 10 }]

const TRIADS: readonly Exercise[] = [
  ...TRIAD_WINDOWS.map((window, index): Exercise => ({
    id: `arpeggios-major-triad-c-${index + 1}`,
    title: `C major triad — position ${index + 1} of 3`,
    area: 'arpeggios',
    level: 2,
    key: 'C',
    series: 'major-triad-positions',
    about: [
      index === 0
        ? 'C, E, G — nothing else — through every string of the position. The triad is the skeleton of all harmony; seventh chords and extensions are decoration on top of it. Three positions cover the neck from the second fret to the tenth.'
        : 'The same three notes further up the neck. Find the chord shape hiding inside the arpeggio: every one of these is a C chord you already know, played a note at a time.',
    ],
    tempoBpm: 72,
    duration: FOUR_PASSES,
    notes: arpeggioRun('C', 'major', window),
  })),
  ...TRIAD_WINDOWS.map((window, index): Exercise => ({
    id: `arpeggios-minor-triad-a-${index + 1}`,
    title: `A minor triad — position ${index + 1} of 3`,
    area: 'arpeggios',
    level: 2,
    key: 'C',
    tonic: 'A',
    series: 'minor-triad-positions',
    about: [
      index === 0
        ? 'A, C, E. It shares two of its three notes with C major, which is why the two chords swap for each other so easily. Move one note of the C triad — G up to A — and you have its relative minor.'
        : 'A minor again, higher up. Compare each position with the C major triad in the same place: two notes stay, one moves.',
    ],
    tempoBpm: 72,
    duration: FOUR_PASSES,
    notes: arpeggioRun('A', 'minor', window),
  })),
  {
    id: 'arpeggios-diminished-augmented',
    title: 'Diminished and augmented triads',
    area: 'arpeggios',
    level: 3,
    about: [
      'The two symmetrical triads. B diminished stacks two minor thirds and wants badly to resolve; C augmented stacks two major thirds and divides the octave into three equal parts, so it sounds the same in every inversion and points nowhere.',
      'Neither is a place to stay. Learn them as the sounds between chords.',
    ],
    tempoBpm: 66,
    duration: FOUR_PASSES,
    notes: [...arpeggioRun('B', 'diminished', { min: 6, max: 10 }), ...arpeggioRun('C', 'augmented', { min: 7, max: 11 })],
  },
]

const SEVENTH_KINDS: readonly { kind: ChordKind; name: string; level: number; about: string }[] = [
  { kind: 'maj7', name: 'Cmaj7', level: 2, about: 'C, E, G, B: the major triad with a major seventh on top. The home chord of jazz — settled, but with a shimmer the plain triad lacks. The seventh is only a half step under the root; hear that closeness.' },
  { kind: '7', name: 'C7', level: 2, about: 'C, E, G, B♭: lower the seventh of Cmaj7 by a half step and the chord stops resting and starts pulling. E and B♭ are a tritone apart, and that interval is the engine of every V–I.' },
  { kind: 'm7', name: 'Cm7', level: 2, about: 'C, E♭, G, B♭: the minor triad with a flat seventh. Soft and stable for a minor chord — the ii of a ii–V–I and the home chord of most modal and funk vamps.' },
  { kind: 'm7b5', name: 'Cm7♭5', level: 3, about: 'C, E♭, G♭, B♭: a minor seventh chord with its fifth lowered, also called half-diminished. It is the ii chord in a minor key, heading for a dominant.' },
  { kind: 'dim7', name: 'Cdim7', level: 3, about: 'C, E♭, G♭, A: minor thirds all the way up, so the shape repeats every three frets and any of its four notes can be called the root. It usually appears as a passing chord, or standing in for a dominant with a flat ninth.' },
]

const SEVENTHS: readonly Exercise[] = SEVENTH_KINDS.flatMap(({ kind, name, level, about }) =>
  [
    { from: 'sixth', window: { min: 7, max: 11 }, where: 'root on the low E string, eighth fret' },
    { from: 'fifth', window: { min: 2, max: 6 }, where: 'root on the A string, third fret' },
  ].map(({ from, window, where }): Exercise => ({
    id: `arpeggios-${kind}-c-root-${from}`,
    title: `${name} arpeggio — root on the ${from} string`,
    area: 'arpeggios',
    level,
    tonic: 'C',
    styles: ['jazz'],
    series: 'seventh-chord-arpeggios',
    about: [about, `Here with the ${where}. Play all five qualities from the same root one after another and listen to one note changing at a time.`],
    tempoBpm: 72,
    duration: FOUR_PASSES,
    notes: arpeggioRun('C', kind, window),
  })),
)

const THROUGH_CHANGES: readonly Exercise[] = [
  {
    id: 'arpeggios-triads-i-iv-v',
    title: 'G – C – D — triads through I–IV–V',
    area: 'arpeggios',
    level: 2,
    key: 'G',
    styles: ['country', 'rock', 'pop', 'folk-acoustic'],
    contexts: ['I-IV-V'],
    about: [
      'The three chords of a thousand songs, each as a bar of arpeggio: G, C, D, then home to G. Playing the chord tones and nothing else is the first step to soloing that follows the chords instead of floating over them.',
    ],
    tempoBpm: 80,
    duration: FOUR_PASSES,
    notes: throughAndHome([[chord('G', 'major')], [chord('C', 'major')], [chord('D', 'major')], [chord('G', 'major')]], { min: 2, max: 6 }, 'G3'),
  },
  {
    id: 'arpeggios-triads-i-v-vi-iv',
    title: 'C – G – Am – F — triads through the pop progression',
    area: 'arpeggios',
    level: 2,
    key: 'C',
    styles: ['pop', 'rock'],
    contexts: ['I-V-vi-IV'],
    about: [
      'I–V–vi–IV: the four chords under more hit songs than any other sequence. A bar of triad for each. Notice how little has to move between C and A minor, and between A minor and F — shared notes are why the progression sounds so smooth.',
    ],
    tempoBpm: 80,
    duration: FOUR_PASSES,
    notes: throughAndHome([[chord('C', 'major')], [chord('G', 'major')], [chord('A', 'minor')], [chord('F', 'major')]], { min: 5, max: 9 }, 'C4'),
  },
  {
    id: 'arpeggios-minor-ii-v-i',
    title: 'Bm7♭5 – E7 – Am7 — the minor ii–V–i',
    area: 'arpeggios',
    level: 3,
    key: 'C',
    tonic: 'A',
    styles: ['jazz'],
    contexts: ['minor-ii-V-i'],
    about: [
      'The minor-key version of the most common cadence in jazz. The ii is half-diminished, the V is a dominant whose third — G♯ — does not belong to the key, and that borrowed note is what makes the arrival on A minor feel like an arrival.',
      'Listen for G♯ in the second bar. It is the only accidental, and the whole progression turns on it.',
    ],
    tempoBpm: 80,
    duration: FOUR_PASSES,
    notes: throughAndHome([[chord('B', 'm7b5')], [chord('E', '7')], [chord('A', 'm7')]], { min: 4, max: 8 }, 'A3'),
  },
  {
    id: 'arpeggios-three-to-nine',
    title: 'Dm7 – G7 – Cmaj7 — arpeggios from the third to the ninth',
    area: 'arpeggios',
    level: 3,
    key: 'C',
    styles: ['jazz/bebop'],
    contexts: ['major-ii-V-I'],
    about: [
      'Start each arpeggio on the third of the chord instead of the root and carry on up to the ninth: over Dm7 that is F–A–C–E, over G7 B–D–F–A, over Cmaj7 E–G–B–D. The bass player has the root; you get the colour.',
      'Look at what you are actually playing — Fmaj7, Bm7♭5, Em7. Every chord has another chord sitting on its third, and that is the most useful substitution in jazz.',
    ],
    tempoBpm: 80,
    duration: FOUR_PASSES,
    notes: throughAndHome([[chord('F', 'maj7')], [chord('B', 'm7b5')], [chord('E', 'm7')]], { min: 5, max: 9 }, 'E4'),
  },
  {
    id: 'arpeggios-chromatic-approach',
    title: 'Dm7 – G7 – Cmaj7 — each arpeggio approached from below',
    area: 'arpeggios',
    level: 3,
    key: 'C',
    styles: ['jazz/bebop'],
    contexts: ['major-ii-V-I'],
    about: [
      'The same three arpeggios, each entered from a half step under its first note: C♯ into D, A♯ into B, D♯ into E. The approach note falls on the beat and the chord tone just after — a small delay that gives a plain arpeggio the accent of a bebop line.',
    ],
    tempoBpm: 80,
    duration: FOUR_PASSES,
    notes: phrase('C#4 D4 F4 A4 C5 A4 F4 D4 | A#3 B3 D4 F4 G4 F4 D4 B3 | D#4 E4 G4 B4 C5 B4 G4 E4 | C4:4', { min: 5, max: 9 }),
  },
  {
    id: 'arpeggios-turnaround',
    title: 'Cmaj7 – A7 – Dm7 – G7 — the turnaround',
    area: 'arpeggios',
    level: 3,
    key: 'C',
    styles: ['jazz', 'jazz/swing'],
    contexts: ['turnaround'],
    about: [
      'I–VI–ii–V, two beats a chord: the two bars that end a chorus and send it round again. Four notes is all the room each chord gets, so there is time for root, third, fifth and seventh and nothing more.',
      'A7 is the surprise — the key says A minor. Its C♯ leads up into D, and that half step is what makes the turnaround turn.',
    ],
    tempoBpm: 84,
    duration: FOUR_PASSES,
    notes: throughAndHome(
      [[chord('C', 'maj7'), chord('A', '7')], [chord('D', 'm7'), chord('G', '7')], [chord('C', 'maj7'), chord('A', '7')], [chord('D', 'm7'), chord('G', '7')]],
      { min: 5, max: 9 },
      'C4',
    ),
  },
  {
    id: 'arpeggios-cycle-of-dominants',
    title: 'Dominant sevenths around the cycle',
    area: 'arpeggios',
    level: 3,
    styles: ['jazz'],
    contexts: ['cycle-of-fourths'],
    about: [
      'C7, F7, B♭7, E♭7 and on round all twelve, two beats each. Every dominant resolves to the next, which is itself a dominant, so the music never gets to rest — the sound of the bridge of rhythm changes, stretched to the full circle.',
    ],
    tempoBpm: 84,
    duration: FOUR_PASSES,
    notes: throughAndHome(
      [
        [chord('C', '7'), chord('F', '7')], [chord('Bb', '7'), chord('Eb', '7')], [chord('Ab', '7'), chord('Db', '7')],
        [chord('Gb', '7'), chord('B', '7')], [chord('E', '7'), chord('A', '7')], [chord('D', '7'), chord('G', '7')],
      ],
      { min: 5, max: 9 },
      'C4',
    ),
  },
  {
    id: 'arpeggios-twelve-bar-blues',
    title: 'A7 – D7 – E7 — arpeggios through a twelve-bar blues',
    area: 'arpeggios',
    level: 2,
    key: 'D',
    tonic: 'A',
    styles: ['blues', 'rock', 'jazz/blues'],
    contexts: ['12-bar-blues'],
    about: [
      'The whole twelve-bar form in A, a dominant seventh arpeggio to the bar. Most blues soloing ignores the changes and stays in one pentatonic box; the players who stand out are the ones who mark the move to D7 in bar five and to E7 in bar nine.',
      'It loops: the last bar is E7, the turnaround, and leads back to the top.',
    ],
    tempoBpm: 100,
    duration: TWO_PASSES,
    notes: arpeggiosThrough(
      ['A', 'D', 'A', 'A', 'D', 'D', 'A', 'A', 'E', 'D', 'A', 'E'].map((root) => [chord(root, '7')]),
      { min: 4, max: 8 },
    ),
  },
  {
    id: 'arpeggios-jazz-blues',
    title: 'F jazz blues — arpeggios through the changes',
    area: 'arpeggios',
    level: 3,
    key: 'F',
    styles: ['jazz/blues', 'jazz/bebop'],
    contexts: ['jazz-blues'],
    about: [
      'The blues as jazz musicians play it: the same twelve bars, with a ii–V into the IV chord, a diminished passing chord in bar six, and a VI7–ii–V turnaround to finish. Bars with two chords get four notes each.',
      'Learn the form by ear from this — being able to hear where you are in the twelve bars matters more than any lick.',
    ],
    tempoBpm: 104,
    duration: TWO_PASSES,
    notes: arpeggiosThrough(
      [
        [chord('F', '7')], [chord('Bb', '7')], [chord('F', '7')], [chord('C', 'm7'), chord('F', '7')],
        [chord('Bb', '7')], [chord('B', 'dim7')], [chord('F', '7')], [chord('A', 'm7'), chord('D', '7')],
        [chord('G', 'm7')], [chord('C', '7')], [chord('F', '7'), chord('D', '7')], [chord('G', 'm7'), chord('C', '7')],
      ],
      { min: 5, max: 9 },
    ),
  },
  {
    id: 'arpeggios-rhythm-changes',
    title: 'Rhythm changes in B♭ — the A section',
    area: 'arpeggios',
    level: 4,
    key: 'Bb',
    styles: ['jazz/bebop'],
    contexts: ['rhythm-changes', 'turnaround'],
    about: [
      'Eight bars, two chords in nearly every one: the first section of the chord sequence that, after the blues, more jazz tunes are built on than any other. Turnaround, turnaround, a move to the IV chord and back, turnaround.',
      'At tempo there is no time to think about any of it. Four notes a chord, slowly, until the hands know the way.',
    ],
    tempoBpm: 96,
    duration: TWO_PASSES,
    notes: arpeggiosThrough(
      [
        [chord('Bb', '6'), chord('G', '7')], [chord('C', 'm7'), chord('F', '7')], [chord('D', 'm7'), chord('G', '7')], [chord('C', 'm7'), chord('F', '7')],
        [chord('F', 'm7'), chord('Bb', '7')], [chord('Eb', '7'), chord('E', 'dim7')], [chord('D', 'm7'), chord('G', '7')], [chord('C', 'm7'), chord('F', '7')],
      ],
      { min: 5, max: 9 },
    ),
  },
]

const COLOURS: readonly Exercise[] = [
  {
    id: 'arpeggios-m6-a',
    title: 'Am6 arpeggio — fifth position',
    area: 'arpeggios',
    level: 3,
    key: 'G',
    tonic: 'A',
    styles: ['jazz/gypsy', 'jazz/swing'],
    about: [
      'A, C, E, F♯. The minor sixth chord is the tonic minor of swing and gypsy jazz — where later styles play Am7, these play Am6, and the F♯ gives it a bittersweet edge.',
      'The same four notes are F♯m7♭5 and, with a D underneath, D9. One arpeggio, three uses.',
    ],
    tempoBpm: 80,
    duration: FOUR_PASSES,
    notes: arpeggioRun('A', 'm6', { min: 4, max: 8 }),
  },
  {
    id: 'arpeggios-minor-major-seventh-a',
    title: 'Am(maj7) arpeggio — fifth position',
    area: 'arpeggios',
    level: 4,
    key: 'C',
    tonic: 'A',
    styles: ['jazz'],
    about: [
      'A minor triad with a major seventh, G♯: the tonic chord of melodic and harmonic minor, tense and cinematic. It most often appears in passing, in the line that falls A–G♯–G–F♯ over a held A minor chord.',
    ],
    tempoBpm: 72,
    duration: FOUR_PASSES,
    notes: arpeggioRun('A', 'mMaj7', { min: 4, max: 8 }),
  },
  {
    id: 'arpeggios-diminished-in-minor-thirds',
    title: 'Diminished seventh — climbing in minor thirds',
    area: 'arpeggios',
    level: 4,
    key: 'C',
    tonic: 'A',
    styles: ['metal', 'classical', 'jazz/gypsy'],
    feel: 'straight-16',
    about: [
      'G♯ diminished seventh, each inversion starting from the next note of the chord — and because the chord is built of equal minor thirds, every inversion is the same shape three frets higher. Then straight back down and home to A.',
      'It is the run violinists and neo-classical guitarists love, and the same four notes are E7♭9 without its root, which is why it resolves so firmly to A minor.',
    ],
    tempoBpm: 60,
    duration: FOUR_PASSES,
    notes: phrase(
      'G#3 B3 D4 F4 B3 D4 F4 G#4 D4 F4 G#4 B4 F4 G#4 B4 D5 | G#4 B4 D5 F5 E5 D5 B4 G#4 F4 D4 B3 G#3 A3:1',
      { min: 9, max: 13 },
      0.25,
    ),
  },
  {
    id: 'arpeggios-classical-study',
    title: 'Am – Dm – E — an arpeggio study for the right hand',
    area: 'arpeggios',
    level: 2,
    key: 'C',
    tonic: 'A',
    styles: ['classical'],
    techniques: ['fingerstyle'],
    feel: 'waltz',
    beatsPerBar: 3,
    about: [
      'Three open chords, held down, with the right hand playing p-i-m-a-m-i: thumb on the bass note, then index, middle, ring and back. It is the pattern of the nineteenth-century studies every classical guitarist starts on.',
      'Hold each chord for its two bars and let everything ring. The thumb note should be a little stronger than the rest — it is the bass line.',
    ],
    tempoBpm: 80,
    duration: FOUR_PASSES,
    notes: tab(
      '5/0 3/2 2/1 1/0 2/1 3/2 | 5/0 3/2 2/1 1/0 2/1 3/2 | 4/0 3/2 2/3 1/1 2/3 3/2 | 4/0 3/2 2/3 1/1 2/3 3/2 | 6/0 3/1 2/0 1/0 2/0 3/1 | 6/0 3/1 2/0 1/0 2/0 3/1 | 5/0 3/2 2/1 1/0 2/1 3/2 | 5/0:3',
    ),
  },
  {
    id: 'arpeggios-andalusian-cadence',
    title: 'Am – G – F – E — the Andalusian cadence',
    area: 'arpeggios',
    level: 2,
    key: 'C',
    tonic: 'A',
    styles: ['latin-flamenco', 'classical', 'rock'],
    techniques: ['fingerstyle'],
    contexts: ['andalusian-cadence'],
    about: [
      'Four chords stepping down from A minor to E major: the harmonic signature of flamenco, and of a long list of rock songs. The last chord is major where the key expects minor, and its G♯ is what makes it sound Spanish.',
      'Fingerstyle, thumb on the bass note of each chord; it loops from E straight back to A minor.',
    ],
    tempoBpm: 80,
    duration: FOUR_PASSES,
    notes: tab(
      '5/0 4/2 3/2 2/1 1/0 2/1 3/2 4/2 | 6/3 4/0 3/0 2/0 1/3 2/0 3/0 4/0 | 4/3 3/2 2/1 1/1 2/1 3/2 4/3 3/2 | 6/0 4/2 3/1 2/0 1/0 2/0 3/1 4/2',
    ),
  },
]

/** The arpeggios area around the founding ii–V–I exercise, which sits after the seventh-chord arpeggios it is made of. */
export const ARPEGGIOS_BEFORE_II_V_I: readonly Exercise[] = [...TRIADS, ...SEVENTHS]
export const ARPEGGIOS_AFTER_II_V_I: readonly Exercise[] = [...THROUGH_CHANGES, ...COLOURS]
