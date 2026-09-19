import { useEffect, useRef, useState } from 'react'
import type { Difficulty, Feel } from '../appData/run'
import { heardNothing, matchSpokenAnswer, SPOKEN_ANSWER_PHRASES } from '../appData/voiceAnswer'
import { browserSpeechEngine, type SpeechEngine, type SpeechFailure } from '../audio/speech'
import { MicIcon } from './icons'
import { loadVoiceAnswerOn, saveVoiceAnswerOn } from './voiceAnswerPrefs'

/**
 * Answering the summary out loud, hands still on the guitar: "hard, but loved
 * it" chooses both answers. Recognition happens on the device or not at all
 * (see audio/speech.ts) — the mic is never a way for practice audio to leave
 * the machine.
 *
 * Listening starts on its own when the language pack is there and the player
 * has not turned it off, because reaching for a button defeats the point. The
 * mic is always visible and always the off switch.
 */

/** What the screen is doing, which is also what it tells the player. */
type Phase = 'checking' | 'unsupported' | 'downloadable' | 'installing' | 'off' | 'listening' | 'failed'

export interface VoiceAnswerProps {
  /** Either answer, or both, as they are heard. */
  onAnswer: (part: { difficulty?: Difficulty; feel?: Feel }) => void
  /** Test seam: the browser's on-device recogniser, swapped for a fake in jsdom. */
  createEngine?: (expected: readonly string[]) => SpeechEngine | null
}

const FAILURE_TEXT: Record<SpeechFailure, string> = {
  denied: 'The microphone is blocked for this site — answer by tapping instead.',
  unavailable: 'No microphone the browser will use — answer by tapping instead.',
  'no-speech': 'Nothing heard. Press the mic to listen again.',
  other: 'Voice answers stopped. Press the mic to listen again.',
}

export function VoiceAnswer({ onAnswer, createEngine = browserSpeechEngine }: VoiceAnswerProps) {
  const [phase, setPhase] = useState<Phase>('checking')
  const [failure, setFailure] = useState<SpeechFailure | null>(null)
  // The last thing heard that answered something, said back so the player knows it landed.
  const [heard, setHeard] = useState<string | null>(null)
  const [wanted, setWanted] = useState(loadVoiceAnswerOn)
  // Answering re-renders the summary; the listener must not be torn down for that.
  const answer = useRef(onAnswer)
  answer.current = onAnswer
  const engine = useRef<SpeechEngine | null>(null)
  if (engine.current === null) engine.current = createEngine(SPOKEN_ANSWER_PHRASES)

  // What this browser can do is asked once, of the browser itself — an Effect.
  useEffect(() => {
    let current = true
    const speech = engine.current
    if (!speech) {
      setPhase('unsupported')
      return
    }
    void speech.availableOnDevice().then((availability) => {
      if (!current) return
      if (availability === 'unavailable') return setPhase('unsupported')
      if (availability === 'downloadable') return setPhase('downloadable')
      // 'downloading' still ends up listening: start() waits for the pack.
      setPhase(loadVoiceAnswerOn() ? 'listening' : 'off')
    })
    return () => {
      current = false
    }
  }, [])

  // The microphone itself: opened while listening, closed the moment it is not.
  useEffect(() => {
    const speech = engine.current
    if (!speech || phase !== 'listening') return
    const listener = speech.listen({
      onTranscript: (transcript) => {
        const spoken = matchSpokenAnswer(transcript)
        if (heardNothing(spoken)) return
        setHeard(transcript.trim())
        answer.current({
          ...(spoken.difficulty ? { difficulty: spoken.difficulty } : {}),
          ...(spoken.feel ? { feel: spoken.feel } : {}),
        })
      },
      onFailure: (reason) => {
        setFailure(reason)
        setPhase('failed')
      },
      // Silence ends the service on its own; that is not a failure, just a stop.
      onEnd: () => setPhase((current) => (current === 'listening' ? 'off' : current)),
    })
    listener.start()
    return () => listener.stop()
  }, [phase])

  function toggle(): void {
    if (phase === 'listening') {
      setWanted(false)
      saveVoiceAnswerOn(false)
      setPhase('off')
      return
    }
    setWanted(true)
    saveVoiceAnswerOn(true)
    setFailure(null)
    setPhase('listening')
  }

  async function install(): Promise<void> {
    const speech = engine.current
    if (!speech) return
    setPhase('installing')
    const installed = await speech.install()
    setPhase(installed ? 'listening' : 'unsupported')
  }

  if (phase === 'checking') return null

  if (phase === 'unsupported') {
    return (
      <p className="mt-3 text-center text-xs text-muted">
        Voice answers need on-device speech recognition, which this browser does not offer.
      </p>
    )
  }

  if (phase === 'downloadable' || phase === 'installing') {
    return (
      <div className="mt-3 text-center">
        <button
          type="button"
          onClick={() => void install()}
          disabled={phase === 'installing'}
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-line bg-panel px-3 py-1.5 text-xs font-medium text-fg hover:border-line-strong disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg [&>svg]:h-3.5 [&>svg]:w-3.5"
        >
          <MicIcon />
          {phase === 'installing' ? 'Getting the voice pack…' : 'Answer out loud'}
        </button>
        <p className="mt-1.5 text-xs text-muted">
          A one-off download, after which nothing you say leaves this device.
        </p>
      </div>
    )
  }

  const listening = phase === 'listening'
  return (
    <div className="mt-3 flex flex-col items-center gap-1.5">
      <button
        type="button"
        onClick={toggle}
        aria-pressed={listening}
        aria-label={listening ? 'Stop listening for a spoken answer' : 'Answer out loud'}
        className="relative inline-flex h-11 w-11 cursor-pointer items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
      >
        {listening && (
          <>
            <span aria-hidden="true" className="mic-ring absolute inset-0 rounded-full bg-accent/40" />
            <span aria-hidden="true" className="mic-ring-late absolute inset-0 rounded-full bg-accent/40" />
          </>
        )}
        <span
          className={`${listening ? 'mic-breathe border-accent bg-accent text-on-accent' : 'border-line bg-panel text-muted hover:border-line-strong'} relative inline-flex h-11 w-11 items-center justify-center rounded-full border [&>svg]:h-4 [&>svg]:w-4`}
        >
          <MicIcon />
        </span>
      </button>
      <p className="text-xs text-muted" aria-live="polite">
        {phase === 'failed' && failure
          ? FAILURE_TEXT[failure]
          : listening
            ? (heard ?? 'Listening — say how it went, and how it felt')
            : wanted
              ? 'Press the mic to answer out loud'
              : 'Voice answers are off'}
      </p>
    </div>
  )
}
