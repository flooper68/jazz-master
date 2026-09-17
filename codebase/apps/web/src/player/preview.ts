import { createPlayerAudio, type PlayerAudio } from '../audio/engine'
import type { VoiceId } from '../audio/voices'
import { DEFAULT_BEATS_PER_BAR, type Exercise } from '../content'
import { createTransport, type Transport, type TransportOptions } from './transport'

/**
 * Hearing an exercise from a list: the line once through at its own tempo,
 * on the guitar, with no count-in and no click — a listen, not a practice
 * run, and as long as the exercise is. One exercise sounds at a time;
 * starting another stops the first.
 */

export interface Preview {
  subscribe(listener: () => void): () => void
  /** The exercise sounding now, or null. */
  getPlayingId(): string | null
  /** Play this exercise, or stop it if it is the one playing. */
  toggle(exercise: Exercise, guitar: VoiceId): void
  stop(): void
  /** Stop and let the audio go; the next toggle starts afresh. */
  dispose(): void
}

type PreviewOptions = Pick<TransportOptions, 'createAudio' | 'now' | 'setInterval' | 'clearInterval'>

export function createPreview({ createAudio = () => createPlayerAudio(), ...clocks }: PreviewOptions = {}): Preview {
  const listeners = new Set<() => void>()
  let playingId: string | null = null
  // Kept after the line ends so its last note rings out; disposed by the next play or stop.
  let transport: Transport | null = null
  // One engine for every preview: its loaded guitar samples carry from one press to the
  // next, and a list full of presses never runs the browser out of audio contexts.
  let audio: PlayerAudio | null = null

  function setPlaying(id: string | null): void {
    if (id === playingId) return
    playingId = id
    for (const listener of listeners) listener()
  }

  function stop(): void {
    const ending = transport
    transport = null
    ending?.dispose()
    setPlaying(null)
  }

  /** The shared engine as a transport sees it: disposing the transport silences it, and no more. */
  function lendAudio(): PlayerAudio {
    const shared = (audio ??= createAudio())
    return {
      get now() {
        return shared.now
      },
      get state() {
        return shared.state
      },
      resume: () => shared.resume(),
      click: (time, accent) => shared.click(time, accent),
      pluck: (time, midi, seconds, gain) => shared.pluck(time, midi, seconds, gain),
      setVoice: (voice) => shared.setVoice(voice),
      prime: (midis) => shared.prime(midis),
      silence: () => shared.silence(),
      cancelFrom: (time) => shared.cancelFrom(time),
      dispose: () => shared.silence(),
    }
  }

  return {
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    getPlayingId: () => playingId,
    toggle(exercise, guitar) {
      const wasPlaying = playingId === exercise.id
      stop()
      if (wasPlaying) return
      let next: Transport
      try {
        next = createTransport({
          ...clocks,
          createAudio: lendAudio,
          notes: exercise.notes,
          beatsPerBar: exercise.beatsPerBar ?? DEFAULT_BEATS_PER_BAR,
          tempoBpm: exercise.tempoBpm,
          repeat: 1,
        })
      } catch {
        // An exercise with nothing to play has nothing to preview.
        return
      }
      next.setCountIn(false)
      next.setClick(false)
      next.setGuitar(guitar)
      next.setVoice(true)
      next.subscribe(() => {
        // `finished`, not `stopped`: a transport is also stopped before it starts.
        if (transport === next && next.getSnapshot().finished) setPlaying(null)
      })
      transport = next
      setPlaying(exercise.id)
      next.play()
    },
    stop,
    dispose() {
      stop()
      audio?.dispose()
      audio = null
    },
  }
}
