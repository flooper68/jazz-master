import { useEffect, useRef } from 'react'
import { offerPlayer, type PlayerControls } from './playerTools'

/** Offer the player's tools while a player is mounted; the controls may change every render, the tools stay put. */
export function useAgentPlayerTools(controls: PlayerControls): void {
  const latest = useRef(controls)
  useEffect(() => {
    latest.current = controls
  })
  useEffect(
    () =>
      offerPlayer({
        state: () => latest.current.state(),
        play: () => latest.current.play(),
        pause: () => latest.current.pause(),
        stop: () => latest.current.stop(),
        setTempo: (bpm) => latest.current.setTempo(bpm),
      }),
    [],
  )
}
