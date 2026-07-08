import { describe, expect, it } from 'vitest'
import {
  analyzeTake,
  scoreTake,
  type ExpectedNote,
  type NoteEvent,
} from './index'

const SAMPLE_RATE = 44_100
const NOTE_DURATION_SECONDS = 0.22

describe('take analysis and scoring', () => {
  it('scores a perfect synthesized take at least 95', () => {
    const expected = expectedNotes([
      ['C', 0],
      ['D', 0.35],
      ['Eb', 0.7],
      ['F#', 1.05],
    ])
    const pcm = renderTake([
      [60, 0],
      [62, 0.35],
      [63, 0.7],
      [66, 1.05],
    ])

    const events = analyzeTake(pcm, SAMPLE_RATE)
    const result = scoreTake(events, expected, 'standard')

    expect(events).toHaveLength(4)
    expect(result.score).toBeGreaterThanOrEqual(95)
    expect(result.components).toEqual({
      pitch: 100,
      timing: 100,
      completeness: 100,
    })
    expect(result.perNote.map((note) => note.verdict)).toEqual([
      'correct',
      'correct',
      'correct',
      'correct',
    ])
  })

  it('marks late notes with partial timing credit', () => {
    const expected = expectedNotes([
      ['G', 0],
      ['A', 0.35],
      ['Bb', 0.7],
    ])
    const pcm = renderTake([
      [67, 0.18],
      [69, 0.53],
      [70, 0.88],
    ])

    const result = scoreTake(analyzeTake(pcm, SAMPLE_RATE), expected, 'standard')

    expect(result.perNote.map((note) => note.verdict)).toEqual([
      'late',
      'late',
      'late',
    ])
    expect(result.components.pitch).toBe(100)
    expect(result.components.timing).toBe(50)
    expect(result.score).toBeGreaterThanOrEqual(80)
    expect(result.score).toBeLessThan(95)
  })

  it('marks wrong notes without pitch credit', () => {
    const expected = expectedNotes([
      ['Ab', 0],
      ['Bb', 0.35],
      ['C', 0.7],
    ])
    const pcm = renderTake([
      [68, 0],
      [70, 0.35],
      [62, 0.7],
    ])

    const result = scoreTake(analyzeTake(pcm, SAMPLE_RATE), expected, 'standard')

    expect(result.perNote.map((note) => note.verdict)).toEqual([
      'correct',
      'correct',
      'wrong-pitch',
    ])
    expect(result.components.pitch).toBe(67)
    expect(result.score).toBeLessThan(90)
  })

  it('marks missed notes and lowers completeness', () => {
    const expected = expectedNotes([
      ['E', 0],
      ['F#', 0.35],
      ['G#', 0.7],
      ['B', 1.05],
    ])
    const pcm = renderTake([
      [64, 0],
      [66, 0.35],
      [71, 1.05],
    ])

    const result = scoreTake(analyzeTake(pcm, SAMPLE_RATE), expected, 'standard')

    expect(result.perNote.map((note) => note.verdict)).toEqual([
      'correct',
      'correct',
      'missed',
      'correct',
    ])
    expect(result.components.completeness).toBe(75)
    expect(result.score).toBeLessThan(90)
  })

  it('tracks inserted extras as a completeness penalty', () => {
    const expected = expectedNotes([
      ['C', 0],
      ['D', 0.55],
      ['E', 1.1],
    ])
    const pcm = renderTake([
      [60, 0],
      [61, 0.28],
      [62, 0.55],
      [64, 1.1],
    ])

    const result = scoreTake(analyzeTake(pcm, SAMPLE_RATE), expected, 'standard')

    expect(result.perNote.map((note) => note.verdict)).toEqual([
      'correct',
      'correct',
      'correct',
    ])
    expect(result.extras).toHaveLength(1)
    expect(result.components.completeness).toBe(83)
    expect(result.score).toBeLessThan(100)
  })

  it('prefers a pitch-compatible event over a closer wrong inserted event', () => {
    const expected = expectedNotes([['D', 0.5]])
    const wrongInserted = eventForMidi(61, 0.48)
    const playedTarget = eventForMidi(62, 0.58)

    const result = scoreTake(
      [wrongInserted, playedTarget],
      expected,
      'standard',
    )

    expect(result.perNote[0].verdict).toBe('correct')
    expect(result.perNote[0].event).toBe(playedTarget)
    expect(result.extras).toEqual([wrongInserted])
  })

  it('scores octave-shifted detector output as pitch-correct', () => {
    const expected = expectedNotes([
      ['Db', 0],
      ['Eb', 0.35],
      ['Gb', 0.7],
      ['Ab', 1.05],
    ])
    const pcm = renderTake([
      [73, 0],
      [75, 0.35],
      [78, 0.7],
      [80, 1.05],
    ])

    const result = scoreTake(analyzeTake(pcm, SAMPLE_RATE), expected, 'standard')

    expect(result.score).toBeGreaterThanOrEqual(95)
    expect(result.perNote.every((note) => note.pitchClassMatched)).toBe(true)
  })

  it('scores an empty take as zero without throwing', () => {
    const expected = expectedNotes([
      ['C', 0],
      ['D', 0.35],
    ])

    const result = scoreTake(analyzeTake(new Float32Array(0), SAMPLE_RATE), expected)

    expect(result.score).toBe(0)
    expect(result.components).toEqual({
      pitch: 0,
      timing: 0,
      completeness: 0,
    })
    expect(result.perNote.map((note) => note.verdict)).toEqual([
      'missed',
      'missed',
    ])
  })

  it('applies strict and lenient timing presets around the same event', () => {
    const expected = expectedNotes([['C', 0]])
    const event: NoteEvent = {
      onsetSeconds: 0.12,
      durationSeconds: 0.2,
      frequencyHz: midiToFrequency(60),
      midi: 60,
      pitchClass: 0,
      centsFromNearestSemitone: 0,
      clarity: 0.99,
    }

    expect(scoreTake([event], expected, 'strict').perNote[0].verdict).toBe('late')
    expect(scoreTake([event], expected, 'lenient').perNote[0].verdict).toBe(
      'correct',
    )
  })
})

