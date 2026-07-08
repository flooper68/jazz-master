import { beforeEach, describe, expect, it } from 'vitest'
import {
  MAX_PLAY_ALONG_TEMPO_BPM,
  MIN_PLAY_ALONG_TEMPO_BPM,
  clampPlayAlongTempo,
  getPlayAlongTempo,
  playAlongTemposStore,
  savePlayAlongTempo,
} from './playAlongTempos'

beforeEach(() => {
  localStorage.clear()
})

describe('playAlongTemposStore', () => {
  it('defaults to the authored tempo for an exercise', () => {
    expect(getPlayAlongTempo('exercise-1', 72)).toBe(72)
  })

  it('saves and reads a tempo per exercise', () => {
    savePlayAlongTempo('exercise-1', 54, 72)
    savePlayAlongTempo('exercise-2', 62, 80)

    expect(getPlayAlongTempo('exercise-1', 72)).toBe(54)
    expect(getPlayAlongTempo('exercise-2', 80)).toBe(62)
  })

  it('clamps tempos to the practice floor and 200 BPM ceiling', () => {
    expect(clampPlayAlongTempo(20, 72)).toBe(MIN_PLAY_ALONG_TEMPO_BPM)
    expect(clampPlayAlongTempo(120, 72)).toBe(120)
    expect(clampPlayAlongTempo(240, 72)).toBe(MAX_PLAY_ALONG_TEMPO_BPM)
    expect(clampPlayAlongTempo(Number.NaN, 72)).toBe(72)
  })

  it('restores saved tempos above the authored tempo', () => {
    savePlayAlongTempo('exercise-1', 180, 72)

    expect(getPlayAlongTempo('exercise-1', 72)).toBe(180)
  })

  it('falls back to authored tempo for malformed stored data', () => {
    playAlongTemposStore.set({ 'exercise-1': 'fast' as unknown as number })

    expect(getPlayAlongTempo('exercise-1', 72)).toBe(72)
  })
})
