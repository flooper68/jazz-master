import type { ExerciseArea } from '../content'

/** Rendered names for exercise areas (identifiers stay lowercase in code). */
export const AREA_LABELS: Record<ExerciseArea, string> = {
  scales: 'Scales',
  arpeggios: 'Arpeggios',
  chords: 'Chords',
  standards: 'Standards',
}

/** Each area keeps one colour everywhere it shows: badges, thumbnails, history. */
export const AREA_BADGE: Record<ExerciseArea, string> = {
  scales: 'bg-blue text-on-blue',
  arpeggios: 'bg-lilac text-on-lilac',
  chords: 'bg-success-soft text-success-text',
  standards: 'bg-accent text-on-accent',
}
