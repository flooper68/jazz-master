import {
  arpeggio,
  arpeggioPositions,
  parseNote,
  scalePositions,
  spellScale,
  type Note,
  type PositionedNote,
} from '@jazz-master/theory'
import type { Exercise } from './types'

/** An exercise made concrete: spelled notes and where to play them. */
export interface ResolvedExercise {
  notes: Note[]
  positions: PositionedNote[]
}

/**
 * Resolve an exercise's theory reference to notes and fretboard positions.
 * Throws on a broken reference (programmer/content error — validateLessons
 * exists to catch these before anything tries to run the exercise).
 */
export function resolveExercise(exercise: Exercise): ResolvedExercise {
  const { material, window } = exercise
  const root = parseNote(material.root)
  if (!root) {
    throw new Error(
      `Exercise ${exercise.id}: unparseable root "${material.root}"`,
    )
  }
  switch (material.kind) {
    case 'scale':
      return {
        notes: spellScale(root, material.scale),
        positions: scalePositions({ root, type: material.scale }, window),
      }
    case 'arpeggio':
      return {
        notes: arpeggio(root, material.quality),
        positions: arpeggioPositions(
          { root, quality: material.quality },
          window,
        ),
      }
  }
}
