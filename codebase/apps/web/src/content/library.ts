/**
 * Where an exercise comes from. The pack ships in code; a user's own
 * exercises live in their library and carry a namespaced id, so the two can
 * never be confused and anything holding only an id can tell them apart.
 */
export const LIBRARY_ID_PREFIX = 'user-'

export type ExerciseSource = 'pack' | 'yours'

export function isLibraryExerciseId(exerciseId: string): boolean {
  return exerciseId.startsWith(LIBRARY_ID_PREFIX)
}

export function exerciseSource(exerciseId: string): ExerciseSource {
  return isLibraryExerciseId(exerciseId) ? 'yours' : 'pack'
}
