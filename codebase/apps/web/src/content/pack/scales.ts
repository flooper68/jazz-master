import type { FretRange } from '@jazz-master/theory'
import { closeOnBarLine, scaleRun, tab, threePerStringRun, type SCALE_STEPS } from '../authoring'
import type { Exercise } from '../types'
import type { ExerciseStyle } from '../taxonomy'

const OPEN: FretRange = { min: 0, max: 4 }

const TWO_MINUTES = { kind: 'minutes', minutes: 2 } as const

function openMajor(key: string, about: string[]): Exercise {
  return {
    id: `scales-major-open-${key.toLowerCase()}`,
    title: `${key} major — open position`,
    area: 'scales',
    level: 1,
    key,
    series: 'major-open',
    about,
    tempoBpm: 60,
    duration: TWO_MINUTES,
    notes: scaleRun(key, 'major', OPEN),
  }
}

/** The major scale in the three sharp keys the founding exercises leave out; they follow C, G and F in the list. */
export const OPEN_MAJOR_SCALES: readonly Exercise[] = [
  openMajor('D', [
    'D major has two sharps, F♯ and C♯. In the open position that moves the second-fret notes of C major up to the fourth fret on the D string and the second on the high E — small changes that make a different fingering.',
    'From the lowest note the position has to the highest and back. Say the sharps out loud as you pass them.',
  ]),
  openMajor('A', [
    'Three sharps: F♯, C♯ and G♯. The open A string is the root, so the scale sits comfortably under the hand — this is the key of a great deal of blues, country and rock.',
    'Listen for G♯, the leading note, pulling up into A each time you pass it.',
  ]),
  openMajor('E', [
    'Four sharps, and the guitar\'s own key: the lowest and highest open strings are both the root. Nearly every fretted note here is on the second or fourth fret.',
    'Let the open E strings ring a little under the scale and hear every other note against the root.',
  ]),
]

const PENTATONIC_BOXES: readonly { box: number; window: FretRange; level: number; about: string[] }[] = [
  {
    box: 1,
    window: { min: 5, max: 8 },
    level: 1,
    about: [
      'Five notes — A, C, D, E, G — and the most played shape on the guitar. Two notes on every string, the first finger on the fifth fret throughout: blues, rock, country and a good deal of jazz start here.',
      'Both E strings and the D string carry the root. Know where the three As are and the shape stops being a pattern and becomes a key.',
    ],
  },
  {
    box: 2,
    window: { min: 7, max: 10 },
    level: 2,
    about: [
      'The same five notes one position higher. The upper note of each string in box 1 becomes the lower note here, so the two boxes share a wall — play them back to back and feel the join.',
    ],
  },
  {
    box: 3,
    window: { min: 9, max: 13 },
    level: 2,
    about: [
      'The middle of the neck, and the widest of the five shapes: the G and B strings reach to the twelfth and thirteenth frets. The root is on the A string at the twelfth fret and the B string at the tenth.',
    ],
  },
  {
    box: 4,
    window: { min: 12, max: 15 },
    level: 2,
    about: [
      'Box 4 starts from the octave of the open strings, so every note on the twelfth fret is the open string an octave up. The roots are on the A string and the G string.',
    ],
  },
  {
    box: 5,
    window: { min: 2, max: 5 },
    level: 2,
    about: [
      'The last shape, played here below box 1 so that the top of this box is the bottom of that one. With all five you can play the scale anywhere; the next step is moving between them mid-phrase.',
    ],
  },
]

const MINOR_PENTATONIC: readonly Exercise[] = PENTATONIC_BOXES.map(({ box, window, level, about }) => ({
  id: `scales-minor-pentatonic-box-${box}`,
  title: `A minor pentatonic — box ${box}`,
  area: 'scales' as const,
  level,
  key: 'C',
  tonic: 'A',
  styles: ['blues', 'rock'] as const,
  series: 'minor-pentatonic-boxes',
  about,
  tempoBpm: 70,
  duration: TWO_MINUTES,
  notes: scaleRun('A', 'minorPentatonic', window),
}))

