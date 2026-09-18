export { EXERCISES } from './exercises'
export { scaleTab } from './authoring'
export { exerciseSeconds, noteIndexAt, noteStarts, passBeats } from './timeline'
export { validateExercises, type ExerciseProblem } from './validate'
export { DEFAULT_BEATS_PER_BAR } from './types'
export { clampTransposition, HIGHEST_TRANSPOSED_FRET, homeLabel, transposeExercise, transposeRange, type TransposeRange } from './transpose'
export { exerciseSource, isLibraryExerciseId, LIBRARY_ID_PREFIX, type ExerciseSource } from './library'
export { exerciseShape, type ExerciseShape, type ShapePosition } from './shape'
export { isChord, midisOf, stringsOf } from './stack'
export {
  activeFilterCount,
  EVERYTHING,
  EXERCISE_FACETS,
  EXERCISE_POSITIONS,
  exercisePosition,
  facetCounts,
  filterExercises,
  toggleFacetValue,
  type ExerciseFacet,
  type ExercisePosition,
  type ExerciseQuery,
  type FacetCounts,
  type FacetOptions,
} from './filter'
export type {
  Exercise,
  ExerciseDuration,
  StringFret,
  TabNote,
} from './types'
export {
  EXERCISE_AREAS,
  EXERCISE_CONTEXTS,
  EXERCISE_FEELS,
  EXERCISE_STYLES,
  EXERCISE_TECHNIQUES,
  EXERCISE_VOICINGS,
  STYLE_FAMILIES,
  styleFamily,
  styleMatches,
  stylesWithin,
  type ExerciseArea,
  type ExerciseContext,
  type ExerciseFeel,
  type ExerciseStyle,
  type ExerciseTechnique,
  type ExerciseVoicing,
} from './taxonomy'
