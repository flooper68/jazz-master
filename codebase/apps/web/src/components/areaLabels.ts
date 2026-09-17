import type { ExerciseArea } from '../content'

/** Rendered names for exercise areas (identifiers stay lowercase in code). */
export const AREA_LABELS: Record<ExerciseArea, string> = {
  technique: 'Technique',
  scales: 'Scales',
  patterns: 'Patterns',
  arpeggios: 'Arpeggios',
  chords: 'Chords',
  lines: 'Lines',
  etudes: 'Études',
}

/** Each area keeps one colour everywhere it shows: badges, thumbnails, history. */
export const AREA_BADGE: Record<ExerciseArea, string> = {
  technique: 'bg-muted text-canvas',
  scales: 'bg-blue text-on-blue',
  patterns: 'bg-warning-soft text-warning-text',
  arpeggios: 'bg-lilac text-on-lilac',
  chords: 'bg-success-soft text-success-text',
  lines: 'bg-accent text-on-accent',
  etudes: 'bg-rose text-on-rose',
}
