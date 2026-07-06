import { describe, expect, it } from 'vitest'
import type { Lesson } from '../content'
import type { PracticeSession } from '../storage/sessions'
import {
  areaStatuses,
  completedLessonIdsOn,
  currentStreakDays,
  minutesThisWeek,
} from './dashboardStats'

/**
 * Local wall-clock timestamp → ISO string, so day-boundary assertions hold in
 * whatever timezone the test runner uses (toPlanDate groups by local day).
 */
function atLocal(
  year: number,
  month: number,
  day: number,
  hour = 12,
  minute = 0,
): string {
  return new Date(year, month - 1, day, hour, minute).toISOString()
}

function session(overrides: Partial<PracticeSession>): PracticeSession {
  return {
    id: crypto.randomUUID(),
    lessonId: 'lesson-a',
    startedAt: atLocal(2026, 7, 6),
    durationSeconds: 300,
    completed: true,
    results: [{ exerciseId: 'ex-1', grade: 'got-it' }],
    ...overrides,
  }
}

function lesson(overrides: Partial<Lesson>): Lesson {
  return {
    id: 'lesson-a',
    title: 'Lesson A',
    area: 'scales',
    level: 1,
    prerequisites: [],
    estimatedMinutes: 10,
    exercises: [],
    ...overrides,
  }
}

// Monday 2026-07-06, mid-day local time.
const today = new Date(2026, 6, 6, 12, 0)

describe('currentStreakDays', () => {
  it('returns 0 with no sessions', () => {
    expect(currentStreakDays([], today)).toBe(0)
  })

  it('counts consecutive days ending today', () => {
    const sessions = [
      session({ startedAt: atLocal(2026, 7, 6) }),
      session({ startedAt: atLocal(2026, 7, 5) }),
      session({ startedAt: atLocal(2026, 7, 4) }),
    ]
    expect(currentStreakDays(sessions, today)).toBe(3)
  })

  it('stops at a gap day', () => {
    const sessions = [
      session({ startedAt: atLocal(2026, 7, 6) }),
      session({ startedAt: atLocal(2026, 7, 4) }),
      session({ startedAt: atLocal(2026, 7, 3) }),
    ]
    expect(currentStreakDays(sessions, today)).toBe(1)
  })

  it('keeps a streak alive when today has no session yet', () => {
    const sessions = [
      session({ startedAt: atLocal(2026, 7, 5) }),
      session({ startedAt: atLocal(2026, 7, 4) }),
    ]
    expect(currentStreakDays(sessions, today)).toBe(2)
  })

  it('returns 0 when the last session was two days ago', () => {
    expect(
      currentStreakDays([session({ startedAt: atLocal(2026, 7, 4) })], today),
    ).toBe(0)
  })

  it('treats sessions around local midnight as distinct days', () => {
    const sessions = [
      session({ startedAt: atLocal(2026, 7, 6, 0, 15) }),
      session({ startedAt: atLocal(2026, 7, 5, 23, 45) }),
    ]
    expect(currentStreakDays(sessions, today)).toBe(2)
  })

  it('counts across a month boundary', () => {
    const sessions = [
      session({ startedAt: atLocal(2026, 7, 1) }),
      session({ startedAt: atLocal(2026, 6, 30) }),
      session({ startedAt: atLocal(2026, 6, 29) }),
    ]
    expect(currentStreakDays(sessions, new Date(2026, 6, 1, 9, 0))).toBe(3)
  })

  it('counts one practice day only once', () => {
    const sessions = [
      session({ startedAt: atLocal(2026, 7, 6, 9) }),
      session({ startedAt: atLocal(2026, 7, 6, 18) }),
    ]
    expect(currentStreakDays(sessions, today)).toBe(1)
  })
})

