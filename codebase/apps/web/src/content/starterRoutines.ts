import type { RoutineInput } from '../appData/routine'

/**
 * The routines a new user starts with, so Routines and Quick run have
 * something to offer on day one. They are copied into the user's account
 * once, and are then theirs like any other — to rename, reorder or delete;
 * deleting them does not bring them back. Built from the pack only, which
 * every user has.
 */
export const STARTER_ROUTINES: readonly RoutineInput[] = [
  {
    name: 'Open-position warm-up',
    about: 'The major scale in three keys, slow and even — a few minutes to wake the hands up.',
    items: [
      { exerciseId: 'scales-major-open-c' },
      { exerciseId: 'scales-major-open-g' },
      { exerciseId: 'scales-major-open-f' },
    ],
  },
  {
    name: 'ii–V–I in F',
    about: 'Chord tones first, then the line that connects them.',
    items: [{ exerciseId: 'lines-ii-v-i-f-arpeggios' }, { exerciseId: 'lines-ii-v-i-f-line' }],
  },
  {
    name: 'Ten-minute warm-up',
    about: 'Hands first, then ears: the spider, one note in three subdivisions, a scale and its thirds.',
    items: [
      { exerciseId: 'technique-spider-1234' },
      { exerciseId: 'technique-subdivisions' },
      { exerciseId: 'scales-major-position-3' },
      { exerciseId: 'patterns-thirds' },
    ],
  },
  {
    name: 'Blues basics',
    about: 'Box 1, the blue note, the chords of the twelve bars, three licks, and a chorus that puts them together.',
    items: [
      { exerciseId: 'scales-minor-pentatonic-box-1' },
      { exerciseId: 'scales-blues-a' },
      { exerciseId: 'arpeggios-twelve-bar-blues' },
      { exerciseId: 'lines-blues-box-one-lick-1' },
      { exerciseId: 'lines-blues-box-one-lick-2' },
      { exerciseId: 'lines-blues-box-one-lick-3' },
      { exerciseId: 'etudes-blues-in-a' },
    ],
  },
  {
    name: 'Bebop basics',
    about: 'What bebop lines are made of — the extra note, the approach, the enclosure — then lines that use them.',
    items: [
      { exerciseId: 'scales-bebop-dominant-g' },
      { exerciseId: 'patterns-chromatic-approach' },
      { exerciseId: 'patterns-enclosures' },
      { exerciseId: 'arpeggios-three-to-nine' },
      { exerciseId: 'lines-bebop-scale-descending' },
      { exerciseId: 'lines-ii-v-i-c-enclosures' },
    ],
  },
  {
    name: 'Rock lead basics',
    about: 'The pentatonic in sequences, a riff, a repeating lick, and a solo over four chords.',
    items: [
      { exerciseId: 'scales-minor-pentatonic-box-1' },
      { exerciseId: 'patterns-pentatonic-threes' },
      { exerciseId: 'lines-rock-low-string-riff' },
      { exerciseId: 'lines-rock-repeating-lick' },
      { exerciseId: 'etudes-rock-solo' },
    ],
  },
]