function eventForMidi(midi: number, onsetSeconds: number): NoteEvent {
  return {
    onsetSeconds,
    durationSeconds: 0.2,
    frequencyHz: midiToFrequency(midi),
    midi,
    pitchClass: ((midi % 12) + 12) % 12,
    centsFromNearestSemitone: 0,
    clarity: 0.99,
  }
}

function expectedNotes(
  notes: readonly (readonly [note: string, onsetSeconds: number])[],
): ExpectedNote[] {
  return notes.map(([note, onsetSeconds], index) => ({
    id: `expected-${index}`,
    note,
    onsetSeconds,
  }))
}

function renderTake(
  notes: readonly (readonly [midi: number, onsetSeconds: number])[],
): Float32Array {
  const durationSeconds =
    Math.max(...notes.map(([, onset]) => onset), 0) + NOTE_DURATION_SECONDS + 0.2
  const pcm = new Float32Array(Math.ceil(durationSeconds * SAMPLE_RATE))
  for (const [midi, onsetSeconds] of notes) {
    renderSineNote(pcm, midiToFrequency(midi), onsetSeconds)
  }
  return pcm
}

function renderSineNote(
  pcm: Float32Array,
  frequencyHz: number,
  onsetSeconds: number,
): void {
  const startSample = Math.round(onsetSeconds * SAMPLE_RATE)
  const noteSamples = Math.round(NOTE_DURATION_SECONDS * SAMPLE_RATE)
  for (let offset = 0; offset < noteSamples; offset += 1) {
    const sampleIndex = startSample + offset
    if (sampleIndex >= pcm.length) return
    const phase = (2 * Math.PI * frequencyHz * offset) / SAMPLE_RATE
    const envelope = amplitudeEnvelope(offset / noteSamples)
    pcm[sampleIndex] += Math.sin(phase) * envelope * 0.6
  }
}

function amplitudeEnvelope(progress: number): number {
  if (progress < 0.08) return progress / 0.08
  if (progress > 0.88) return (1 - progress) / 0.12
  return 1
}

function midiToFrequency(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12)
}
