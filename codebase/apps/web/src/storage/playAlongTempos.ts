import { defineStore } from './store'

export const MIN_PLAY_ALONG_TEMPO_BPM = 40
export const MAX_PLAY_ALONG_TEMPO_BPM = 200

export type StoredPlayAlongTempos = Record<string, number>

export const playAlongTemposStore = defineStore<StoredPlayAlongTempos>({
  name: 'play-along-tempos',
  version: 1,
  defaultValue: () => ({}),
})

export function clampPlayAlongTempo(
  tempoBpm: number,
  authoredTempoBpm: number,
): number {
  const ceiling = Math.max(MIN_PLAY_ALONG_TEMPO_BPM, MAX_PLAY_ALONG_TEMPO_BPM)
  const fallback = Number.isFinite(authoredTempoBpm)
    ? authoredTempoBpm
    : MAX_PLAY_ALONG_TEMPO_BPM
  const candidate = Number.isFinite(tempoBpm) ? tempoBpm : fallback
  return Math.min(
    ceiling,
    Math.max(MIN_PLAY_ALONG_TEMPO_BPM, Math.round(candidate)),
  )
}

export function getPlayAlongTempo(
  exerciseId: string,
  authoredTempoBpm: number,
): number {
  const tempos = playAlongTemposStore.get()
  if (!isTempoRecord(tempos)) return clampPlayAlongTempo(authoredTempoBpm, authoredTempoBpm)
  return clampPlayAlongTempo(tempos[exerciseId] ?? authoredTempoBpm, authoredTempoBpm)
}

export function savePlayAlongTempo(
  exerciseId: string,
  tempoBpm: number,
  authoredTempoBpm: number,
): void {
  const nextTempo = clampPlayAlongTempo(tempoBpm, authoredTempoBpm)
  playAlongTemposStore.update((stored) => {
    const tempos = isTempoRecord(stored) ? stored : {}
    return { ...tempos, [exerciseId]: nextTempo }
  })
}

function isTempoRecord(value: unknown): value is StoredPlayAlongTempos {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false
  }
  return Object.values(value).every((tempo) => typeof tempo === 'number')
}
