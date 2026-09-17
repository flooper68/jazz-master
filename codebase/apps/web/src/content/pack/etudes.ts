import { phrase } from '../authoring'
import type { Exercise } from '../types'

/*
 * Studies over standard forms, with melodies written for this pack, and tunes
 * old enough to belong to everyone. Chord progressions are common property;
 * the melodies written over them by others are not, so none appear here.
 */

const TWO_PASSES = { kind: 'repetitions', count: 2 } as const
const THREE_PASSES = { kind: 'repetitions', count: 3 } as const

export const ETUDES: readonly Exercise[] = [
  {
    id: 'etudes-ode-to-joy',
    title: 'Ode to Joy',
    area: 'etudes',
    level: 1,
    key: 'G',
    styles: ['classical'],
    about: [
      'Beethoven\'s theme from the Ninth Symphony, in G in the open position. It moves almost entirely by step, inside five notes, with no leaps to find — the first tune many people learn on any instrument, for that reason.',
      'Read it as a melody, not a fingering: hear the two phrases, the first left hanging on A, the second coming home to G.',
    ],
    tempoBpm: 100,
    duration: THREE_PASSES,
    notes: phrase(
      'B3:1 B3:1 C4:1 D4:1 | D4:1 C4:1 B3:1 A3:1 | G3:1 G3:1 A3:1 B3:1 | B3:1.5 A3 A3:2 | B3:1 B3:1 C4:1 D4:1 | D4:1 C4:1 B3:1 A3:1 | G3:1 G3:1 A3:1 B3:1 | A3:1.5 G3 G3:2',
      { min: 0, max: 4 },
    ),
  },
  {
    id: 'etudes-minuet-in-g',
    title: 'Minuet in G — the first eight bars',
    area: 'etudes',
    level: 2,
    key: 'G',
    styles: ['classical'],
    feel: 'waltz',
    beatsPerBar: 3,
    about: [
      'The minuet from the notebook Bach kept for Anna Magdalena — written, it turns out, by Christian Petzold. The melody alone, an octave below the keyboard original, in the open position.',
      'Three beats to the bar, with a lift on the first. The pattern of a quarter note followed by four eighths returns in almost every bar; let the quarter note breathe.',
    ],
    tempoBpm: 104,
    duration: THREE_PASSES,
    notes: phrase(
      'D4:1 G3 A3 B3 C4 | D4:1 G3:1 G3:1 | E4:1 C4 D4 E4 F#4 | G4:1 G3:1 G3:1 | C4:1 D4 C4 B3 A3 | B3:1 C4 B3 A3 G3 | F#3:1 G3 A3 B3 G3 | A3:3',
      { min: 0, max: 4 },
    ),
  },
  {
    id: 'etudes-blues-in-a',
    title: 'Twelve-bar blues in A — a solo study',
    area: 'etudes',
    level: 2,
    key: 'D',
    tonic: 'A',
    styles: ['blues', 'rock'],
    contexts: ['12-bar-blues'],
    feel: 'shuffle',
    about: [
      'One chorus of blues, written to follow the chords. Over A7 it uses C sliding to C♯; over D7 it lands on F♯ and C; over E7 it reaches for G♯. Those are the thirds and sevenths of the three chords, and hitting them as the chord arrives is what separates playing the blues from playing a scale over it.',
      'The form is statement, repeat, answer — bars one to four, five to eight, nine to twelve. The last bar hangs on E7 and turns back to the top.',
    ],
    tempoBpm: 100,
    duration: TWO_PASSES,
    notes: phrase(
      'A3:1 C4 C#4 E4:1 G4 A4 | A4:1 F#4:1 D4:2 | A3:1 C4 C#4 E4:1 G4 E4 | G4 E4 D4 C4 A3:2 | ' +
        'D4:1 F#4 A4 C5:1 A4 F#4 | C5 A4 G4 F#4 D4:2 | E4 G4 A4 C5 A4 G4 E4:1 | D4 C4 A3 C4 A3:2 | ' +
        'B3:1 D4 E4 G#4:1 B4:1 | A4:1 F#4 D4 C4:1 D4:1 | A3 C4 C#4 E4 G4 E4 C#4 A3 | E4:1 D4 B3 G#3:2',
      { min: 4, max: 8 },
    ),
  },
  {
    id: 'etudes-jazz-blues-in-f',
    title: 'Jazz blues in F — a solo study',
    area: 'etudes',
    level: 3,
    key: 'F',
    styles: ['jazz/blues', 'jazz/bebop'],
    contexts: ['jazz-blues'],
    feel: 'swing-8',
    about: [
      'A chorus over the jazz blues changes, written so that each bar spells its chord: E♭ whenever F7 is sounding, A♭ for B♭7, the diminished arpeggio in bar six, F♯ and E♭ over D7, a flat ninth over C7.',
      'Play it against the arpeggio exercise on the same changes and you will hear one as the skeleton of the other. It loops from the last bar straight back to the first.',
    ],
    tempoBpm: 104,
    duration: TWO_PASSES,
    notes: phrase(
      'A3 C4 Eb4 F4 A4:1 F4:1 | Ab4 F4 D4 Bb3 C4 D4 F4:1 | A4:1 C5 A4 G4 F4 D4 C4 | Eb4 G4 Bb4 G4 A4 F4 Eb4 C4 | ' +
        'D4 F4 Ab4 Bb4 Ab4 F4 D4:1 | D4 F4 Ab4 B4 Ab4 F4 D4 B3 | C4 F4 A4 C5 A4:2 | A3 C4 E4 G4 F#4 Eb4 D4 C4 | ' +
        'Bb3 D4 F4 A4 G4:2 | E4 G4 Bb4 Db5 C5 Bb4 G4 E4 | F4 A4 C5 A4 F#4 D4 C4 A3 | Bb3 D4 F4 D4 E4 G4 Bb4 G4',
      { min: 5, max: 9 },
    ),
  },
  {
    id: 'etudes-falling-fifths',
    title: 'A study over falling fifths — major into relative minor',
    area: 'etudes',
    level: 3,
    key: 'G',
    styles: ['jazz', 'jazz/swing'],
    contexts: ['major-ii-V-I', 'minor-ii-V-i'],
    feel: 'swing-8',
    about: [
      'Am7, D7, Gmaj7, Cmaj7, then F♯m7♭5, B7, E minor: a ii–V–I in G running straight on into a ii–V–i in its relative minor. A whole family of standards is built on these eight bars, because every root is a fifth below the last.',
      'Each bar is aimed at the third of the next chord — F♯ for D7, B for G, D♯ for B7 — and the first two arrive by step. Follow those target notes and you can find your way through the form without the page.',
    ],
    tempoBpm: 100,
    duration: TWO_PASSES,
    notes: phrase(
      'A3 C4 E4 G4 C5 B4 A4 G4 | F#4 A4 C5 A4 F#4 E4 D4 C4 | B3 D4 F#4 A4 G4:2 | E4 G4 B4 G4 E4:2 | ' +
        'E4 C4 A3 F#3 A3 C4 E4 F#4 | D#4 F#4 A4 C5 B4 A4 F#4 D#4 | E4 G4 B4 G4 E4 D4 B3 G3 | E3:4',
      { min: 4, max: 8 },
    ),
  },
  {
    id: 'etudes-bossa',
    title: 'A bossa study',
    area: 'etudes',
    level: 3,
    key: 'C',
    styles: ['jazz/bossa-latin'],
    contexts: ['major-ii-V-I', 'turnaround'],
    feel: 'bossa',
    about: [
      'Eight bars over Dm7, G7, Cmaj7, A7 and round again, in the long-short rhythm that runs through bossa nova: a dotted quarter, an eighth pushed ahead of the beat, and then room. Straight eighths throughout — nothing swings.',
      'Nearly every note is a chord tone. Melodies in this style are plain on paper and get their character from placement and touch.',
    ],
    tempoBpm: 126,
    duration: TWO_PASSES,
    notes: phrase(
      'A4:1.5 G4 F4:1 D4:1 | B3:1.5 D4 F4:1 Ab4:1 | G4:1.5 E4 C4:2 | C#4:1 E4:1 G4:1 Bb4:1 | ' +
        'A4:1.5 F4 C5:1 A4:1 | B4:1.5 G4 F4:1 D4:1 | E4:1.5 G4 A4:2 | G4:1 E4:1 C4:2',
      { min: 5, max: 9 },
    ),
  },
  {
    id: 'etudes-dorian',
    title: 'A modal study in D Dorian',
    area: 'etudes',
    level: 3,
    key: 'C',
    tonic: 'D',
    styles: ['jazz/modal'],
    contexts: ['modal-vamp'],
    about: [
      'Eight bars over one chord. With no changes to mark, the study is about pacing: long notes and space in the first half, fourths and a climb to the high D in the second, and a slow descent home.',
      'B natural is the note that makes it Dorian rather than plain minor. It appears three times; hear how it brightens the line each time.',
    ],
    tempoBpm: 104,
    duration: TWO_PASSES,
    notes: phrase(
      'D4:1 E4 F4 A4:1 G4:1 | C5:1.5 B4 A4:2 | D4 G4 C5 G4 A4:1 E4:1 | F4:1 D4:3 | ' +
        'A3 D4 G4 D4 E4 A4 D5:1 | C5 B4 A4 G4 E4:2 | F4 E4 D4 C4 B3 C4 D4:1 | D4:4',
      { min: 7, max: 10 },
    ),
  },
  {
    id: 'etudes-minor-swing-changes',
    title: 'A gypsy jazz study — Am, Dm, E7',
    area: 'etudes',
    level: 3,
    key: 'C',
    tonic: 'A',
    styles: ['jazz/gypsy'],
    contexts: ['minor-ii-V-i', 'minor-blues'],
    techniques: ['rest-stroke'],
    feel: 'swing-8',
    about: [
      'Two bars each of A minor, D minor and E7, and home: the three-chord minor progression at the heart of the gypsy jazz repertoire. The line is nearly all arpeggio, as the style is — Am6 and Dm6 for the minor chords, the diminished arpeggio from G♯ for E7.',
      'Play it hard, with rest strokes, a downstroke on every new string.',
    ],
    tempoBpm: 108,
    duration: TWO_PASSES,
    notes: phrase(
      'A3 C4 E4 F#4 A4 F#4 E4 C4 | B3 C4 E4 A4 C5:2 | D4 F4 A4 B4 D5 B4 A4 F4 | E4 F4 A4 D5 A4:2 | ' +
        'G#4 B4 D5 F5 E5 D5 B4 G#4 | F4 E4 D4 B3 G#3 B3 D4 E4 | A4 G#4 A4 C5 E5 C5 A4 E4 | A3:4',
      { min: 9, max: 13 },
    ),
  },
  {
    id: 'etudes-country',
    title: 'A country study over G, C and D',
    area: 'etudes',
    level: 3,
    key: 'G',
    styles: ['country'],
    contexts: ['I-IV-V'],
    techniques: ['hybrid', 'slides'],
    about: [
      'Eight bars that change scale with the chord, as country players do: G major pentatonic over G, C major pentatonic over C, a D arpeggio over D — each with the slide from minor third to major third that marks the style.',
      'Keep it bright and clipped. If you can, pick the lower notes and pluck the higher ones with the middle finger.',
    ],
    tempoBpm: 104,
    duration: TWO_PASSES,
    notes: phrase(
      'G3 A3 Bb3 B3 D4 E4 D4 B3 | G3 B3 D4 E4 G4:2 | C4 D4 Eb4 E4 G4 A4 G4 E4 | D4 B3 A3 G3 E3 D3 G3:1 | ' +
        'D4 F#4 A4 F#4 D4 C4 A3 F#3 | E4 G4 E4 C4 E4 D4 C4 A3 | B3 D4 G4 D4 B3 A3 G3 A3 | G3:4',
      { min: 2, max: 5 },
    ),
  },
  {
    id: 'etudes-rock-solo',
    title: 'A rock solo study over Am – F – C – G',
    area: 'etudes',
    level: 2,
    key: 'C',
    tonic: 'A',
    styles: ['rock', 'pop'],
    contexts: ['I-V-vi-IV'],
    techniques: ['vibrato', 'bends'],
    about: [
      'Twice round four chords. The first time is mostly long notes hung on chord tones — A, then A over F, G over C, D over G. The second time fills the same outline in with eighths. A solo that starts with melody and adds motion is one the listener can follow.',
      'Everything is A minor pentatonic plus F and B. On a real stage the long notes would be bent into and shaken; play them straight first.',
    ],
    tempoBpm: 92,
    duration: TWO_PASSES,
    notes: phrase(
      'A4:1.5 G4 E4:1 C4:1 | A4:1 C5:1 A4 G4 F4:1 | G4:1.5 E4 C4:1 E4:1 | D4:1 G4:1 B4:2 | ' +
        'A4 C5 A4 G4 E4 G4 A4:1 | F4 A4 C5 A4 F4:2 | E4 G4 C5 G4 E4 D4 C4:1 | B3 D4 G4 D4 B3:2',
      { min: 4, max: 8 },
    ),
  },
]
