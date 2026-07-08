import { parseNote, pitchClass as notePitchClass } from '@jazz-master/theory'

export type TimingVerdict = 'correct' | 'early' | 'late'
export type NoteVerdict = TimingVerdict | 'wrong-pitch' | 'missed'
export type TolerancePreset = 'lenient' | 'standard' | 'strict'

export interface NoteEvent {
  onsetSeconds: number
  durationSeconds: number
  frequencyHz: number
  midi: number
  pitchClass: number
  centsFromNearestSemitone: number
  clarity: number
}

export interface ExpectedNote {
  id: string
  note: string
  onsetSeconds: number
}

export interface ScoringTolerance {
  pitchCents: number
  correctWindowSeconds: number
  partialWindowSeconds: number
}

export interface NoteScore {
  expected: ExpectedNote
  event: NoteEvent | null
  verdict: NoteVerdict
  timingOffsetSeconds: number | null
  pitchClassMatched: boolean
  pitchCents: number | null
  timingCredit: number
  pitchCredit: number
}

export interface ScoreComponents {
  pitch: number
  timing: number
  completeness: number
}

export interface TakeScore {
  score: number
  perNote: NoteScore[]
  components: ScoreComponents
  extras: NoteEvent[]
}

interface FramePitch {
  timeSeconds: number
  frequencyHz: number
  midi: number
  pitchClass: number
  centsFromNearestSemitone: number
  clarity: number
  rms: number
}

export interface AnalyzeTakeOptions {
  windowSize?: number
  hopSize?: number
  minFrequencyHz?: number
  maxFrequencyHz?: number
  minRms?: number
  minClarity?: number
  pitchChangeSemitones?: number
  maxSilentGapSeconds?: number
  attackIgnoreFrames?: number
}

export const TOLERANCE_PRESETS: Record<TolerancePreset, ScoringTolerance> = {
  lenient: {
    pitchCents: 65,
    correctWindowSeconds: 0.15,
    partialWindowSeconds: 0.35,
  },
  standard: {
    pitchCents: 50,
    correctWindowSeconds: 0.1,
    partialWindowSeconds: 0.25,
  },
  strict: {
    pitchCents: 35,
    correctWindowSeconds: 0.06,
    partialWindowSeconds: 0.16,
  },
}

const DEFAULT_ANALYSIS_OPTIONS = {
  windowSize: 2048,
  hopSize: 512,
  minFrequencyHz: 70,
  maxFrequencyHz: 1400,
  minRms: 0.015,
  minClarity: 0.72,
  pitchChangeSemitones: 0.7,
  maxSilentGapSeconds: 0.045,
  attackIgnoreFrames: 2,
} satisfies Required<AnalyzeTakeOptions>

export function analyzeTake(
  pcm: Float32Array,
  sampleRate: number,
  options: AnalyzeTakeOptions = {},
): NoteEvent[] {
  if (!Number.isFinite(sampleRate) || sampleRate <= 0) {
    throw new Error(`Invalid sample rate: ${sampleRate}`)
  }
  if (pcm.length === 0) return []

  const resolved = { ...DEFAULT_ANALYSIS_OPTIONS, ...options }
  if (pcm.length < resolved.windowSize) return []

  const frames: FramePitch[] = []
  for (
    let start = 0;
    start + resolved.windowSize <= pcm.length;
    start += resolved.hopSize
  ) {
    const window = pcm.subarray(start, start + resolved.windowSize)
    const rms = calculateRms(window)
    if (rms < resolved.minRms) continue
    const detected = detectPitchMpm(window, sampleRate, resolved)
    if (!detected) continue
    frames.push({
      timeSeconds: start / sampleRate,
      rms,
      ...detected,
    })
  }

  return framesToEvents(frames, resolved)
}