const MAJOR_POSITIONS: readonly { position: number; window: FretRange; about: string[] }[] = [
  {
    position: 1,
    window: { min: 2, max: 5 },
    about: [
      'C major in second position — the first of five fingerings that between them cover the whole neck. Each is built around a chord shape; this one sits around the A-shape C chord at the third fret.',
      'Unlike the open position, these shapes move: slide this one up two frets and it is D major. One fingering, twelve keys.',
    ],
  },
  {
    position: 2,
    window: { min: 4, max: 8 },
    about: [
      'Fifth position, around the G-shape chord. The root is under the fourth finger on the low E string at the eighth fret, and under the first finger on the G string.',
    ],
  },
  {
    position: 3,
    window: { min: 7, max: 10 },
    about: [
      'Seventh position, around the E-shape barre chord at the eighth fret — for most players the most familiar of the five, with the root under the second finger on the low E.',
    ],
  },
  {
    position: 4,
    window: { min: 9, max: 13 },
    about: [
      'Ninth position, around the D-shape. The root is on the D string at the tenth fret and the B string at the thirteenth.',
    ],
  },
  {
    position: 5,
    window: { min: 12, max: 15 },
    about: [
      'Twelfth position, around the C-shape — the open-position C major scale an octave up, with the first finger doing the work of the nut. After this the shapes start again.',
    ],
  },
]

const MAJOR_FIVE_POSITIONS: readonly Exercise[] = MAJOR_POSITIONS.map(({ position, window, about }) => ({
  id: `scales-major-position-${position}`,
  title: `C major — position ${position} of 5`,
  area: 'scales' as const,
  level: 2,
  key: 'C',
  series: 'major-positions',
  about,
  tempoBpm: 72,
  duration: TWO_MINUTES,
  notes: scaleRun('C', 'major', window),
}))

// The seventh pattern is played an octave down, at the second fret: from the fourteenth it would run past where the neck stops being comfortable.
const THREE_PER_STRING: readonly Exercise[] = [3, 5, 7, 8, 10, 12, 2].map((startFret, index) => ({
  id: `scales-major-3nps-${index + 1}`,
  title: `G major — three notes per string, pattern ${index + 1}`,
  area: 'scales' as const,
  level: 3,
  key: 'G',
  styles: ['rock', 'metal', 'jazz/fusion'] as const,
  techniques: ['alternate', 'legato'] as const,
  series: 'major-three-per-string',
  about: [
    index === 0
      ? 'Three notes on every string instead of staying inside four frets. The hand stretches and drifts up the neck, but the picking is identical on every string, which is why fast players like it. There are seven patterns, one from each note of the scale; this one starts on the root.'
      : `Pattern ${index + 1} starts from the ${['root', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh'][index]} of G major on the low E string. Each pattern overlaps the one before it by two notes per string, so learn them in order and connect them as you go.`,
  ],
  tempoBpm: 84,
  duration: TWO_MINUTES,
  notes: threePerStringRun('G', 'major', startFret),
}))

interface PositionScale {
  id: string
  title: string
  root: string
  scale: keyof typeof SCALE_STEPS
  window: FretRange
  level: number
  key?: string
  styles?: readonly ExerciseStyle[]
  about: string[]
  tempoBpm?: number
}

