import { useEffect, useState, useSyncExternalStore } from 'react'
import type { PlayerAudio } from '../audio/engine'
import { DEFAULT_BEATS_PER_BAR, type Exercise } from '../content'
import { createTransport, type Transport, type TransportSnapshot } from './transport'

interface PlayerTransportOptions {
  createAudio?: () => PlayerAudio
  now?: () => number
}

/**
 * One transport per mounted exercise (the player keys on the exercise id),
 * disposed when the component goes. StrictMode mounts effects twice in
 * development, disposing the first transport on its simulated unmount, so
 * the effect replaces a disposed transport rather than keeping a dead one.
 * The snapshot is read through useSyncExternalStore so React re-renders on
 * transport changes only — the cursor position is polled per frame, not stored.
 */
export function usePlayerTransport(
  exercise: Exercise,
  { createAudio, now }: PlayerTransportOptions = {},
): { transport: Transport; snapshot: TransportSnapshot } {
  const create = () =>
    createTransport({
      notes: exercise.notes,
      beatsPerBar: exercise.beatsPerBar ?? DEFAULT_BEATS_PER_BAR,
      tempoBpm: exercise.tempoBpm,
      repeat: exercise.duration.kind === 'repetitions' ? exercise.duration.count : null,
      createAudio,
      now,
    })
  const [transport, setTransport] = useState(create)
  useEffect(() => {
    if (transport.disposed) {
      setTransport(create())
      return
    }
    return () => transport.dispose()
    // `create` closes over per-mount seams; a new transport is only wanted
    // after a disposal, which `transport` already tracks.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transport])
  const snapshot = useSyncExternalStore(transport.subscribe, transport.getSnapshot, transport.getSnapshot)
  return { transport, snapshot }
}
