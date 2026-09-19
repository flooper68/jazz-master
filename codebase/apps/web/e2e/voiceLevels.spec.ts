import { expect, test } from './fixtures'

/**
 * The guitars are levelled by measurement, not by ear (JM-10): every voice
 * declares the loudness it was measured at, and playback divides one shared
 * target by it. Nothing below the browser can check that, because the model's
 * tone, body and amp stages are Web Audio nodes — jsdom has none, so a stale
 * `loudness` would sail through the unit suite and be heard instead on the
 * first note of a session, which is how this bug arrived.
 *
 * So this renders each synthesized voice through the real chain offline and
 * asserts it lands on the shared target. The synthesized voices are the ones
 * at risk — they are computed from constants a future task may retune, while
 * the sampled voices are fixed recordings — which is also why this spec needs
 * no network. Re-measuring a voice after changing its model or filters means
 * reading the dB this spec reports and folding it into `loudness`.
 */

const TOLERANCE_DB = 3
/** Across the neck: one pitch would miss a body resonance under part of the range. */
const PITCHES = [40, 47, 54, 61, 68, 74]

test('every synthesized guitar is levelled to the shared target loudness', async ({ page }) => {
  await page.goto('/')

  const measured = await page.evaluate(async (pitches) => {
    // The dev server serves these at runtime; tsc must not try to resolve a
    // server URL, so the specifiers are built rather than written literally.
    // The types come from the same sources, imported by relative path.
    const url = (module: string) => `/src/audio/${module}.ts`
    const [engine, voices]: [typeof import('../src/audio/engine'), typeof import('../src/audio/voices')] =
      await Promise.all([import(url('engine')), import(url('voices'))])
    const { renderPluck, driveCurve, midiToFrequency } = engine
    const { VOICES, TARGET_LOUDNESS, voiceLevel } = voices
    const rate = 48000
    // One note at 120 bpm — the window the calibration in voices.ts uses.
    const seconds = 0.5

    /** One note through the whole chain, exactly as engine.pluck() builds it. */
    async function rms(voice: (typeof VOICES)[number] & { kind: 'synth' }, midi: number): Promise<number> {
      const ctx = new OfflineAudioContext(1, Math.round(rate * seconds), rate)
      const buffer = ctx.createBuffer(1, Math.round(3 * rate), rate)
      renderPluck(buffer.getChannelData(0), midiToFrequency(midi), rate, voice, midi)
      const source = ctx.createBufferSource()
      source.buffer = buffer
      let head: AudioNode = source
      if (voice.drive) {
        const amp = ctx.createWaveShaper()
        amp.curve = driveCurve(voice.drive)
        amp.oversample = '2x'
        head.connect(amp)
        head = amp
      }
      const tone = ctx.createBiquadFilter()
      tone.type = 'lowpass'
      tone.frequency.setValueAtTime(voice.toneHz, 0)
      tone.Q.setValueAtTime(0.7, 0)
      head.connect(tone)
      head = tone
      for (const resonance of voice.body) {
        const peak = ctx.createBiquadFilter()
        peak.type = 'peaking'
        peak.frequency.setValueAtTime(resonance.frequency, 0)
        peak.Q.setValueAtTime(resonance.q, 0)
        peak.gain.setValueAtTime(resonance.gainDb, 0)
        head.connect(peak)
        head = peak
      }
      const gain = ctx.createGain()
      gain.gain.value = voiceLevel(voice)
      head.connect(gain)
      gain.connect(ctx.destination)
      source.start(0)
      const data = (await ctx.startRendering()).getChannelData(0)
      let sum = 0
      for (let i = 0; i < data.length; i += 1) sum += data[i] * data[i]
      return Math.sqrt(sum / data.length)
    }

    const rows: Array<{ id: string; db: number }> = []
    for (const voice of VOICES) {
      if (voice.kind !== 'synth') continue
      let total = 0
      for (const midi of pitches) total += await rms(voice, midi)
      rows.push({ id: voice.id, db: 20 * Math.log10(total / pitches.length / TARGET_LOUDNESS) })
    }
    return rows
  }, PITCHES)

  expect(measured.map((row) => row.id)).toHaveLength(6)
  for (const { id, db } of measured) {
    expect(Math.abs(db), `${id} is ${db.toFixed(2)} dB from the target loudness`).toBeLessThan(TOLERANCE_DB)
  }
})
