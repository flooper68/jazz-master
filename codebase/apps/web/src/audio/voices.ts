/**
 * The guitar voices the play-along can use. Synthesized voices are rendered
 * on the spot from a plucked-string model (no assets); sampled voices stream
 * one recording per pitch from the FluidR3 General MIDI soundfont set
 * (MIT-licensed, published by gleitz/midi-js-soundfonts) and fall back to
 * the synth until each note has loaded.
 */

export type VoiceId =
  | 'nylon'
  | 'steel'
  | 'jazz'
  | 'nylon-sampled'
  | 'steel-sampled'
  | 'jazz-sampled'

export interface BodyResonance {
  frequency: number
  q: number
  gainDb: number
}

export interface SynthVoice {
  kind: 'synth'
  id: VoiceId
  label: string
  /** Roughly how long the open string rings before it is gone, seconds. */
  decaySeconds: number
  /** Loop filter blend 0..0.5: smaller keeps more highs (a brighter, wirier string). */
  blend: number
  /** Where the string is plucked, as a fraction of its length. */
  pickPosition: number
  /** One-pole smoothing of the pluck noise, 0..1: more takes the edge off the attack. */
  excitationSmoothing: number
  /** Playback tone control, Hz. */
  toneHz: number
  body: BodyResonance[]
  /** Level relative to the click. */
  level: number
}

export interface SampledVoice {
  kind: 'sampled'
  id: VoiceId
  label: string
  /** Soundfont instrument folder name. */
  instrument: string
  /** Synth voice used while a sample has not loaded (or cannot). */
  fallback: VoiceId
  level: number
}

export type Voice = SynthVoice | SampledVoice

export const VOICES: readonly Voice[] = [
  {
    kind: 'synth',
    id: 'nylon',
    label: 'Nylon (synth)',
    decaySeconds: 2.2,
    blend: 0.5,
    pickPosition: 0.28,
    excitationSmoothing: 0.72,
    toneHz: 3200,
    body: [
      { frequency: 105, q: 4, gainDb: 5 },
      { frequency: 210, q: 3, gainDb: 3 },
    ],
    level: 0.9,
  },
  {
    kind: 'synth',
    id: 'steel',
    label: 'Steel string (synth)',
    decaySeconds: 4,
    blend: 0.3,
    pickPosition: 0.16,
    excitationSmoothing: 0.35,
    toneHz: 6500,
    body: [
      { frequency: 98, q: 5, gainDb: 4 },
      { frequency: 230, q: 3, gainDb: 2.5 },
    ],
    level: 0.75,
  },
  {
    kind: 'synth',
    id: 'jazz',
    label: 'Jazz box (synth)',
    decaySeconds: 5,
    blend: 0.45,
    pickPosition: 0.36,
    excitationSmoothing: 0.85,
    toneHz: 1800,
    body: [
      { frequency: 120, q: 3, gainDb: 6 },
      { frequency: 260, q: 2, gainDb: 3 },
    ],
    level: 1,
  },
  {
    kind: 'sampled',
    id: 'nylon-sampled',
    label: 'Nylon (sampled)',
    instrument: 'acoustic_guitar_nylon',
    fallback: 'nylon',
    level: 0.85,
  },
  {
    kind: 'sampled',
    id: 'steel-sampled',
    label: 'Steel string (sampled)',
    instrument: 'acoustic_guitar_steel',
    fallback: 'steel',
    level: 0.8,
  },
  {
    kind: 'sampled',
    id: 'jazz-sampled',
    label: 'Jazz guitar (sampled)',
    instrument: 'electric_guitar_jazz',
    fallback: 'jazz',
    level: 0.9,
  },
]

export const DEFAULT_VOICE: VoiceId = 'jazz-sampled'

export function voiceById(id: VoiceId): Voice {
  return VOICES.find((voice) => voice.id === id) ?? VOICES[0]
}

export function isVoiceId(value: unknown): value is VoiceId {
  return VOICES.some((voice) => voice.id === value)
}

const SAMPLE_BASE = 'https://cdn.jsdelivr.net/gh/gleitz/midi-js-soundfonts@gh-pages/FluidR3_GM'
const FLAT_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']

/** The soundfont recording for a pitch: `C4.mp3`, `Bb2.mp3` — flats, as that set names them. */
export function sampleUrl(instrument: string, midi: number): string {
  const name = `${FLAT_NAMES[midi % 12]}${Math.floor(midi / 12) - 1}`
  return `${SAMPLE_BASE}/${instrument}-mp3/${name}.mp3`
}
