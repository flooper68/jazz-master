/** Small display helpers for the player chrome. */

export function formatSeconds(totalSeconds: number): string {
  const whole = Math.max(Math.ceil(totalSeconds), 0)
  const minutes = Math.floor(whole / 60)
  const seconds = whole % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

/** "2.3" — one-based bar and beat of an absolute beat position. */
export function formatBarBeat(beat: number, beatsPerBar: number): string {
  const safe = Math.max(beat, 0) + 1e-9
  const bar = Math.floor(safe / beatsPerBar) + 1
  const within = Math.floor(safe - (bar - 1) * beatsPerBar) + 1
  return `${bar}.${Math.min(within, beatsPerBar)}`
}
