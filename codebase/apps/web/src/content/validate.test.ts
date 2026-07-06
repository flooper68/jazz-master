import { describe, expect, it } from 'vitest'
import type { Exercise, Lesson } from './types'
import { validateLessons } from './validate'

function exercise(overrides: Partial<Exercise> = {}): Exercise {
  return {
    id: 'ex-1',
    title: 'C major, open position',
    material: { kind: 'scale', root: 'C', scale: 'ionian' },
    window: { min: 0, max: 4 },
    tempoBpm: 80,
    duration: { kind: 'minutes', minutes: 5 },
    display: ['fretboard'],
    ...overrides,
  }
}

function lesson(overrides: Partial<Lesson> = {}): Lesson {
  const id = overrides.id ?? 'lesson-1'
  return {
    id,
    title: 'Major scale, open position',
    area: 'scales',
    level: 1,
    prerequisites: [],
    estimatedMinutes: 15,
    exercises: [exercise({ id: `${id}/ex-1` })],
    ...overrides,
  }
}

describe('validateLessons', () => {
  it('accepts a consistent lesson set', () => {
    const lessons = [
      lesson(),
      lesson({ id: 'lesson-2', prerequisites: ['lesson-1'] }),
    ]
    expect(validateLessons(lessons)).toEqual([])
  })

  it('flags an unparseable exercise root', () => {
    const broken = lesson({
      exercises: [
        exercise({
          material: { kind: 'scale', root: 'X#' as never, scale: 'ionian' },
        }),
      ],
    })
    expect(validateLessons([broken])).toEqual([
      {
        lessonId: 'lesson-1',
        exerciseId: 'ex-1',
        message: 'unparseable root "X#"',
      },
    ])
  })

  it('flags an unknown scale type and chord quality', () => {
    const broken = lesson({
      exercises: [
        exercise({
          id: 'ex-scale',
          material: { kind: 'scale', root: 'C', scale: 'superLocrian' as never },
        }),
        exercise({
          id: 'ex-arp',
          material: { kind: 'arpeggio', root: 'C', quality: 'maj9' as never },
        }),
      ],
    })
    const messages = validateLessons([broken]).map((p) => p.message)
    expect(messages).toContain('unknown scale type "superLocrian"')
    expect(messages).toContain('unknown chord quality "maj9"')
  })

  it('flags an invalid fret window', () => {
    const broken = lesson({
      exercises: [exercise({ window: { min: 5, max: 2 } })],
    })
    expect(validateLessons([broken])).toEqual([
      {
        lessonId: 'lesson-1',
        exerciseId: 'ex-1',
        message: 'invalid fret window 5–2',
      },
    ])
  })

  it('flags non-positive tempo and duration', () => {
    const broken = lesson({
      exercises: [
        exercise({
          tempoBpm: 0,
          duration: { kind: 'repetitions', count: -3 },
        }),
      ],
    })
    const messages = validateLessons([broken]).map((p) => p.message)
    expect(messages).toContain('tempo must be positive, got 0')
    expect(messages).toContain('duration must be positive, got -3')
  })

  it('flags bad lesson metadata and empty lessons', () => {
    const broken = lesson({ level: 0, estimatedMinutes: 0, exercises: [] })
    const messages = validateLessons([broken]).map((p) => p.message)
    expect(messages).toContain('level must be a positive integer, got 0')
    expect(messages).toContain('estimated minutes must be positive, got 0')
    expect(messages).toContain('lesson has no exercises')
  })

  it('flags duplicate lesson and exercise ids', () => {
    const duplicated = lesson({
      exercises: [exercise(), exercise({ title: 'again' })],
    })
    const messages = validateLessons([duplicated, lesson()]).map(
      (p) => p.message,
    )
    expect(messages).toContain('duplicate exercise id "ex-1"')
    expect(messages).toContain('duplicate lesson id "lesson-1"')
  })

  it('flags exercise ids reused across lessons (session records key on them)', () => {
    const first = lesson({ id: 'a', exercises: [exercise({ id: 'shared' })] })
    const second = lesson({ id: 'b', exercises: [exercise({ id: 'shared' })] })
    expect(validateLessons([first, second])).toEqual([
      {
        lessonId: 'b',
        exerciseId: 'shared',
        message: 'duplicate exercise id "shared"',
      },
    ])
  })

  it('flags a missing prerequisite', () => {
    const orphan = lesson({ prerequisites: ['lesson-99'] })
    expect(validateLessons([orphan])).toEqual([
      { lessonId: 'lesson-1', message: 'unknown prerequisite "lesson-99"' },
    ])
  })

  it('flags a prerequisite cycle once per member', () => {
    const a = lesson({ id: 'a', prerequisites: ['b'] })
    const b = lesson({ id: 'b', prerequisites: ['a'] })
    const problems = validateLessons([a, b])
    expect(problems).toHaveLength(2)
    expect(problems.map((p) => p.lessonId).sort()).toEqual(['a', 'b'])
    for (const problem of problems) {
      expect(problem.message).toMatch(/prerequisite cycle/)
    }
  })

  it('flags a self-prerequisite as a cycle', () => {
    const selfish = lesson({ prerequisites: ['lesson-1'] })
    expect(validateLessons([selfish])).toEqual([
      {
        lessonId: 'lesson-1',
        message: 'prerequisite cycle: lesson-1 → lesson-1',
      },
    ])
  })

  it('does not report a cycle for a diamond dependency', () => {
    const base = lesson({ id: 'base' })
    const left = lesson({ id: 'left', prerequisites: ['base'] })
    const right = lesson({ id: 'right', prerequisites: ['base'] })
    const top = lesson({ id: 'top', prerequisites: ['left', 'right'] })
    expect(validateLessons([base, left, right, top])).toEqual([])
  })
})
