import { beforeEach, describe, expect, it } from 'vitest'
import { sessionsStore, upsertSession, type PracticeSession } from './sessions'

function session(overrides: Partial<PracticeSession>): PracticeSession {
  return {
    id: 'session-1',
    lessonId: 'scales-major-open',
    startedAt: '2026-07-06T10:00:00.000Z',
    durationSeconds: 60,
    completed: false,
    results: [{ exerciseId: 'scales-major-open-c', grade: 'got-it' }],
    ...overrides,
  }
}

beforeEach(() => {
  localStorage.clear()
})

describe('sessionsStore', () => {
  it('defaults to no sessions', () => {
    expect(sessionsStore.get()).toEqual([])
  })
})

describe('upsertSession', () => {
  it('appends sessions with new ids in insertion order', () => {
    upsertSession(session({ id: 'a' }))
    upsertSession(session({ id: 'b' }))
    expect(sessionsStore.get().map((s) => s.id)).toEqual(['a', 'b'])
  })

  it('replaces the session with the same id in place', () => {
    upsertSession(session({ id: 'a' }))
    upsertSession(session({ id: 'b' }))
    upsertSession(
      session({
        id: 'a',
        completed: true,
        durationSeconds: 300,
        results: [
          { exerciseId: 'scales-major-open-c', grade: 'got-it' },
          { exerciseId: 'scales-major-open-g', grade: 'shaky' },
        ],
      }),
    )
    const sessions = sessionsStore.get()
    expect(sessions.map((s) => s.id)).toEqual(['a', 'b'])
    expect(sessions[0].completed).toBe(true)
    expect(sessions[0].results).toHaveLength(2)
  })

  it('preserves machine score metadata on exercise results', () => {
    upsertSession(
      session({
        completed: true,
        score: 92,
        results: [
          {
            exerciseId: 'scales-major-open-c',
            grade: 'got-it',
            score: {
              score: 92,
              tolerance: 'standard',
              components: { pitch: 100, timing: 83, completeness: 100 },
              perNote: [
                {
                  expectedId: 'scales-major-open-c-0',
                  expectedNote: 'C',
                  verdict: 'correct',
                  timingOffsetSeconds: 0.012,
                  pitchCents: 4,
                },
              ],
              extras: 0,
              analyzedAt: '2026-07-06T10:01:00.000Z',
            },
          },
        ],
      }),
    )

    expect(sessionsStore.get()[0].results[0].score).toMatchObject({
      score: 92,
      tolerance: 'standard',
      perNote: [{ expectedNote: 'C', verdict: 'correct' }],
    })
  })
})
