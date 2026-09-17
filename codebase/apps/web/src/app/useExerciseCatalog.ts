import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { EXERCISES, type Exercise } from '../content'

// Re-exported for the pages, which think of it as part of the catalog.
export { isLibraryExerciseId } from '../content'
import { useTRPC } from './trpc'

export interface ExerciseCatalog {
  /** The pack that ships with the app, then the user's own exercises, oldest first. */
  exercises: readonly Exercise[]
  byId: ReadonlyMap<string, Exercise>
  /** The library has not answered yet, so an unknown library id may still turn up. */
  libraryPending: boolean
}

const PACK_ONLY: readonly Exercise[] = EXERCISES

/**
 * Everything the user can practise: the pack, which is code and always there,
 * joined by their library, which arrives from the server. The pack never
 * waits on the library — a slow or failed read means the pack alone.
 */
export function useExerciseCatalog(): ExerciseCatalog {
  const trpc = useTRPC()
  const { data, isPending } = useQuery(trpc.exercises.list.queryOptions())
  const library = data?.status === 'ok' ? data.exercises : null
  return useMemo(() => {
    const exercises = library && library.length > 0 ? [...EXERCISES, ...library] : PACK_ONLY
    return { exercises, byId: new Map(exercises.map((exercise) => [exercise.id, exercise])), libraryPending: isPending }
  }, [library, isPending])
}
