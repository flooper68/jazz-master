import { useEffect, useMemo, useSyncExternalStore } from 'react'
import type { PlayerAudio } from '../audio/engine'
import { DEFAULT_BEATS_PER_BAR, type Exercise } from '../content'
import { createTransport, type Transport, type TransportSnapshot } from './transport'

interface PlayerTransportOptions {
  createAudio?: () => PlayerAudio
  now?: () => number
}

/**
 * One transport per mounted exercise: created with the exercise's tempo and
 * repeat count, disposed when the component goes. The snapshot is read
 * through useSyncExternalStore so React re-renders on transport changes
 * only — the cursor position is polled per frame, not stored.
 */
export function usePlayerTransport(
  exercise: Exercise,
  { createAudio, now }: PlayerTransportOptions = {},
): { transport: Transport; snapshot: TransportSnapshot } {
  const transport = useMemo(
    () =>
      createTransport({
        notes: exercise.notes,
        beatsPerBar: exercise.beatsPerBar ?? DEFAULT_BEATS_PER_BAR,
        tempoBpm: exercise.tempoBpm,
        repeat: exercise.duration.kind === 'repetitions' ? exercise.duration.count : null,
        createAudio,
        now,
      }),
    // A new exercise means a new transport; the seams are stable per mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [exercise],
  )
  useEffect(() => () => transport.dispose(), [transport])
  const snapshot = useSyncExternalStore(transport.subscribe, transport.getSnapshot, transport.getSnapshot)
  return { transport, snapshot }
}
