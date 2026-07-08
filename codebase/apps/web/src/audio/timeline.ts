import type { PositionedNote } from '@jazz-master/theory'
import { midiForPosition } from './notes'

export type PlayAlongPatternEvent =
  | {
      kind: 'note'
      id: string
      midi: number
      offsetBeats: number
      durationBeats: number
      velocity: number
    }
  | {
      kind: 'click'
      id: string
      offsetBeats: number
      accent: boolean
    }

export interface PlayAlongPattern {
  events: readonly PlayAlongPatternEvent[]
  lengthBeats: number
}

export const EIGHTH_NOTE_BEATS = 0.5
export const DEFAULT_NOTE_DURATION_BEATS = 0.45

export function secondsPerBeat(tempoBpm: number): number {
  if (!Number.isFinite(tempoBpm) || tempoBpm <= 0) {
    throw new Error(`Invalid tempo BPM: ${tempoBpm}`)
  }
  return 60 / tempoBpm
}

export function createExercisePattern(
  positions: readonly PositionedNote[],
): PlayAlongPattern {
  const noteEvents = positions.map((position, index) => ({
    kind: 'note' as const,
    id: `note-${index}`,
    midi: midiForPosition(position),
    offsetBeats: index * EIGHTH_NOTE_BEATS,
    durationBeats: DEFAULT_NOTE_DURATION_BEATS,
    velocity: 96,
  }))
  const lengthBeats = Math.max(
    EIGHTH_NOTE_BEATS,
    positions.length * EIGHTH_NOTE_BEATS,
  )
  const clickEvents: PlayAlongPatternEvent[] = []
  for (let beat = 0; beat < Math.ceil(lengthBeats); beat += 1) {
    clickEvents.push({
      kind: 'click',
      id: `click-${beat}`,
      offsetBeats: beat,
      accent: beat % 4 === 0,
    })
  }
  return {
    events: [...clickEvents, ...noteEvents].sort(comparePatternEvents),
    lengthBeats,
  }
}

export function createClickPattern(beats = 4): PlayAlongPattern {
  if (!Number.isInteger(beats) || beats <= 0) {
    throw new Error(`Invalid click pattern length: ${beats}`)
  }
  return {
    lengthBeats: beats,
    events: Array.from({ length: beats }, (_, beat) => ({
      kind: 'click' as const,
      id: `click-${beat}`,
      offsetBeats: beat,
      accent: beat % 4 === 0,
    })),
  }
}

function comparePatternEvents(
  left: PlayAlongPatternEvent,
  right: PlayAlongPatternEvent,
): number {
  if (left.offsetBeats !== right.offsetBeats) {
    return left.offsetBeats - right.offsetBeats
  }
  if (left.kind === right.kind) return left.id.localeCompare(right.id)
  return left.kind === 'click' ? -1 : 1
}
