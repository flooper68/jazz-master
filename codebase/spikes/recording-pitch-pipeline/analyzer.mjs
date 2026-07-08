const NOTE_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']

export const DEFAULT_EXERCISE = {
  id: 'c-major-one-octave-80bpm',
  title: 'C major one octave, quarter notes at 80 BPM',
  tempoBpm: 80,
  notes: [
    { label: 'C4', midi: 60 },
    { label: 'D4', midi: 62 },
    { label: 'E4', midi: 64 },
    { label: 'F4', midi: 65 },
    { label: 'G4', midi: 67 },
    { label: 'A4', midi: 69 },
    { label: 'B4', midi: 71 },
    { label: 'C5', midi: 72 },
  ],
}

export function mixToMono(audioBuffer) {
  const samples = new Float32Array(audioBuffer.length)
  for (let channel = 0; channel < audioBuffer.numberOfChannels; channel += 1) {
    const channelData = audioBuffer.getChannelData(channel)
    for (let index = 0; index < samples.length; index += 1) {
      samples[index] += channelData[index] / audioBuffer.numberOfChannels
    }
  }
  return removeDcOffset(samples)
}

export function analyzeTake({ samples, sampleRate, exercise = DEFAULT_EXERCISE }) {
  const beatSeconds = 60 / exercise.tempoBpm
  const onsets = suppressCloseOnsets(detectOnsets(samples, sampleRate), beatSeconds * 0.45)
  const detected = onsets.slice(0, exercise.notes.length + 3).map((onsetSeconds) =>
    detectEventPitch({ samples, sampleRate, onsetSeconds }),
  )
  const firstUsableOnset = detected.find((event) => event.frequencyHz !== null)?.onsetSeconds ?? 0
  const matched = exercise.notes.map((expected, index) => {
    const detectedEvent = detected[index] ?? null
    const expectedOnsetSeconds = firstUsableOnset + (60 / exercise.tempoBpm) * index
    return compareEvent({ expected, detectedEvent, expectedOnsetSeconds })
  })

  return {
    exercise,
    sampleRate,
    durationSeconds: samples.length / sampleRate,
    detected,
    matched,
    summary: summarizeMatches(matched),
  }
}

export function detectOnsets(samples, sampleRate) {
  const frameSize = 1024
  const hopSize = 256
  const minGapFrames = Math.ceil((0.18 * sampleRate) / hopSize)
  const energies = []

  for (let start = 0; start + frameSize <= samples.length; start += hopSize) {
    let sum = 0
    for (let index = 0; index < frameSize; index += 1) {
      const sample = samples[start + index]
      sum += sample * sample
    }
    energies.push(Math.sqrt(sum / frameSize))
  }

  const fluxes = energies.map((energy, index) =>
    index === 0 ? 0 : Math.max(0, energy - energies[index - 1]),
  )
  const threshold = median(fluxes) + 3 * medianAbsoluteDeviation(fluxes)
  const onsets = []

  for (let index = 1; index < fluxes.length - 1; index += 1) {
    const isLocalPeak = fluxes[index] > fluxes[index - 1] && fluxes[index] >= fluxes[index + 1]
    const isLoudEnough = energies[index] > 0.006
    const farEnough =
      onsets.length === 0 || index - onsets[onsets.length - 1].frameIndex >= minGapFrames
    if (isLocalPeak && isLoudEnough && fluxes[index] >= threshold && farEnough) {
      onsets.push({ frameIndex: index, seconds: (index * hopSize) / sampleRate })
    }
  }

  if (onsets.length > 0) return onsets.map((onset) => onset.seconds)

  return detectFallbackEnergyOnsets({ energies, hopSize, sampleRate, minGapFrames })
}