export function scoreTake(
  events: readonly NoteEvent[],
  expected: readonly ExpectedNote[],
  tolerance: TolerancePreset | ScoringTolerance = 'standard',
): TakeScore {
  const resolved =
    typeof tolerance === 'string' ? TOLERANCE_PRESETS[tolerance] : tolerance
  if (expected.length === 0) {
    return {
      score: 100,
      perNote: [],
      components: { pitch: 100, timing: 100, completeness: 100 },
      extras: [...events],
    }
  }

  const sortedEvents = [...events].sort(
    (left, right) => left.onsetSeconds - right.onsetSeconds,
  )
  const usedEventIndexes = new Set<number>()
  const perNote = [...expected]
    .sort((left, right) => left.onsetSeconds - right.onsetSeconds)
    .map((expectedNote) => {
      const matchIndex = findNearestUnusedEvent(
        sortedEvents,
        usedEventIndexes,
        expectedNote,
        resolved,
      )
      if (matchIndex === null) {
        return missedScore(expectedNote)
      }

      usedEventIndexes.add(matchIndex)
      return scoreMatchedNote(
        expectedNote,
        sortedEvents[matchIndex],
        resolved,
      )
    })

  const extras = sortedEvents.filter((_, index) => !usedEventIndexes.has(index))
  const pitch =
    (perNote.reduce((sum, note) => sum + note.pitchCredit, 0) /
      expected.length) *
    100
  const timing =
    (perNote.reduce((sum, note) => sum + note.timingCredit, 0) /
      expected.length) *
    100
  const matchedCount = perNote.filter((note) => note.event !== null).length
  const completeness =
    Math.max(0, (matchedCount - extras.length * 0.5) / expected.length) * 100

  return {
    score: Math.round(pitch * 0.6 + timing * 0.3 + completeness * 0.1),
    perNote,
    components: {
      pitch: Math.round(pitch),
      timing: Math.round(timing),
      completeness: Math.round(completeness),
    },
    extras,
  }
}

function scoreMatchedNote(
  expected: ExpectedNote,
  event: NoteEvent,
  tolerance: ScoringTolerance,
): NoteScore {
  const expectedPitchClass = pitchClassForExpectedNote(expected)
  const pitchClassMatched = expectedPitchClass === event.pitchClass
  const pitchCents = Math.abs(event.centsFromNearestSemitone)
  const pitchMatched = pitchClassMatched && pitchCents <= tolerance.pitchCents
  const timingOffsetSeconds = event.onsetSeconds - expected.onsetSeconds
  const timingMagnitude = Math.abs(timingOffsetSeconds)

  if (!pitchMatched) {
    return {
      expected,
      event,
      verdict: 'wrong-pitch',
      timingOffsetSeconds,
      pitchClassMatched,
      pitchCents,
      timingCredit: 0,
      pitchCredit: 0,
    }
  }

  if (timingMagnitude <= tolerance.correctWindowSeconds) {
    return {
      expected,
      event,
      verdict: 'correct',
      timingOffsetSeconds,
      pitchClassMatched: true,
      pitchCents,
      timingCredit: 1,
      pitchCredit: 1,
    }
  }

  return {
    expected,
    event,
    verdict: timingOffsetSeconds < 0 ? 'early' : 'late',
    timingOffsetSeconds,
    pitchClassMatched: true,
    pitchCents,
    timingCredit: 0.5,
    pitchCredit: 1,
  }
}

function missedScore(expected: ExpectedNote): NoteScore {
  return {
    expected,
    event: null,
    verdict: 'missed',
    timingOffsetSeconds: null,
    pitchClassMatched: false,
    pitchCents: null,
    timingCredit: 0,
    pitchCredit: 0,
  }
}

function findNearestUnusedEvent(
  events: readonly NoteEvent[],
  usedIndexes: ReadonlySet<number>,
  expected: ExpectedNote,
  tolerance: ScoringTolerance,
): number | null {
  const expectedPitchClass = pitchClassForExpectedNote(expected)
  let bestPitchIndex: number | null = null
  let bestPitchDistance = Number.POSITIVE_INFINITY
  let bestAnyIndex: number | null = null
  let bestAnyDistance = Number.POSITIVE_INFINITY

  for (let index = 0; index < events.length; index += 1) {
    if (usedIndexes.has(index)) continue
    const event = events[index]
    const distance = Math.abs(event.onsetSeconds - expected.onsetSeconds)
    if (distance > tolerance.partialWindowSeconds) continue
    if (distance < bestAnyDistance) {
      bestAnyDistance = distance
      bestAnyIndex = index
    }
    if (
      event.pitchClass === expectedPitchClass &&
      Math.abs(event.centsFromNearestSemitone) <= tolerance.pitchCents &&
      distance < bestPitchDistance
    ) {
      bestPitchDistance = distance
      bestPitchIndex = index
    }
  }
  return bestPitchIndex ?? bestAnyIndex
}

function pitchClassForExpectedNote(expected: ExpectedNote): number {
  const parsed = parseNote(expected.note)
  if (!parsed) {
    throw new Error(`Invalid expected note "${expected.note}"`)
  }
  return notePitchClass(parsed)
}

function framesToEvents(
  frames: readonly FramePitch[],
  options: Required<AnalyzeTakeOptions>,
): NoteEvent[] {
  if (frames.length === 0) return []

  const events: NoteEvent[] = []
  let segment: FramePitch[] = []

  for (const frame of frames) {
    const previous = segment.at(-1)
    const startsNewSegment =
      previous !== undefined &&
      (frame.timeSeconds - previous.timeSeconds >
        options.maxSilentGapSeconds ||
        Math.abs(frame.midi - previous.midi) >= options.pitchChangeSemitones)

    if (startsNewSegment) {
      const event = segmentToEvent(segment, options)
      if (event) events.push(event)
      segment = []
    }
    segment.push(frame)
  }

  const event = segmentToEvent(segment, options)
  if (event) events.push(event)
  return events
}

