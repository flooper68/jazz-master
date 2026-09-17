/**
 * What an exercise can be labelled with, beyond its area and level. Each facet
 * is a closed vocabulary — an exercise written over MCP has to land on the
 * same words as the pack, or the list cannot filter on them — and the facets
 * overlap freely: an exercise carries every value that is true of it.
 */

/** The one grouping every exercise has, in the order the list reads. */
export const EXERCISE_AREAS = ['technique', 'scales', 'patterns', 'arpeggios', 'chords', 'lines', 'etudes'] as const
export type ExerciseArea = (typeof EXERCISE_AREAS)[number]

/**
 * Styles of music, two levels deep: `jazz/bebop` belongs to `jazz`, and
 * asking for a family finds its children. An exercise with no style is a
 * fundamental: it belongs to every style.
 */
export const EXERCISE_STYLES = [
  'jazz',
  'jazz/swing',
  'jazz/bebop',
  'jazz/blues',
  'jazz/bossa-latin',
  'jazz/gypsy',
  'jazz/modal',
  'jazz/fusion',
  'blues',
  'rock',
  'metal',
  'funk-soul',
  'country',
  'country/bluegrass',
  'folk-acoustic',
  'classical',
  'latin-flamenco',
  'pop',
] as const
export type ExerciseStyle = (typeof EXERCISE_STYLES)[number]

/** The harmony an exercise is played over; none for a bare scale or a technical drill. */
export const EXERCISE_CONTEXTS = [
  'diatonic',
  'I-IV-V',
  'I-V-vi-IV',
  '12-bar-blues',
  'minor-blues',
  'jazz-blues',
  'major-ii-V-I',
  'minor-ii-V-i',
  'turnaround',
  'rhythm-changes',
  'cycle-of-fourths',
  'modal-vamp',
  'andalusian-cadence',
  'substitution',
] as const
export type ExerciseContext = (typeof EXERCISE_CONTEXTS)[number]

/** What the hands are being trained to do. */
export const EXERCISE_TECHNIQUES = [
  'alternate',
  'economy',
  'sweep',
  'hybrid',
  'fingerstyle',
  'travis',
  'rest-stroke',
  'tremolo',
  'palm-mute',
  'strumming',
  'legato',
  'bends',
  'vibrato',
  'slides',
  'tapping',
  'harmonics',
  'double-stops',
  'string-skipping',
  'position-shift',
  'single-string',
] as const
export type ExerciseTechnique = (typeof EXERCISE_TECHNIQUES)[number]

/** How the subdivision is felt; one per exercise. */
export const EXERCISE_FEELS = [
  'straight-8',
  'swing-8',
  'shuffle',
  'triplet-12-8',
  'straight-16',
  'swung-16',
  'bossa',
  'waltz',
] as const
export type ExerciseFeel = (typeof EXERCISE_FEELS)[number]

/** Kinds of chord shape; only meaningful in the chords area. */
export const EXERCISE_VOICINGS = [
  'open',
  'barre',
  'power',
  'triad',
  'shell',
  'drop-2',
  'drop-3',
  'rootless',
  'quartal',
  'double-stop',
] as const
export type ExerciseVoicing = (typeof EXERCISE_VOICINGS)[number]

/** The family a style belongs to: itself for a family, the part before the slash for a child. */
export function styleFamily(style: ExerciseStyle): ExerciseStyle {
  const slash = style.indexOf('/')
  return slash === -1 ? style : (style.slice(0, slash) as ExerciseStyle)
}

export const STYLE_FAMILIES: readonly ExerciseStyle[] = EXERCISE_STYLES.filter((style) => !style.includes('/'))

/** The children of a family, in vocabulary order; empty for a family without any. */
export function stylesWithin(family: ExerciseStyle): ExerciseStyle[] {
  return EXERCISE_STYLES.filter((style) => style !== family && styleFamily(style) === family)
}

/** Whether an exercise tagged `tagged` answers a request for `wanted`: the same style, or a child of the wanted family. */
export function styleMatches(tagged: ExerciseStyle, wanted: ExerciseStyle): boolean {
  return tagged === wanted || styleFamily(tagged) === wanted
}
