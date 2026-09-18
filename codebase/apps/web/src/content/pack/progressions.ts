import { strum, tab } from '../authoring'
import type { Exercise } from '../types'

/*
 * Chords played as chords: shapes struck whole, in the progressions that
 * carry most of the music people want to play. The chords pack (chords.ts)
 * teaches a shape a note at a time; these are what to do with it once it
 * rings clean. A chord is written as a box — `x32010` is open C, low E to
 * high E — and a progression as chord names with a rhythm; see `strum`.
 */

const FOUR_PASSES = { kind: 'repetitions', count: 4 } as const
const TWO_PASSES = { kind: 'repetitions', count: 2 } as const

/** The open chords, as a chord box writes them. */
const OPEN = {
  C: 'x32010',
  A: 'x02220',
  G: '320003',
  E: '022100',
  D: 'xx0232',
  Am: 'x02210',
  Em: '022000',
  Dm: 'xx0231',
  /** F without the barre: the top four strings, root on the D string. */
  F: 'xx3211',
  E7: '020100',
  A7: 'x02020',
  B7: 'x21202',
} as const

const BARRE = {
  /** The E shape, barred at the first fret. */
  F: '133211',
  /** The A shape, barred at the first fret. */
  Bb: 'x13331',
  C: 'x35553',
} as const

const POWER = { E5: '022xxx', G5: '355xxx', A5: '577xxx' } as const

/** Root, third and seventh — the fifth left out — with the root on the low E or A string. */
const SHELLS = {
  Dm7: 'x535xx',
  G7: '3x34xx',
  Cmaj7: 'x324xx',
  F7: '1x12xx',
  Bb7: 'x101xx',
  C7: 'x323xx',
  Gm7: '3x33xx',
} as const

const DROP_2 = {
  /** C F A D: the seventh in the bass. */
  Dm7: 'x-x-10-10-10-10',
  /** B F G D: the third in the bass. */
  G7: 'x-x-9-10-8-10',
  /** B E G C: the seventh in the bass. */
  Cmaj7: 'x-x-9-9-8-8',
} as const

const QUARTAL = {
  /** E A D G B: fourths, then a third on top. */
  Em11: 'x-7-7-7-8-7',
  Dm11: 'x55565',
} as const

