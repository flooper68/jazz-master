import type { PositionedNote } from '@jazz-master/theory'

/**
 * VexFlow-style duration code. Only straight eighths exist until the exercise
 * model grows a real rhythm field (ADR-010 decision 4) — the union is the seam
 * that field will widen.
 */
export type NoteDuration = '8'

/** One playable event: a positioned, spelled note with a derived duration. */
export interface RhythmicNote {
  position: PositionedNote
  duration: NoteDuration
}

/** A 4/4 bar of derived events; beams are index groups into `notes`. */
export interface NotationMeasure {
  notes: readonly RhythmicNote[]
  beams: readonly (readonly number[])[]
}

const EIGHTHS_PER_MEASURE = 8
const BEAM_GROUP = 4

/**
 * Derive a default rhythm for an exercise's resolved positions: straight
 * eighths in 4/4, split into bars of eight (last bar may be short), beamed in
 * groups of four (a trailing group beams only if it has at least two notes).
 */
export function deriveRhythm(
  positions: readonly PositionedNote[],
): NotationMeasure[] {
  const measures: NotationMeasure[] = []
  for (let start = 0; start < positions.length; start += EIGHTHS_PER_MEASURE) {
    const chunk = positions.slice(start, start + EIGHTHS_PER_MEASURE)
    const notes = chunk.map((position) => ({
      position,
      duration: '8' as const,
    }))
    const beams: number[][] = []
    for (let first = 0; first < notes.length; first += BEAM_GROUP) {
      const group = notes
        .slice(first, first + BEAM_GROUP)
        .map((_, i) => first + i)
      if (group.length >= 2) beams.push(group)
    }
    measures.push({ notes, beams })
  }
  return measures
}
