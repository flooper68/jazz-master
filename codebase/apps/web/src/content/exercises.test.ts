import { describe, expect, it } from 'vitest'
import { EXERCISES } from './exercises'
import { passBeats } from './timeline'
import { validateExercises } from './validate'

const scaleExercises = EXERCISES.filter((exercise) => exercise.area === 'scales')
const lineExercises = EXERCISES.filter((exercise) => exercise.id.startsWith('lines-ii-v-i-f'))

describe('EXERCISES', () => {
  it('is a valid exercise set', () => {
    expect(validateExercises(EXERCISES)).toEqual([])
  })

  it('opens with the major scale in three keys, then the ii–V–I in F as arpeggios and a line', () => {
    expect(EXERCISES.map((exercise) => exercise.id)).toEqual([
      'scales-major-open-c',
      'scales-major-open-g',
      'scales-major-open-f',
      'lines-ii-v-i-f-arpeggios',
      'lines-ii-v-i-f-line',
    ])
    expect(scaleExercises.map((exercise) => exercise.key)).toEqual(['C', 'G', 'F'])
    expect(lineExercises.map((exercise) => exercise.area)).toEqual(['arpeggios', 'standards'])
  })

  it('writes every scale exercise as a tab inside the open position, up and back down', () => {
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