export const PROGRESSIONS: readonly Exercise[] = [
  {
    id: 'chords-strum-g-c-d',
    title: 'G – C – D — open chords, four to the bar',
    area: 'chords',
    level: 1,
    key: 'G',
    styles: ['folk-acoustic', 'country', 'pop', 'rock'],
    contexts: ['I-IV-V'],
    voicings: ['open'],
    techniques: ['strumming'],
    about: [
      'The three chords of a thousand songs, strummed once on every beat: G for a bar, C for a bar, D for a bar, and home to G. The one thing to get right is the change — start moving the fretting hand on beat four, so the new chord is down before beat one.',
      'Strum down through every string of the shape, from the bass note the box marks. If a string thuds instead of ringing, a finger is leaning on it; the open-chords exercise in this area is where to hear which.',
    ],
    tempoBpm: 84,
    duration: FOUR_PASSES,
    notes: strum('G*4 | C*4 | D*4 | G*4', OPEN),
  },
  {
    id: 'chords-strum-c-g-am-f',
    title: 'C – G – Am – F — the four chords',
    area: 'chords',
    level: 1,
    key: 'C',
    styles: ['pop', 'rock', 'folk-acoustic'],
    contexts: ['I-V-vi-IV'],
    voicings: ['open'],
    techniques: ['strumming'],
    about: [
      'I–V–vi–IV, four beats each: the progression under more hit songs than any other. F is the hard one, so it is played here on the top four strings only — no barre — and that small F is a real chord, root, third and fifth, the one most players use on stage anyway.',
      'From C to G the hand turns over; from G to A minor two fingers slide down a string; from A minor to F one finger moves. Find the shortest way between each pair of shapes and the changes take care of themselves.',
    ],
    tempoBpm: 88,
    duration: FOUR_PASSES,
    notes: strum('C*4 | G*4 | Am*4 | F*4', OPEN),
  },
  {
    id: 'chords-boom-chick-g-c-d',
    title: 'G – C – D — bass note, then the chord',
    area: 'chords',
    level: 1,
    key: 'G',
    styles: ['country', 'country/bluegrass', 'folk-acoustic'],
    contexts: ['I-IV-V'],
    voicings: ['open'],
    techniques: ['strumming'],
    about: [
      'The boom-chick that carries country, bluegrass and most folk songs: on one, a single bass note; on two, the chord on the treble strings; on three, a different bass note — the fifth of the chord — and on four the chord again. The bass alternates, and that alternation is the whole feel.',
      'The bass notes are the root and the fifth: G and D for the G chord, C and G for C, D and A for D. Keep the whole shape held down and let the pick choose — the bass note is one string, the chord the three above it.',
    ],
    tempoBpm: 96,
    duration: FOUR_PASSES,
    notes: tab(
      '6/3:1 3/0+2/0+1/3:1 4/0:1 3/0+2/0+1/3:1 | 5/3:1 3/0+2/1+1/0:1 6/3:1 3/0+2/1+1/0:1 | 4/0:1 3/2+2/3+1/2:1 5/0:1 3/2+2/3+1/2:1 | 6/3:1 3/0+2/0+1/3:1 4/0:1 3/0+2/0+1/3:1',
    ),
  },
  {
    id: 'chords-waltz-c-am-f-g',
    title: 'C – Am – F – G — a waltz: bass, strum, strum',
    area: 'chords',
    level: 1,
    key: 'C',
    beatsPerBar: 3,
    feel: 'waltz',
    styles: ['folk-acoustic', 'country'],
    contexts: ['diatonic'],
    voicings: ['open'],
    techniques: ['strumming'],
    about: [
      'Three beats to the bar: the bass note of the chord on one, the chord itself on two and three. It is the accompaniment of every waltz and most lullabies, and the first place a beginner feels a downbeat that is not every other beat.',
      'C, A minor, F, G — the bass notes are C, A, F and G, and every one falls on a different string, so the pick has to find a new string at the start of each bar. Say "one two three" and let one be the heavy one.',
    ],
    tempoBpm: 108,
    duration: FOUR_PASSES,
    notes: tab(
      '5/3:1 4/2+3/0+2/1+1/0:1*2 | 5/0:1 4/2+3/2+2/1+1/0:1*2 | 4/3:1 3/2+2/1+1/1:1*2 | 6/3:1 4/0+3/0+2/0+1/3:1*2',
    ),
  },
  {
    id: 'chords-blues-in-e-open',
    title: 'E7 – A7 – B7 — a twelve-bar blues in open chords',
    area: 'chords',
    level: 2,
    key: 'E',
    styles: ['blues', 'rock'],
    contexts: ['12-bar-blues'],
    voicings: ['open'],
    techniques: ['strumming'],
    about: [
      'The twelve bars in their home key on the guitar, with the three open dominant chords: four bars of E7, two of A7, two of E7, then B7, A7, E7, B7. Every chord is a seventh — that flattened note is what makes it a blues and not a march.',
      'Count the bars out loud until the form is in your body: the change to A7 in bar five, back in bar seven, B7 in bar nine. The last bar, B7, is the turnaround — it points back to the top, so the next pass starts without a gap.',
    ],
    tempoBpm: 104,
    duration: TWO_PASSES,
    notes: strum('E7*4 | E7*4 | E7*4 | E7*4 | A7*4 | A7*4 | E7*4 | E7*4 | B7*4 | A7*4 | E7*4 | B7*4', OPEN),
  },
  {
    id: 'chords-power-chords-e-g-a',
    title: 'E5 – G5 – A5 — power chords in eighths',
    area: 'chords',
    level: 2,
    key: 'G',
    tonic: 'E',
    styles: ['rock', 'metal'],
    contexts: ['modal-vamp'],
    voicings: ['power'],
    techniques: ['palm-mute', 'strumming'],
    feel: 'straight-8',
    about: [
      'Root and fifth on the two lowest strings, the root doubled an octave up: no third, so the chord is neither major nor minor and sits under distortion without turning to mud. Two bars of E5, then G5 and A5 for two beats each, and back to E5 — the riff behind half of rock.',
      'Straight eighths, all downstrokes, the picking hand resting lightly on the strings just in front of the bridge so every stroke is a short, tight chunk. Lift the palm on the last bar and hear the difference.',
    ],
    tempoBpm: 120,
    duration: FOUR_PASSES,
    notes: strum('E5*8 | E5*8 | G5*4 A5*4 | E5*8', POWER, 0.5),
  },
  {
    id: 'chords-barre-f-bb-c',
    title: 'F – B♭ – C — barre chords through I–IV–V',
    area: 'chords',
    level: 2,
    key: 'F',
    styles: ['rock', 'pop', 'blues', 'funk-soul'],
    contexts: ['I-IV-V'],
    voicings: ['barre'],
    techniques: ['strumming'],
    about: [
      'The first fret is where the barre is hardest and where it is learned. F is the open E shape with the first finger laid across all six strings; B♭ and C are the open A shape barred at the first and third frets. Between them, these two shapes give every major chord on the neck.',
      'The barre finger presses with its bony edge, not its soft pad, and the thumb sits behind it in the middle of the neck. Four strums a bar; if the high E string goes quiet halfway through the bar, the hand is tiring — stop, shake it out, and go again at a slower tempo.',
    ],
    tempoBpm: 84,
    duration: FOUR_PASSES,
    notes: strum('F*4 | Bb*4 | C*4 | F*4', BARRE),
  },
  {
    id: 'chords-shells-strummed-ii-v-i',
    title: 'Dm7 – G7 – Cmaj7 — shell voicings, four to the bar',
    area: 'chords',
    level: 2,
    key: 'C',
    styles: ['jazz', 'jazz/swing'],
    contexts: ['major-ii-V-I'],
    voicings: ['shell'],
    techniques: ['strumming'],
    about: [
      'The ii–V–I in three-note shells — root, third, seventh — struck together on every beat, the way Freddie Green drove the Basie band for fifty years. Four even quarter notes a bar, each a short chop, no sustain: the chord is a rhythm instrument here.',
      'The strings between the shell notes are muted by the fretting fingers lying flat, so the whole hand can strum through all six and only three sound. Watch the top note fall by a fret at each change: C to B, F to E. That is the cadence.',
    ],
    tempoBpm: 120,
    duration: FOUR_PASSES,
    notes: strum('Dm7*4 | G7*4 | Cmaj7*4 | Cmaj7*4', SHELLS),
  },
  {
    id: 'chords-jazz-blues-in-f-comping',
    title: 'F blues — three-note voicings, four to the bar',
    area: 'chords',
    level: 3,
    key: 'F',
    styles: ['jazz/swing', 'jazz/blues'],
    contexts: ['jazz-blues'],
    voicings: ['shell'],
    techniques: ['strumming'],
    about: [
      'A twelve-bar blues in F with jazz changes: F7 and B♭7 as in any blues, the quick change to B♭7 in bar two, then Gm7 to C7 in bars nine and ten instead of two bars of the V chord, and C7 in the last bar to turn it round. Four chops a bar throughout.',
      'The shells sit within three frets of each other, roots on the low E and A strings, so the hand hardly moves. Play it with the walking-bass exercise in this area: bass line and chords are the same harmony, from the two ends of the band.',
    ],
    tempoBpm: 126,
    duration: TWO_PASSES,
    notes: strum('F7*4 | Bb7*4 | F7*4 | F7*4 | Bb7*4 | Bb7*4 | F7*4 | F7*4 | Gm7*4 | C7*4 | F7*4 | C7*4', SHELLS),
  },
  {
    id: 'chords-drop-2-ii-v-i',
    title: 'Dm7 – G7 – Cmaj7 — drop 2, one voice moving at a time',
    area: 'chords',
    level: 3,
    key: 'C',
    styles: ['jazz'],
    contexts: ['major-ii-V-I'],
    voicings: ['drop-2'],
    about: [
      'The ii–V–I in four-note drop 2 voicings on the top four strings, chosen so that the least possible moves between them: from Dm7 to G7 only two notes change, and each by a step; from G7 to Cmaj7 the same. Every chord is within a fret of the last — the hand stays at the ninth fret and the fingers do the work.',
      'Two strums a bar, then the tonic held. Listen to the top voice: D, D, C — a melody in its own right, and the reason these three shapes were chosen over the dozen others that spell the same chords. Comping is choosing the inversion whose top note sings.',
    ],
    tempoBpm: 84,
    duration: FOUR_PASSES,
    notes: strum('Dm7:2 Dm7:2 | G7:2 G7:2 | Cmaj7:2 Cmaj7:2 | Cmaj7:4', DROP_2),
  },
  {
    id: 'chords-so-what-voicings',
    title: 'Em11 – Dm11 — the So What voicing',
    area: 'chords',
    level: 3,
    key: 'C',
    tonic: 'D',
    styles: ['jazz/modal'],
    contexts: ['modal-vamp'],
    voicings: ['quartal'],
    about: [
      'Three perfect fourths with a major third on top — the chord Bill Evans answered the bass with on So What, and the sound of modal jazz ever since. Slid down a whole step it is the same shape, and both belong to D Dorian, so the pair can rock back and forth for as long as the vamp lasts.',
      'Because it is built in fourths, the chord has no root to speak of; it is a colour, not a function. Play the two shapes against a low D and hear how neither pulls anywhere. The whole exercise is one fingering on one fret, then two frets lower.',
    ],
    tempoBpm: 132,
    duration: FOUR_PASSES,
    notes: strum('Em11:2 Dm11:2 | Em11:2 Dm11:2 | Em11:1 Dm11:3 | Dm11:4', QUARTAL),
  },
]