/** One-position scales heard from their own root: up to the top of the position, down to its bottom, back to the root. */
const FROM_THE_ROOT: readonly PositionScale[] = [
  {
    id: 'scales-natural-minor-a',
    title: 'A natural minor — fifth position',
    root: 'A',
    scale: 'naturalMinor',
    window: { min: 4, max: 8 },
    level: 2,
    key: 'C',
    styles: ['rock', 'metal', 'pop', 'classical'],
    about: [
      'The same seven notes as C major, heard from A. Nothing changes under the fingers and everything changes in the ear: start and end on A and the scale turns dark.',
      'It is the minor pentatonic with two notes added, B and F. Find box 1 inside it.',
    ],
  },
  {
    id: 'scales-major-pentatonic-g',
    title: 'G major pentatonic — second position',
    root: 'G',
    scale: 'majorPentatonic',
    window: { min: 2, max: 5 },
    level: 1,
    key: 'G',
    styles: ['country', 'pop', 'rock', 'folk-acoustic'],
    about: [
      'The major scale with its two half-step notes taken out: G, A, B, D, E. Nothing in it can clash with a G chord, which is why it is the sound of country lead, of pop hooks, and of the sweeter side of rock.',
      'It is the same shape as E minor pentatonic — what makes it major is treating G as home.',
    ],
  },
  {
    id: 'scales-blues-a',
    title: 'A blues scale — box 1',
    root: 'A',
    scale: 'blues',
    window: { min: 5, max: 8 },
    level: 1,
    key: 'C',
    styles: ['blues', 'rock', 'jazz/blues'],
    about: [
      'The minor pentatonic with one note added: E♭, the flat fifth, squeezed between D and E. It is a passing note — lean on it and move on, up to E or down to D. Held, it just sounds wrong; passed through, it is the blues.',
    ],
  },
  {
    id: 'scales-major-blues-g',
    title: 'G major blues scale — second position',
    root: 'G',
    scale: 'majorBlues',
    window: { min: 2, max: 5 },
    level: 2,
    key: 'G',
    styles: ['country', 'blues', 'jazz/swing'],
    about: [
      'The major pentatonic plus B♭, the minor third, which slides straight up into B. That one half step from minor to major third is the root of country licks, of swing-era riffs, and of the brighter kind of blues.',
    ],
  },
  {
    id: 'scales-harmonic-minor-a',
    title: 'A harmonic minor — fifth position',
    root: 'A',
    scale: 'harmonicMinor',
    window: { min: 4, max: 8 },
    level: 3,
    key: 'C',
    styles: ['classical', 'metal', 'jazz/gypsy', 'latin-flamenco'],
    about: [
      'Natural minor with the seventh raised: G becomes G♯, so that the V chord, E7, has its major third and pulls properly back to A minor. The gap it opens between F and G♯ — three frets — is the exotic sound of the scale.',
      'This is the scale to play over the V chord in any minor key.',
    ],
  },
  {
    id: 'scales-melodic-minor-a',
    title: 'A melodic minor — fifth position',
    root: 'A',
    scale: 'melodicMinor',
    window: { min: 4, max: 8 },
    level: 3,
    key: 'C',
    styles: ['jazz'],
    about: [
      'A major scale with a minor third: A, B, C, D, E, F♯, G♯. Classical players use it only on the way up; jazz players use it in both directions and call it jazz minor.',
      'It matters less as a minor scale than as a parent: the altered scale and the lydian dominant are both this scale started from another note.',
    ],
  },
  {
    id: 'scales-dorian-d',
    title: 'D Dorian — fifth position',
    root: 'D',
    scale: 'dorian',
    window: { min: 4, max: 8 },
    level: 2,
    key: 'C',
    styles: ['jazz/modal', 'funk-soul', 'rock'],
    about: [
      'C major from its second note. Dorian is a minor scale with a raised sixth — B natural here — and that one bright note keeps it from sounding sad. It is the default scale for a minor seventh chord, and for a one-chord funk or modal vamp.',
    ],
  },
  {
    id: 'scales-mixolydian-g',
    title: 'G Mixolydian — second position',
    root: 'G',
    scale: 'mixolydian',
    window: { min: 2, max: 5 },
    level: 2,
    key: 'C',
    styles: ['blues', 'rock', 'country', 'jazz'],
    about: [
      'C major from its fifth note: a major scale with a flat seventh, F instead of F♯. It spells out a dominant seventh chord, so it fits G7 exactly — the V chord in jazz, and the I chord of a blues.',
    ],
  },
  {
    id: 'scales-lydian-f',
    title: 'F Lydian — seventh position',
    root: 'F',
    scale: 'lydian',
    window: { min: 7, max: 10 },
    level: 3,
    key: 'C',
    styles: ['jazz/fusion', 'rock', 'jazz/modal'],
    about: [
      'C major from its fourth note: a major scale with a raised fourth, B natural over F. The sharp fourth floats where the ordinary fourth would pull — it is the sound of film scores and of major seventh chords that are not going anywhere.',
    ],
  },
  {
    id: 'scales-phrygian-e',
    title: 'E Phrygian — seventh position',
    root: 'E',
    scale: 'phrygian',
    window: { min: 7, max: 10 },
    level: 3,
    key: 'C',
    styles: ['metal', 'latin-flamenco'],
    about: [
      'C major from its third note: a minor scale whose second note is only a half step above the root. F falling to E is the whole character of the mode — Spanish in one setting, menacing in another.',
    ],
  },
  {
    id: 'scales-locrian-b',
    title: 'B Locrian — seventh position',
    root: 'B',
    scale: 'locrian',
    window: { min: 7, max: 10 },
    level: 4,
    key: 'C',
    styles: ['jazz', 'metal'],
    about: [
      'C major from its seventh note. With a flat second and a flat fifth it has no stable home chord, so it is rarely a key — but it is exactly the scale of a half-diminished chord, the ii of every minor ii–V–i.',
    ],
  },
  {
    id: 'scales-phrygian-dominant-e',
    title: 'E Phrygian dominant — fifth position',
    root: 'E',
    scale: 'phrygianDominant',
    window: { min: 4, max: 8 },
    level: 3,
    key: 'C',
    styles: ['latin-flamenco', 'metal', 'jazz/gypsy'],
    about: [
      'A harmonic minor started from its fifth note, E: Phrygian with a major third. The half step above the root and the three-fret gap between F and G♯ together are the sound of flamenco — and of E7 resolving to A minor.',
    ],
  },
  {
    id: 'scales-bebop-dominant-g',
    title: 'G bebop dominant — second position',
    root: 'G',
    scale: 'bebopDominant',
    window: { min: 2, max: 6 },
    level: 3,
    key: 'C',
    styles: ['jazz/bebop'],
    about: [
      'Mixolydian with one chromatic note added, F♯, between the flat seventh and the root. Eight notes instead of seven means that a run of eighth notes starting on a chord tone keeps putting chord tones — G, B, D, F — on the beat. That is the entire trick, and it is why bebop lines sound so sure of themselves.',
      'It works best descending. Play it down from G and listen to what lands on the click.',
    ],
  },
  {
    id: 'scales-bebop-major-c',
    title: 'C bebop major — seventh position',
    root: 'C',
    scale: 'bebopMajor',
    window: { min: 7, max: 10 },
    level: 3,
    key: 'C',
    styles: ['jazz/bebop'],
    about: [
      'The major scale with a passing note between the fifth and sixth: G♯. As with the bebop dominant, the eighth note keeps the chord tones of C6 — C, E, G, A — on the beats of a running line.',
    ],
  },
  {
    id: 'scales-altered-g',
    title: 'G altered scale — second position',
    root: 'G',
    scale: 'altered',
    window: { min: 2, max: 6 },
    level: 4,
    key: 'C',
    styles: ['jazz/bebop', 'jazz/fusion'],
    about: [
      'Every note a dominant chord can have altered: root, ♭9, ♯9, third, ♭5, ♯5, flat seventh. It is the seventh mode of A♭ melodic minor, which is the practical way to find it — play melodic minor a half step above the root of the V chord.',
      'It has no rest in it at all, so it only makes sense resolving. Play it over G7 and land on a note of C major.',
    ],
  },
  {
    id: 'scales-lydian-dominant-g',
    title: 'G Lydian dominant — second position',
    root: 'G',
    scale: 'lydianDominant',
    window: { min: 2, max: 5 },
    level: 4,
    styles: ['jazz'],
    about: [
      'Mixolydian with a raised fourth — the fourth mode of D melodic minor. It is the scale for a dominant chord that is not resolving down a fifth: the tritone substitute, the backdoor ♭VII7, the II7 of a bossa.',
    ],
  },
  {
    id: 'scales-half-whole-diminished-g',
    title: 'G half-whole diminished — second position',
    root: 'G',
    scale: 'halfWholeDiminished',
    window: { min: 2, max: 6 },
    level: 4,
    styles: ['jazz', 'metal'],
    about: [
      'Half step, whole step, repeated: eight notes that divide the octave symmetrically, so the same fingering comes round again every three frets. Over G7 it gives the ♭9, ♯9 and ♯11 while keeping the natural thirteenth — an altered sound with one bright note left in.',
    ],
  },
  {
    id: 'scales-whole-tone-g',
    title: 'G whole-tone scale — second position',
    root: 'G',
    scale: 'wholeTone',
    window: { min: 2, max: 6 },
    level: 3,
    styles: ['jazz'],
    about: [
      'Six notes, all a whole step apart. With no half steps there is nothing to pull anywhere, which gives the floating, dreamlike sound. It fits a dominant chord with a raised fifth, and there are only two of these scales in all of music.',
    ],
  },
  {
    id: 'scales-hungarian-minor-a',
    title: 'A Hungarian minor — fifth position',
    root: 'A',
    scale: 'hungarianMinor',
    window: { min: 4, max: 8 },
    level: 4,
    key: 'C',
    styles: ['jazz/gypsy', 'classical', 'metal'],
    about: [
      'Harmonic minor with the fourth raised as well, so there are two three-fret gaps: C to D♯ and F to G♯. The most dramatic of the minor scales, and a colour gypsy jazz players reach for over a static minor chord.',
    ],
  },
]

