import { DEFAULT_EXERCISE, analyzeTake } from './analyzer.mjs'

const sampleRate = 48_000
const beatSeconds = 60 / DEFAULT_EXERCISE.tempoBpm
const durationSeconds = beatSeconds * DEFAULT_EXERCISE.notes.length + 0.8
const samples = new Float32Array(Math.ceil(sampleRate * durationSeconds))

for (let noteIndex = 0; noteIndex < DEFAULT_EXERCISE.notes.length; noteIndex += 1) {
  const frequencyHz = 440 * 2 ** ((DEFAULT_EXERCISE.notes[noteIndex].midi - 69) / 12)
  const start = Math.floor(sampleRate * (0.2 + noteIndex * beatSeconds))
  const duration = Math.floor(sampleRate * 0.35)

  for (let sampleIndex = 0; sampleIndex < duration; sampleIndex += 1) {
    const fadeIn = sampleIndex / 400
    const fadeOut = (duration - sampleIndex) / 1200
    const envelope = Math.min(1, fadeIn, fadeOut)
    samples[start + sampleIndex] +=
      Math.sin((2 * Math.PI * frequencyHz * sampleIndex) / sampleRate) * 0.4 * envelope
  }
}

const result = analyzeTake({ samples, sampleRate })
console.log(JSON.stringify(result.summary, null, 2))
console.table(
  result.matched.map((match) => ({
    expected: match.expected.label,
    detected: match.detected?.note ?? 'missed',
    verdict: match.verdict,
    onsetDeviationMs: Math.round(match.onsetDeviationMs ?? 0),
  })),
)

if (result.summary.pitchClassAccuracy !== 1 || result.summary.octaveErrorCount !== 0) {
  throw new Error('Synthetic pitch check failed')
}

if (result.summary.maxAbsOnsetMs === null || result.summary.maxAbsOnsetMs > 20) {
  throw new Error('Synthetic onset check failed')
}
