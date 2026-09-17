import { useEffect, useState, useSyncExternalStore } from 'react'
import { createPreview, type Preview } from './preview'

/**
 * One preview for a whole list, silenced when the list goes. A disposed preview
 * starts afresh on the next press, so StrictMode's simulated unmount costs nothing.
 */
export function useExercisePreview(): { playingId: string | null; toggle: Preview['toggle'] } {
  const [preview] = useState(createPreview)
  useEffect(() => () => preview.dispose(), [preview])
  const playingId = useSyncExternalStore(preview.subscribe, preview.getPlayingId, preview.getPlayingId)
  return { playingId, toggle: preview.toggle }
}