function segmentToEvent(
  segment: readonly FramePitch[],
  options: Required<AnalyzeTakeOptions>,
): NoteEvent | null {
  if (segment.length === 0) return null
  const stableFrames =
    segment.length > options.attackIgnoreFrames
      ? segment.slice(options.attackIgnoreFrames)
      : segment
  const sortedByFrequency = [...stableFrames].sort(
    (left, right) => left.frequencyHz - right.frequencyHz,
  )
  const medianFrame = sortedByFrequency[Math.floor(sortedByFrequency.length / 2)]
  const last = segment[segment.length - 1]
  return {
    onsetSeconds: segment[0].timeSeconds,
    durationSeconds: Math.max(last.timeSeconds - segment[0].timeSeconds, 0),
    frequencyHz: medianFrame.frequencyHz,
    midi: medianFrame.midi,
    pitchClass: medianFrame.pitchClass,
    centsFromNearestSemitone: medianFrame.centsFromNearestSemitone,
    clarity:
      stableFrames.reduce((sum, frame) => sum + frame.clarity, 0) /
      stableFrames.length,
  }
}

function detectPitchMpm(
  samples: Float32Array,
  sampleRate: number,
  options: Required<AnalyzeTakeOptions>,
): Omit<FramePitch, 'timeSeconds' | 'rms'> | null {
  const prepared = removeDc(samples)
  const minTau = Math.max(1, Math.floor(sampleRate / options.maxFrequencyHz))
  const maxTau = Math.min(
    prepared.length - 2,
    Math.ceil(sampleRate / options.minFrequencyHz),
  )
  if (maxTau <= minTau) return null

  const clarityByTau = new Float32Array(maxTau + 1)
  let bestPeakTau = 0
  let bestPeakClarity = -1
  for (let tau = minTau; tau <= maxTau; tau += 1) {
    clarityByTau[tau] = normalizedSquareDifference(prepared, tau)
  }

  for (let tau = minTau + 1; tau < maxTau; tau += 1) {
    const clarity = clarityByTau[tau]
    if (
      clarity > clarityByTau[tau - 1] &&
      clarity >= clarityByTau[tau + 1] &&
      clarity > bestPeakClarity
    ) {
      bestPeakClarity = clarity
      bestPeakTau = tau
    }
  }

  if (bestPeakTau <= 0 || bestPeakClarity < options.minClarity) return null

  let selectedTau = bestPeakTau
  const strongPeakThreshold = bestPeakClarity * 0.9
  for (let tau = minTau + 1; tau < maxTau; tau += 1) {
    const clarity = clarityByTau[tau]
    if (
      clarity > clarityByTau[tau - 1] &&
      clarity >= clarityByTau[tau + 1] &&
      clarity >= strongPeakThreshold
    ) {
      selectedTau = tau
      break
    }
  }

  const frequencyHz = sampleRate / selectedTau
  if (
    frequencyHz < options.minFrequencyHz ||
    frequencyHz > options.maxFrequencyHz
  ) {
    return null
  }

  const midi = frequencyToMidi(frequencyHz)
  const nearestMidi = Math.round(midi)
  return {
    frequencyHz,
    midi,
    pitchClass: ((nearestMidi % 12) + 12) % 12,
    centsFromNearestSemitone: (midi - nearestMidi) * 100,
    clarity: clarityByTau[selectedTau],
  }
}

function removeDc(samples: Float32Array): Float32Array {
  const mean = samples.reduce((sum, sample) => sum + sample, 0) / samples.length
  const prepared = new Float32Array(samples.length)
  for (let index = 0; index < samples.length; index += 1) {
    prepared[index] = samples[index] - mean
  }
  return prepared
}

function normalizedSquareDifference(samples: Float32Array, tau: number): number {
  let acf = 0
  let divisor = 0
  for (let index = 0; index + tau < samples.length; index += 1) {
    const current = samples[index]
    const shifted = samples[index + tau]
    acf += current * shifted
    divisor += current * current + shifted * shifted
  }
  return divisor === 0 ? 0 : (2 * acf) / divisor
}

function calculateRms(samples: Float32Array): number {
  let sum = 0
  for (const sample of samples) {
    sum += sample * sample
  }
  return Math.sqrt(sum / samples.length)
}

function frequencyToMidi(frequencyHz: number): number {
  return 69 + 12 * Math.log2(frequencyHz / 440)
}
