import { useCallback, useEffect, useRef, useState } from 'react'
import { noteStarts, passBeats, type TabNote } from '../../../content'

/**
 * The landing-page demo: four clicks, then one pass through a tab with the
 * cursor on the sounding note. A prototype stand-in for the real transport
 * (player/usePlayerTransport) — timers and a bare oscillator, no audio engine,
 * so a public page could mount it without the app behind it.
 */

export type CountInPhase = 'idle' | 'counting' | 'playing' | 'done'

export interface CountInDemo {
  phase: CountInPhase
  /** The count that last landed, 1–4, while counting. */
  count: number | null
  /** Index of the sounding note while playing. */
  noteIndex: number | null
  start: () => void
  reset: () => void
}

const COUNTS = 4

export function useCountIn(notes: readonly TabNote[], tempoBpm: number): CountInDemo {
  const [phase, setPhase] = useState<CountInPhase>('idle')
  const [count, setCount] = useState<number | null>(null)
  const [noteIndex, setNoteIndex] = useState<number | null>(null)
  const timers = useRef<number[]>([])
  const audio = useRef<AudioContext | null>(null)

  const clear = useCallback(() => {
    for (const id of timers.current) window.clearTimeout(id)
    timers.current = []
  }, [])

  const click = useCallback((accent: boolean) => {
    try {
      audio.current ??= new AudioContext()
      const ctx = audio.current
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      const now = ctx.currentTime
      osc.type = 'square'
      osc.frequency.value = accent ? 1320 : 880
      gain.gain.setValueAtTime(0.0001, now)
      gain.gain.exponentialRampToValueAtTime(0.16, now + 0.004)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.08)
    } catch {
      // No audio (blocked, or a test environment): the demo still runs silently.
    }
  }, [])

  const reset = useCallback(() => {
    clear()
    setPhase('idle')
    setCount(null)
    setNoteIndex(null)
  }, [clear])

  const start = useCallback(() => {
    clear()
    const beatMs = 60_000 / tempoBpm
    const at = (ms: number, run: () => void) => timers.current.push(window.setTimeout(run, ms))

    setPhase('counting')
    setNoteIndex(null)
    for (let n = 1; n <= COUNTS; n++) {
      at((n - 1) * beatMs, () => {
        setCount(n)
        click(n === 1)
      })
    }

    const downbeat = COUNTS * beatMs
    at(downbeat, () => {
      setPhase('playing')
      setCount(null)
    })
    noteStarts(notes).forEach((beat, index) => at(downbeat + beat * beatMs, () => setNoteIndex(index)))
    const total = passBeats(notes)
    for (let beat = 0; beat < total; beat++) at(downbeat + beat * beatMs, () => click(beat % COUNTS === 0))
    at(downbeat + total * beatMs, () => {
      setPhase('done')
      setNoteIndex(null)
    })
  }, [clear, click, notes, tempoBpm])

  useEffect(() => clear, [clear])

  return { phase, count, noteIndex, start, reset }
}
