import { describe, expect, it } from 'vitest'
import { LESSONS } from './lessons'
import { passBeats } from './timeline'
import { validateLessons } from './validate'

const allExercises = LESSONS.flatMap((lesson) => lesson.exercises)

describe('LESSONS', () => {
  it('is a valid lesson set', () => {
    expect(validateLessons(LESSONS)).toEqual([])
  })

  it('is the major scale in the open position, one lesson, three keys', () => {
    expect(LESSONS.map((lesson) => lesson.id)).toEqual(['scales-major-open'])
    expect(allExercises.map((exercise) => exercise.title)).toEqual([
      'C major — open position',
      'G major — open position',
      'F major — open position',
    ])
  })

  it('writes every exercise as a tab inside the open position, up and back down', () => {
    for (const exercise of allExercises) {
      expect(exercise.notes.length).toBeGreaterThan(8)
      for (const note of exercise.notes) {
        expect(note.fret).toBeGreaterThanOrEqual(0)
        expect(note.fret).toBeLessThanOrEqual(4)
        expect(note.beats).toBe(0.5)
      }
      // Symmetric around the top note: the way down mirrors the way up.
      const frets = exercise.notes.map((note) => `${note.string}/${note.fret}`)
      const top = (frets.length - 1) / 2
      expect(Number.isInteger(top)).toBe(true)
      expect(frets.slice(0, top)).toEqual(frets.slice(top + 1).reverse())
    }
  })

  it('keeps an exercise a few seconds per pass at its tempo', () => {
    for (const exercise of allExercises) {
      const secondsPerPass = (passBeats(exercise.notes) * 60) / exercise.tempoBpm
      expect(secondsPerPass).toBeGreaterThan(5)
      expect(secondsPerPass).toBeLessThan(30)
    }
  })
})
