import { describe, expect, it } from 'vitest'
import {
  FLUID_GUITAR_SAMPLE_BASE_URL,
  createFluidGuitarPreset,
} from './guitarSampler'

describe('FluidR3 guitar sampler preset', () => {
  it('builds an exact-range smplr preset from MIDI notes', () => {
    const preset = createFluidGuitarPreset([40, 46, 40])

    expect(preset.samples).toEqual({
      baseUrl: FLUID_GUITAR_SAMPLE_BASE_URL,
      formats: ['mp3'],
    })
    expect(preset.groups[0]?.regions).toEqual([
      { sample: 'E2', keyRange: [40, 40], pitch: 40 },
      { sample: 'Bb2', keyRange: [46, 46], pitch: 46 },
    ])
    expect(preset.meta?.license).toBe('CC-BY-3.0')
  })
})