export function detectPitchYin(frame, sampleRate, options = {}) {
  const threshold = options.threshold ?? 0.12
  const minFrequency = options.minFrequency ?? 70
  const maxFrequency = options.maxFrequency ?? 1000
  const minTau = Math.max(2, Math.floor(sampleRate / maxFrequency))
  const maxTau = Math.min(Math.floor(sampleRate / minFrequency), frame.length - 2)
  const difference = new Float32Array(maxTau + 1)
  const cmnd = new Float32Array(maxTau + 1)
  const prepared = removeDcOffset(frame)

  for (let tau = 1; tau <= maxTau; tau += 1) {
    let sum = 0
    for (let index = 0; index < prepared.length - tau; index += 1) {
      const delta = prepared[index] - prepared[index + tau]
      sum += delta * delta
    }
    difference[tau] = sum
  }

  cmnd[0] = 1
  let runningSum = 0
  for (let tau = 1; tau <= maxTau; tau += 1) {
    runningSum += difference[tau]
    cmnd[tau] = runningSum === 0 ? 1 : (difference[tau] * tau) / runningSum
  }

  let tauEstimate = -1
  for (let tau = minTau; tau <= maxTau; tau += 1) {
    if (cmnd[tau] < threshold) {
      while (tau + 1 <= maxTau && cmnd[tau + 1] < cmnd[tau]) tau += 1
      tauEstimate = tau
      break
    }
  }

  if (tauEstimate === -1) {
    let bestTau = minTau
    let bestValue = cmnd[minTau]
    for (let tau = minTau + 1; tau <= maxTau; tau += 1) {
      if (cmnd[tau] < bestValue) {
        bestTau = tau
        bestValue = cmnd[tau]
      }
    }
    if (bestValue > 0.22) return null
    tauEstimate = bestTau
  }

  const betterTau = parabolicMinimum(cmnd, tauEstimate)
  return {
    frequencyHz: sampleRate / betterTau,
    clarity: Math.max(0, Math.min(1, 1 - cmnd[tauEstimate])),
  }
}

export function frequencyToMidi(frequencyHz) {
  return 69 + 12 * Math.log2(frequencyHz / 440)
}

export function midiToNoteLabel(midi) {
  const rounded = Math.round(midi)
  const pitchClass = ((rounded % 12) + 12) % 12
  const octave = Math.floor(rounded / 12) - 1
  return `${NOTE_NAMES[pitchClass]}${octave}`
}

export function resultsToMarkdown(results) {
  const lines = [
    '| Take | Pitch-class accuracy | Octave errors | Mean onset deviation | Median onset deviation | Max onset deviation | Notes |',
    '|---|---:|---:|---:|---:|---:|---|',
  ]

  results.forEach((result, index) => {
    const { summary } = result
    lines.push(
      `| ${index + 1} | ${formatPercent(summary.pitchClassAccuracy)} | ${
        summary.octaveErrorCount
      }/${summary.expectedCount} | ${formatMilliseconds(summary.meanAbsOnsetMs)} | ${formatMilliseconds(
        summary.medianAbsOnsetMs,
      )} | ${formatMilliseconds(summary.maxAbsOnsetMs)} | ${summary.detectedCount} detected |`,
    )
  })

  return lines.join('\n')
}

function detectEventPitch({ samples, sampleRate, onsetSeconds }) {
  const analysisOffsetSeconds = 0.06
  const frameSize = 4096
  const start = Math.max(0, Math.floor((onsetSeconds + analysisOffsetSeconds) * sampleRate))
  const end = Math.min(samples.length, start + frameSize)
  const frame = samples.slice(start, end)
  const pitch = frame.length >= 2048 ? detectPitchYin(frame, sampleRate) : null
  const midi = pitch ? frequencyToMidi(pitch.frequencyHz) : null

  return {
    onsetSeconds,
    frequencyHz: pitch?.frequencyHz ?? null,
    clarity: pitch?.clarity ?? 0,
    midi,
    roundedMidi: midi === null ? null : Math.round(midi),
    note: midi === null ? null : midiToNoteLabel(midi),
  }
}