const POSITION_SCALES: readonly Exercise[] = FROM_THE_ROOT.map(({ id, title, root, scale, window, level, key, styles, about, tempoBpm }) => ({
  id,
  title,
  area: 'scales' as const,
  level,
  key,
  tonic: root,
  styles,
  about,
  tempoBpm: tempoBpm ?? 76,
  duration: TWO_MINUTES,
  notes: scaleRun(root, scale, window, { fromRoot: true }),
}))

const ALONG_THE_NECK: readonly Exercise[] = [
  {
    id: 'scales-minor-pentatonic-along-the-neck',
    title: 'A minor pentatonic — through all five boxes',
    area: 'scales',
    level: 3,
    key: 'C',
    tonic: 'A',
    styles: ['blues', 'rock'],
    techniques: ['position-shift', 'slides'],
    series: 'minor-pentatonic-boxes',
    about: [
      'Three octaves of A minor pentatonic in one diagonal line, from the fifth fret of the low E to the seventeenth of the high E, passing through every box on the way. This is how the boxes are actually used: not as five places to stand but as one road.',
      'Each shift is made by sliding the finger you are already on. Keep it on the string and let it carry the hand.',
    ],
    tempoBpm: 76,
    duration: TWO_MINUTES,
    notes: closeOnBarLine(
      tab('6/5 6/8 5/5 5/7 5/10 4/7 4/10 4/12 3/9 3/12 3/14 2/13 2/15 1/12 1/15 1/17 1/15 1/12 2/15 2/13 3/14 3/12 3/9 4/12 4/10 4/7 5/10 5/7 5/5 6/8 6/5'),
    ),
  },
  {
    id: 'scales-major-single-string',
    title: 'C major — along the B string',
    area: 'scales',
    level: 2,
    key: 'C',
    techniques: ['single-string', 'position-shift'],
    about: [
      'One string, one octave, first fret to thirteenth. On a single string the scale is laid out like a piano keyboard: whole steps are two frets, half steps are one, and you can see the pattern — two, two, one, two, two, two, one — that makes it major.',
      'Use any fingering that keeps the line smooth. The point is to stop thinking in boxes for a minute and hear distance.',
    ],
    tempoBpm: 66,
    duration: TWO_MINUTES,
    notes: closeOnBarLine(tab('2/1 2/3 2/5 2/6 2/8 2/10 2/12 2/13 2/12 2/10 2/8 2/6 2/5 2/3 2/1')),
  },
]

/** Everything in the scales area after the three founding open-position scales. */
export const SCALES: readonly Exercise[] = [
  ...OPEN_MAJOR_SCALES,
  ...MAJOR_FIVE_POSITIONS,
  ...MINOR_PENTATONIC,
  ...ALONG_THE_NECK,
  ...POSITION_SCALES,
  ...THREE_PER_STRING,
]