describe('minutesThisWeek', () => {
  it('returns 0 with no sessions', () => {
    expect(minutesThisWeek([], today)).toBe(0)
  })

  it('sums sessions from today back through six days ago, excluding older', () => {
    const sessions = [
      session({ startedAt: atLocal(2026, 7, 6), durationSeconds: 600 }),
      // 6 days ago — last day inside the window, even just after midnight.
      session({ startedAt: atLocal(2026, 6, 30, 0, 5), durationSeconds: 300 }),
      // 7 days ago — outside, even late in the evening.
      session({ startedAt: atLocal(2026, 6, 29, 23, 55), durationSeconds: 900 }),
    ]
    expect(minutesThisWeek(sessions, today)).toBe(15)
  })

  it('rounds the summed seconds once', () => {
    const sessions = [
      session({ startedAt: atLocal(2026, 7, 6), durationSeconds: 90 }),
      session({ startedAt: atLocal(2026, 7, 5), durationSeconds: 45 }),
    ]
    // 135 s = 2.25 min — per-session rounding would give 2.75 → 3.
    expect(minutesThisWeek(sessions, today)).toBe(2)
  })

  it('ignores sessions dated after today', () => {
    const sessions = [
      session({ startedAt: atLocal(2026, 7, 7), durationSeconds: 600 }),
    ]
    expect(minutesThisWeek(sessions, today)).toBe(0)
  })

  it('counts incomplete sessions — practice time was still spent', () => {
    const sessions = [
      session({
        startedAt: atLocal(2026, 7, 6),
        durationSeconds: 120,
        completed: false,
      }),
    ]
    expect(minutesThisWeek(sessions, today)).toBe(2)
  })
})

describe('areaStatuses', () => {
  const lessons = [
    lesson({ id: 'scales-1', title: 'Major scale', area: 'scales' }),
    lesson({ id: 'scales-2', title: 'Dorian', area: 'scales' }),
    lesson({ id: 'arps-1', title: 'Maj7 arpeggios', area: 'arpeggios' }),
  ]

  it('reports every pack area with zeroed stats when nothing was practiced', () => {
    expect(areaStatuses([], lessons)).toEqual([
      {
        area: 'scales',
        lessonCount: 2,
        completedLessonCount: 0,
        attentionLessonTitles: [],
        lastPracticedDate: null,
      },
      {
        area: 'arpeggios',
        lessonCount: 1,
        completedLessonCount: 0,
        attentionLessonTitles: [],
        lastPracticedDate: null,
      },
    ])
  })

  it('counts distinct completed lessons and the latest practice date', () => {
    const sessions = [
      session({ lessonId: 'scales-1', startedAt: atLocal(2026, 7, 4) }),
      session({ lessonId: 'scales-1', startedAt: atLocal(2026, 7, 6) }),
      session({
        lessonId: 'scales-2',
        startedAt: atLocal(2026, 7, 5),
        completed: false,
      }),
    ]
    const [scales] = areaStatuses(sessions, lessons)
    expect(scales.completedLessonCount).toBe(1)
    expect(scales.lastPracticedDate).toBe('2026-07-06')
  })

  it('flags a lesson whose latest session has a shaky or missed grade', () => {
    const sessions = [
      session({
        lessonId: 'arps-1',
        results: [
          { exerciseId: 'ex-1', grade: 'got-it' },
          { exerciseId: 'ex-2', grade: 'shaky' },
        ],
      }),
    ]
    const [, arpeggios] = areaStatuses(sessions, lessons)
    expect(arpeggios.attentionLessonTitles).toEqual(['Maj7 arpeggios'])
  })

  it('clears attention once a later clean session lands', () => {
    const sessions = [
      session({
        lessonId: 'scales-1',
        startedAt: atLocal(2026, 7, 4),
        results: [{ exerciseId: 'ex-1', grade: 'missed' }],
      }),
      session({
        lessonId: 'scales-1',
        startedAt: atLocal(2026, 7, 6),
        results: [{ exerciseId: 'ex-1', grade: 'got-it' }],
      }),
    ]
    const [scales] = areaStatuses(sessions, lessons)
    expect(scales.attentionLessonTitles).toEqual([])
  })

  it('ignores sessions for lessons no longer in the pack', () => {
    const sessions = [
      session({
        lessonId: 'removed-lesson',
        results: [{ exerciseId: 'ex-1', grade: 'missed' }],
      }),
    ]
    expect(areaStatuses(sessions, lessons)).toEqual(areaStatuses([], lessons))
  })
})

describe('completedLessonIdsOn', () => {
  it('returns completed lessons for the local date only', () => {
    const sessions = [
      session({ lessonId: 'scales-1', startedAt: atLocal(2026, 7, 6) }),
      session({
        lessonId: 'scales-2',
        startedAt: atLocal(2026, 7, 6),
        completed: false,
      }),
      session({ lessonId: 'arps-1', startedAt: atLocal(2026, 7, 5) }),
    ]
    expect([...completedLessonIdsOn(sessions, '2026-07-06')]).toEqual([
      'scales-1',
    ])
  })
})