function compareEvent({ expected, detectedEvent, expectedOnsetSeconds }) {
  if (!detectedEvent || detectedEvent.roundedMidi === null) {
    return {
      expected,
      detected: detectedEvent,
      expectedOnsetSeconds,
      onsetDeviationMs: null,
      pitchClassMatch: false,
      octaveMatch: false,
      verdict: 'missed',
    }
  }

  const onsetDeviationMs = (detectedEvent.onsetSeconds - expectedOnsetSeconds) * 1000
  const pitchClassMatch = pitchClass(detectedEvent.roundedMidi) === pitchClass(expected.midi)
  const octaveMatch = Math.floor(detectedEvent.roundedMidi / 12) === Math.floor(expected.midi / 12)
  let verdict = 'wrong pitch'
  if (pitchClassMatch && Math.abs(onsetDeviationMs) <= 100) verdict = 'correct'
  else if (pitchClassMatch && Math.abs(onsetDeviationMs) <= 250) verdict = 'early/late'

  return {
    expected,
    detected: detectedEvent,
    expectedOnsetSeconds,
    onsetDeviationMs,
    pitchClassMatch,
    octaveMatch,
    verdict,
  }
}

function summarizeMatches(matches) {
  const expectedCount = matches.length
  const detectedMatches = matches.filter((match) => match.detected?.roundedMidi !== null)
  const pitchClassHits = matches.filter((match) => match.pitchClassMatch).length
  const octaveErrorCount = matches.filter(
    (match) => match.pitchClassMatch && !match.octaveMatch,
  ).length
  const onsetMs = matches
    .map((match) => match.onsetDeviationMs)
    .filter((value) => value !== null)
    .map((value) => Math.abs(value))

  return {
    expectedCount,
    detectedCount: detectedMatches.length,
    pitchClassAccuracy: expectedCount === 0 ? 0 : pitchClassHits / expectedCount,
    octaveErrorCount,
    meanAbsOnsetMs: onsetMs.length === 0 ? null : mean(onsetMs),
    medianAbsOnsetMs: onsetMs.length === 0 ? null : median(onsetMs),
    maxAbsOnsetMs: onsetMs.length === 0 ? null : Math.max(...onsetMs),
  }
}

function suppressCloseOnsets(onsets, minGapSeconds) {
  const filtered = []
  for (const onset of onsets) {
    const previous = filtered[filtered.length - 1]
    if (previous === undefined || onset - previous >= minGapSeconds) filtered.push(onset)
  }
  return filtered
}

function detectFallbackEnergyOnsets({ energies, hopSize, sampleRate, minGapFrames }) {
  const threshold = median(energies) + 2 * medianAbsoluteDeviation(energies)
  const onsets = []
  let wasAbove = false

  for (let index = 0; index < energies.length; index += 1) {
    const isAbove = energies[index] > Math.max(0.01, threshold)
    const farEnough =
      onsets.length === 0 || index - onsets[onsets.length - 1].frameIndex >= minGapFrames
    if (isAbove && !wasAbove && farEnough) {
      onsets.push({ frameIndex: index, seconds: (index * hopSize) / sampleRate })
    }
    wasAbove = isAbove
  }

  return onsets.map((onset) => onset.seconds)
}

function removeDcOffset(samples) {
  let sum = 0
  for (const sample of samples) sum += sample
  const meanValue = sum / samples.length
  const prepared = new Float32Array(samples.length)
  for (let index = 0; index < samples.length; index += 1) {
    prepared[index] = samples[index] - meanValue
  }
  return prepared
}

function pitchClass(midi) {
  return ((midi % 12) + 12) % 12
}

function parabolicMinimum(values, index) {
  const previous = values[index - 1]
  const current = values[index]
  const next = values[index + 1]
  const denominator = previous - 2 * current + next
  if (!Number.isFinite(denominator) || denominator === 0) return index
  return index + (previous - next) / (2 * denominator)
}

function mean(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function median(values) {
  if (values.length === 0) return 0
  const sorted = [...values].sort((left, right) => left - right)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle]
}

function medianAbsoluteDeviation(values) {
  const medianValue = median(values)
  return median(values.map((value) => Math.abs(value - medianValue)))
}

function formatPercent(value) {
  return `${Math.round(value * 100)}%`
}

function formatMilliseconds(value) {
  return value === null ? 'n/a' : `${Math.round(value)} ms`
}
