import { describe, expect, it } from 'vitest'
import type { LessonArea } from '../content'
import type { PracticeSession } from '../storage/sessions'
import {
  filterSessions,
  formatDuration,
  formatTime,
  groupSessionsByDay,
  tallyGrades,
} from './sessionHistory'

/** Local-time start so expectations hold in any test timezone. */
function session(
  id: string,
  startedAtLocal: Date,
  overrides: Partial<PracticeSession> = {},
): PracticeSession {
  return {
    id,
    lessonId: 'scales-major-open',
    startedAt: startedAtLocal.toISOString(),
    durationSeconds: 300,
    completed: true,
    results: [{ exerciseId: 'scales-major-open-c', grade: 'got-it' }],
    ...overrides,
  }
}

const AREAS = new Map<string, LessonArea>([
  ['scales-major-open', 'scales'],
  ['arpeggios-maj7', 'arpeggios'],
])

describe('groupSessionsByDay', () => {
  it('groups by local day, newest day and newest session first', () => {
    const groups = groupSessionsByDay([
      session('old', new Date(2026, 6, 4, 9)),
      session('recent-morning', new Date(2026, 6, 6, 8)),
      session('recent-evening', new Date(2026, 6, 6, 20)),
    ])
    expect(groups.map((group) => group.date)).toEqual([
      '2026-07-06',
      '2026-07-04',
    ])
    expect(groups[0].sessions.map((s) => s.id)).toEqual([
      'recent-evening',
      'recent-morning',
    ])
  })

  it('returns no groups for no sessions', () => {
    expect(groupSessionsByDay([])).toEqual([])
  })
})

describe('filterSessions', () => {
  const now = new Date(2026, 6, 6, 12)
  const sessions = [
    session('today-scales', new Date(2026, 6, 6, 8)),
    session('week-edge', new Date(2026, 5, 30, 8)), // exactly 6 days back
    session('outside-week', new Date(2026, 5, 29, 8)),
    session('outside-month', new Date(2026, 5, 1, 8)),
    session('today-arps', new Date(2026, 6, 6, 9), {
      lessonId: 'arpeggios-maj7',
    }),
    session('unknown-lesson', new Date(2026, 6, 6, 10), {
      lessonId: 'gone-from-content',
    }),
  ]

  it('keeps everything on all/all', () => {
    const kept = filterSessions(sessions, { area: 'all', range: 'all' }, AREAS, now)
    expect(kept).toHaveLength(sessions.length)
  })

  it('last 7 days keeps today through six days back, by calendar day', () => {
    const kept = filterSessions(sessions, { area: 'all', range: '7d' }, AREAS, now)
    expect(kept.map((s) => s.id)).toEqual([
      'today-scales',
      'week-edge',
      'today-arps',
      'unknown-lesson',
    ])
  })

  it('last 30 days drops only older sessions', () => {
    const kept = filterSessions(sessions, { area: 'all', range: '30d' }, AREAS, now)
    expect(kept.map((s) => s.id)).not.toContain('outside-month')
    expect(kept.map((s) => s.id)).toContain('outside-week')
  })

  it('area filter keeps only that area and excludes unknown lessons', () => {
    const kept = filterSessions(
      sessions,
      { area: 'scales', range: 'all' },
      AREAS,
      now,
    )
    expect(kept.map((s) => s.id)).toEqual([
      'today-scales',
      'week-edge',
      'outside-week',
      'outside-month',
    ])
  })

  it('combines area and range filters', () => {
    const kept = filterSessions(
      sessions,
      { area: 'scales', range: '7d' },
      AREAS,
      now,
    )
    expect(kept.map((s) => s.id)).toEqual(['today-scales', 'week-edge'])
  })
})

describe('tallyGrades', () => {
  it('counts each grade', () => {
    expect(
      tallyGrades([
        { exerciseId: 'a', grade: 'got-it' },
        { exerciseId: 'b', grade: 'got-it' },
        { exerciseId: 'c', grade: 'shaky' },
        { exerciseId: 'd', grade: 'missed' },
      ]),
    ).toEqual({ gotIt: 2, shaky: 1, missed: 1 })
  })

  it('tallies nothing for no results', () => {
    expect(tallyGrades([])).toEqual({ gotIt: 0, shaky: 0, missed: 0 })
  })
})

describe('formatDuration', () => {
  it('shows seconds under a minute', () => {
    expect(formatDuration(45)).toBe('45 s')
  })

  it('rounds to minutes from one minute up', () => {
    expect(formatDuration(60)).toBe('1 min')
    expect(formatDuration(90)).toBe('2 min')
    expect(formatDuration(725)).toBe('12 min')
  })

  it('clamps negative input to zero', () => {
    expect(formatDuration(-5)).toBe('0 s')
  })

  it('rounds fractional seconds', () => {
    expect(formatDuration(45.7)).toBe('46 s')
  })
})

describe('formatTime', () => {
  it('renders local time zero-padded', () => {
    expect(formatTime(new Date(2026, 6, 6, 9, 5).toISOString())).toBe('09:05')
    expect(formatTime(new Date(2026, 6, 6, 21, 40).toISOString())).toBe('21:40')
  })
})
