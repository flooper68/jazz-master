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
    name: 'Full session',
    about: 'Everything in the pack, from the scales to the bebop line.',
    items: [
      { exerciseId: 'scales-major-open-c' },
      { exerciseId: 'scales-major-open-g' },
      { exerciseId: 'scales-major-open-f' },
      { exerciseId: 'lines-ii-v-i-f-arpeggios' },
      { exerciseId: 'lines-ii-v-i-f-line' },
    ],
  },
]
