import { pitchClass } from '@jazz-master/theory'
import { describe, expect, it } from 'vitest'
import { LESSONS } from './lessons'
import { resolveExercise } from './resolve'
import { validateLessons } from './validate'

const allExercises = LESSONS.flatMap((lesson) => lesson.exercises)

describe('the scales & arpeggios lesson pack', () => {
  it('passes whole-pack validation', () => {
    expect(validateLessons(LESSONS)).toEqual([])
  })

  it('has the v1 shape: ≥8 lessons, scales and arpeggios, ≥2 levels each', () => {
    expect(LESSONS.length).toBeGreaterThanOrEqual(8)
    for (const area of ['scales', 'arpeggios'] as const) {
      const levels = new Set(
        LESSONS.filter((lesson) => lesson.area === area).map(
          (lesson) => lesson.level,
        ),
      )
      expect(levels.size).toBeGreaterThanOrEqual(2)
    }
  })

  it('estimates each lesson at 10–15 minutes, matching its exercise durations', () => {
    for (const lesson of LESSONS) {
      expect(lesson.estimatedMinutes).toBeGreaterThanOrEqual(10)
      expect(lesson.estimatedMinutes).toBeLessThanOrEqual(15)
      const summed = lesson.exercises.reduce(
        (total, exercise) =>
          total +
          (exercise.duration.kind === 'minutes' ? exercise.duration.minutes : 0),
        0,
      )
      expect(lesson.estimatedMinutes).toBe(summed)
    }
  })

  it('never requires a higher-level lesson as a prerequisite', () => {
    const byId = new Map(LESSONS.map((lesson) => [lesson.id, lesson]))
    for (const lesson of LESSONS) {
      for (const prerequisite of lesson.prerequisites) {
        const required = byId.get(prerequisite)
        expect(required).toBeDefined()
        expect(required?.level).toBeLessThanOrEqual(lesson.level)
      }
    }
  })

  it('resolves every exercise to notes fully playable inside its fret window', () => {
    for (const exercise of allExercises) {
      const { notes, positions } = resolveExercise(exercise)
      expect(notes.length).toBeGreaterThan(0)
      expect(positions.length).toBeGreaterThan(0)
      for (const position of positions) {
        expect(position.fret).toBeGreaterThanOrEqual(exercise.window.min)
        expect(position.fret).toBeLessThanOrEqual(exercise.window.max)
      }
      const soundedPitchClasses = new Set(
        positions.map((position) => pitchClass(position.note)),
      )
      for (const note of notes) {
        expect(soundedPitchClasses.has(pitchClass(note))).toBe(true)
      }
    }
  })
})
