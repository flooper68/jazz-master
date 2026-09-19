/**
 * Listening for a spoken answer — on the device, or not at all.
 *
 * Chrome's Web Speech API sends audio to a remote service by default. This
 * app never does: `processLocally` is set, and the listener refuses to start
 * unless `SpeechRecognition.available({ processLocally: true })` says the
 * language pack is installed. A browser without on-device recognition gets no
 * voice answers rather than a quiet upload of someone practising at home.
 *
 * `quality: 'command'` is the honest description of the job — a handful of
 * short words from one speaker — and asks for the smallest language pack.
 */

/** The one language the summary's answers are written in. */
export const SPEECH_LANGS = ['en-US']

export type SpeechAvailability = 'available' | 'downloadable' | 'downloading' | 'unavailable'

/** Why listening stopped, in the terms the screen needs to explain it. */
export type SpeechFailure = 'denied' | 'unavailable' | 'no-speech' | 'other'

export interface SpeechHandlers {
  /** One final phrase, as heard. */
  onTranscript: (transcript: string) => void
  onFailure: (failure: SpeechFailure) => void
  /** The service disconnected — by `stop()`, by silence, or by error. */
  onEnd: () => void
}

export interface SpeechListener {
  start: () => void
  stop: () => void
}

/** How the summary gets a listener; swapped for a fake in tests. */
export interface SpeechEngine {
  /** Whether this browser can recognise the answers without sending audio anywhere. */
  availableOnDevice: () => Promise<SpeechAvailability>
  /** Fetch the on-device language pack. Call from a user gesture. */
  install: () => Promise<boolean>
  listen: (handlers: SpeechHandlers) => SpeechListener
}

/*
 * The slice of the Web Speech API this app uses. Typed here rather than pulled
 * from lib.dom: the on-device additions (`available`, `install`,
 * `processLocally`, `phrases`) are still experimental and not in TypeScript's
 * DOM library yet.
 */
interface SpeechRecognitionResultLike {
  readonly isFinal: boolean
  readonly length: number
  [index: number]: { readonly transcript: string }
}
interface SpeechRecognitionEventLike {
  readonly resultIndex: number
  readonly results: { readonly length: number; [index: number]: SpeechRecognitionResultLike }
}
interface SpeechRecognitionLike {
  lang: string
  continuous: boolean
  interimResults: boolean
  processLocally: boolean
  phrases?: unknown[]
  start: () => void
  abort: () => void
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onerror: ((event: { error: string }) => void) | null
  onend: (() => void) | null
}
interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionLike
  available?: (options: { langs: string[]; quality?: string; processLocally?: boolean }) => Promise<string>
  install?: (options: { langs: string[] }) => Promise<boolean>
}

function recognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null
  // The constructor is still vendor-prefixed in Safari; neither name is in lib.dom's `Window`.
  const holder = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
  return holder.SpeechRecognition ?? holder.webkitSpeechRecognition ?? null
}

/** The phrases the recogniser is told to expect, so "again" is not heard as "a gain". */
function biasPhrases(expected: readonly string[]): unknown[] | null {
  const Phrase = (window as unknown as { SpeechRecognitionPhrase?: new (phrase: string, boost: number) => unknown })
    .SpeechRecognitionPhrase
  if (!Phrase) return null
  return expected.map((phrase) => new Phrase(phrase, 2))
}

function failureOf(error: string): SpeechFailure {
  if (error === 'not-allowed' || error === 'service-not-allowed') return 'denied'
  if (error === 'no-speech') return 'no-speech'
  if (error === 'language-not-supported' || error === 'audio-capture') return 'unavailable'
  return 'other'
}

/** The real browser engine, or null where the API is absent altogether. */
export function browserSpeechEngine(expected: readonly string[]): SpeechEngine | null {
  const Recognition = recognitionConstructor()
  // Without the on-device statics this build would have to fall back to a remote service, so it does not offer voice at all.
  if (!Recognition?.available || !Recognition.install) return null

  return {
    async availableOnDevice() {
      try {
        const state = await Recognition.available!({ langs: SPEECH_LANGS, quality: 'command', processLocally: true })
        return state === 'available' || state === 'downloadable' || state === 'downloading' ? state : 'unavailable'
      } catch {
        return 'unavailable'
      }
    },
    async install() {
      try {
        return await Recognition.install!({ langs: SPEECH_LANGS })
      } catch {
        return false
      }
    },
    listen(handlers) {
      const recognition = new Recognition()
      recognition.lang = SPEECH_LANGS[0]
      recognition.continuous = true
      recognition.interimResults = false
      // The whole point: refuse the remote service rather than fall back to it.
      recognition.processLocally = true
      const phrases = biasPhrases(expected)
      if (phrases) recognition.phrases = phrases
      recognition.onresult = (event) => {
        for (let index = event.resultIndex; index < event.results.length; index += 1) {
          const result = event.results[index]
          if (result.isFinal && result.length > 0) handlers.onTranscript(result[0].transcript)
        }
      }
      recognition.onerror = (event) => handlers.onFailure(failureOf(event.error))
      recognition.onend = () => handlers.onEnd()
      return {
        start: () => recognition.start(),
        // Abort, not stop: nothing said so far is worth one last round trip.
        stop: () => recognition.abort(),
      }
    },
  }
}
