import { describe, expect, it } from 'vitest'
import type { Lesson } from '../content'
import {
  defaultProfile,
  type PracticeProfile,
  type PracticeSession,
} from '../storage'
import { generatePlan, toPlanDate } from './dailyPlan'

const lessons: readonly Lesson[] = [
  lesson('scales-1', 'Scales 1', 'scales', 1, [], 12),
  lesson('scales-2', 'Scales 2', 'scales', 2, ['scales-1'], 12),
  lesson('arps-1', 'Arpeggios 1', 'arpeggios', 1, [], 12),
  lesson('arps-2', 'Arpeggios 2', 'arpeggios', 2, ['arps-1'], 12),
  lesson('chords-1', 'Chords 1', 'chords', 1, [], 12),
]

function lesson(
  id: string,
  title: string,
  area: Lesson['area'],
  level: number,
  prerequisites: readonly string[],
  estimatedMinutes: number,
): Lesson {
  return {
    id,
    title,
    area,
    level,
    prerequisites,
    estimatedMinutes,
    exercises: [],
  }
}

function profile(overrides: Partial<PracticeProfile> = {}): PracticeProfile {
  return {
    ...defaultProfile('2026-07-06T10:00:00.000Z'),
    ...overrides,
  }
}

function session(overrides: Partial<PracticeSession>): PracticeSession {
  return {
    id: 'session-1',
    lessonId: 'scales-1',
    startedAt: '2026-07-05T10:00:00.000Z',
    durationSeconds: 600,
    completed: true,
    results: [{ exerciseId: 'exercise-1', grade: 'got-it' }],
    ...overrides,
  }
}

describe('toPlanDate', () => {
  it('formats the local day as yyyy-mm-dd', () => {
    expect(toPlanDate(new Date(2026, 6, 6, 10))).toBe('2026-07-06')
  })
})

describe('generatePlan', () => {
  it('is deterministic for the same inputs', () => {
    const inputProfile = profile({ minutesPerDay: 30 })
    const history = [session({ lessonId: 'scales-1' })]
    const date = new Date('2026-07-06T10:00:00.000Z')

    expect(generatePlan(inputProfile, history, lessons, date)).toEqual(
      generatePlan(inputProfile, history, lessons, date),
    )
  })

  it('fills the time budget without exceeding it once a lesson fits', () => {
    const plan = generatePlan(
      profile({ minutesPerDay: 30 }),
      [],
      lessons,
      new Date('2026-07-06T10:00:00.000Z'),
    )

    expect(plan.totalMinutes).toBe(24)
    expect(plan.items).toHaveLength(2)
  })

  it('returns one best starter when every lesson is larger than the budget', () => {
    const plan = generatePlan(
      profile({ minutesPerDay: 10 }),
      [],
      lessons,
      new Date('2026-07-06T10:00:00.000Z'),
    )

    expect(plan.items).toHaveLength(1)
    expect(plan.totalMinutes).toBe(12)
  })

  it('weights goal areas first but rotates them by day', () => {
    const inputProfile = profile({
      goalAreas: ['scales', 'arpeggios'],
      minutesPerDay: 20,
    })

    const today = generatePlan(
      inputProfile,
      [],
      lessons,
      new Date('2026-07-06T10:00:00.000Z'),
    )
    const tomorrow = generatePlan(
      inputProfile,
      [],
      lessons,
      new Date('2026-07-07T10:00:00.000Z'),
    )

    expect(today.items[0].area).not.toBe(tomorrow.items[0].area)
  })

  it('respects prerequisites before introducing the next level', () => {
    const inputProfile = profile({
      levels: { ...defaultProfile('').levels, scales: 2 },
      goalAreas: ['scales'],
      minutesPerDay: 20,
    })

    expect(
      generatePlan(inputProfile, [], lessons, new Date('2026-07-06T10:00:00.000Z'))
        .items[0].lessonId,
    ).toBe('scales-1')
    expect(
      generatePlan(
        inputProfile,
        [session({ lessonId: 'scales-1', completed: true })],
        lessons,
        new Date('2026-07-06T10:00:00.000Z'),
      ).items[0].lessonId,
    ).toBe('scales-2')
  })

  it('resurfaces shaky or missed lessons before new material', () => {
    const inputProfile = profile({
      levels: { ...defaultProfile('').levels, scales: 2 },
      goalAreas: ['scales'],
      minutesPerDay: 20,
    })
    const plan = generatePlan(
      inputProfile,
      [
        session({
          lessonId: 'scales-1',
          completed: true,
          results: [{ exerciseId: 'exercise-1', grade: 'missed' }],
        }),
      ],
      lessons,
      new Date('2026-07-06T10:00:00.000Z'),
    )

    expect(plan.items[0]).toMatchObject({
      lessonId: 'scales-1',
      reason: 'Scales 1 was missed on Sunday.',
    })
  })

  it('uses a default profile when onboarding was skipped or missing', () => {
    const plan = generatePlan(
      null,
      [],
      lessons,
      new Date('2026-07-06T10:00:00.000Z'),
    )

    expect(plan.items.length).toBeGreaterThan(0)
    expect(plan.items[0].reason).toMatch(/level 1/)
  })
})
