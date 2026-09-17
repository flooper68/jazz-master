import { describe, expect, it } from 'vitest'
import { parseExerciseInput } from './exerciseInput'
import { EXERCISES } from './exercises'
import { exercisePosition } from './filter'
import { EXERCISE_AREAS, STYLE_FAMILIES, styleFamily } from './taxonomy'
import { passBeats } from './timeline'
import { validateExercises } from './validate'

const FOUNDING_SCALES = ['scales-major-open-c', 'scales-major-open-g', 'scales-major-open-f']
const scaleExercises = EXERCISES.filter((exercise) => FOUNDING_SCALES.includes(exercise.id))
const lineExercises = EXERCISES.filter((exercise) => exercise.id.startsWith('lines-ii-v-i-f'))

describe('EXERCISES', () => {
  it('is a valid exercise set', () => {
    expect(validateExercises(EXERCISES)).toEqual([])
  })

  it('keeps the five founding exercises, by id and in their order — run history and routines point at them', () => {
    const founding = ['scales-major-open-c', 'scales-major-open-g', 'scales-major-open-f', 'lines-ii-v-i-f-arpeggios', 'lines-ii-v-i-f-line']
    expect(EXERCISES.map((exercise) => exercise.id).filter((id) => founding.includes(id))).toEqual(founding)
    // The scales area still opens with them.
    expect(EXERCISES.filter((exercise) => exercise.area === 'scales').slice(0, 3).map((exercise) => exercise.id)).toEqual(FOUNDING_SCALES)
    expect(scaleExercises.map((exercise) => exercise.key)).toEqual(['C', 'G', 'F'])
    expect(lineExercises.map((exercise) => exercise.area)).toEqual(['arpeggios', 'lines'])
  })

  it('writes the founding scale exercises as tabs inside the open position, up and back down', () => {
    for (const exercise of scaleExercises) {
      expect(exercise.notes.length).toBeGreaterThan(8)
      for (const note of exercise.notes.slice(0, -1)) {
        expect(note.fret).toBeGreaterThanOrEqual(0)
        expect(note.fret).toBeLessThanOrEqual(4)
        expect(note.beats).toBe(0.5)
      }
      // The final root is held so the exercise ends on a bar line.
      expect(passBeats(exercise.notes) % 4).toBe(0)
      // Symmetric around the top note: the way down mirrors the way up.
      const frets = exercise.notes.map((note) => `${note.string}/${note.fret}`)
      const top = (frets.length - 1) / 2
      expect(Number.isInteger(top)).toBe(true)
      expect(frets.slice(0, top)).toEqual(frets.slice(top + 1).reverse())
    }
  })

  it('writes the ii–V–I exercises in whole bars of 4/4', () => {
    for (const exercise of lineExercises) {
      expect(passBeats(exercise.notes) % 4).toBe(0)
      expect(exercise.key).toBe('F')
    }
  })

  it('keeps an exercise a few seconds per pass at its tempo', () => {
    for (const exercise of EXERCISES) {
      const secondsPerPass = (passBeats(exercise.notes) * 60) / exercise.tempoBpm
      expect(secondsPerPass).toBeGreaterThan(5)
      expect(secondsPerPass).toBeLessThan(30)
    }
  })
})

describe('the pack as a library', () => {
  it('holds every exercise to the rules a user exercise is held to: drawable lengths, frets on the neck, labels from the vocabularies', () => {
    for (const { id, ...exercise } of EXERCISES) {
      // Through JSON, as it would arrive: readonly tuples and undefined fields are not what the schema sees.
      expect({ id, result: parseExerciseInput(JSON.parse(JSON.stringify(exercise))) }).toMatchObject({ id, result: { ok: true } })
    }
  })

  it('puts something in every area, with the areas in list order', () => {
    const areas = [...new Set(EXERCISES.map((exercise) => exercise.area))]
    expect(areas).toEqual([...EXERCISE_AREAS])
  })

  it('gives every style family at least four exercises, so choosing a style never finds a dead end', () => {
    for (const family of STYLE_FAMILIES) {
      const found = EXERCISES.filter((exercise) => exercise.styles?.some((style) => styleFamily(style) === family))
      expect({ family, enough: found.length >= 4 }).toEqual({ family, enough: true })
    }
  })

  it('keeps fundamentals unstyled, so they belong to every style', () => {
    expect(EXERCISES.filter((exercise) => !exercise.styles?.length).length).toBeGreaterThan(20)
  })

  it('names chord shapes only in the chords area', () => {
    for (const exercise of EXERCISES) {
      if (exercise.voicings?.length) expect(exercise.area).toBe('chords')
    }
  })

  it('keeps a position exercise in one position', () => {
    for (const exercise of EXERCISES.filter((candidate) => /position \d of \d|box \d$/.test(candidate.title))) {
      expect({ id: exercise.id, position: exercisePosition(exercise) }).not.toMatchObject({ position: 'shifting' })
    }
  })
})

describe('exercise text', () => {
  it('gives every exercise its notes, and tells each story once', () => {
    for (const exercise of EXERCISES) {
      expect(exercise.about?.length ?? 0).toBeGreaterThan(0)
    }
    const telling = (phrase: string) =>
      EXERCISES.filter((exercise) => exercise.about?.some((paragraph) => paragraph.includes(phrase)))
    expect(telling('the ruler everything else in jazz is measured against').map((e) => e.id)).toEqual([
      'scales-major-open-c',
    ])
    expect(telling('the most common chord movement in jazz').map((e) => e.id)).toEqual([
      'lines-ii-v-i-f-arpeggios',
    ])
  })
})
