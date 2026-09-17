import { describe, expect, it } from 'vitest'
import { LESSONS } from './lessons'
import { passBeats } from './timeline'
import { validateLessons } from './validate'

const allExercises = LESSONS.flatMap((lesson) => lesson.exercises)
const scaleExercises = LESSONS[0].exercises

describe('LESSONS', () => {
  it('is a valid lesson set', () => {
    expect(validateLessons(LESSONS)).toEqual([])
  })

  it('opens with the major scale in three keys, then ii–V–I lines in F', () => {
    expect(LESSONS.map((lesson) => lesson.id)).toEqual([
      'scales-major-open',
      'lines-ii-v-i-f',
    ])
    expect(scaleExercises.map((exercise) => exercise.title)).toEqual([
      'C major — open position',
      'G major — open position',
      'F major — open position',
    ])
    expect(scaleExercises.map((exercise) => exercise.key)).toEqual(['C', 'G', 'F'])
    expect(LESSONS[1].prerequisites).toEqual(['scales-major-open'])
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
    for (const exercise of LESSONS[1].exercises) {
      expect(passBeats(exercise.notes) % 4).toBe(0)
      expect(exercise.key).toBe('F')
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

describe('lesson text', () => {
  it('gives every lesson an intro and every exercise its notes', () => {
    for (const lesson of LESSONS) {
      expect(lesson.intro?.length ?? 0).toBeGreaterThan(0)
      for (const exercise of lesson.exercises) {
        expect(exercise.about?.length ?? 0).toBeGreaterThan(0)
      }
    }
  })
})
