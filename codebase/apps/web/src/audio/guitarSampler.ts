import type { SmplrPreset } from 'smplr'
import { fluidSampleName } from './notes'

export const FLUID_GUITAR_SAMPLE_BASE_URL =
  'https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/electric_guitar_jazz-mp3'

export function createFluidGuitarPreset(
  midiNotes: readonly number[],
): SmplrPreset {
  const notes = [...new Set(midiNotes)].sort((left, right) => left - right)
  return {
    smplr: '1.0',
    meta: {
      name: 'FluidR3_GM electric_guitar_jazz',
      license: 'CC-BY-3.0',
      source:
        'https://github.com/gleitz/midi-js-soundfonts/tree/gh-pages/FluidR3_GM/electric_guitar_jazz-mp3',
      tags: ['guitar', 'play-along'],
    },
    samples: {
      baseUrl: FLUID_GUITAR_SAMPLE_BASE_URL,
      formats: ['mp3'],
    },
    groups: [
      {
        regions: notes.map((midi) => ({
          sample: fluidSampleName(midi),
          keyRange: [midi, midi],
          pitch: midi,
        })),
      },
    ],
  }
}
