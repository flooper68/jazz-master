import { describe, expect, it } from 'vitest'
import { practiceRuns, runDifficulty, runFeel } from './practiceRun'
import type { Difficulty, ExerciseRun, Feel } from './run'

function run(
  id: string,
  startedAt: string,
  sessionId: string | null,
  { seconds = 60, completed = true, difficulty = null as Difficulty | null, feel = null as Feel | null } = {},
): ExerciseRun {
  return {
    id,
    exerciseId: `ex-${id}`,
    startedAt,
    durationSeconds: seconds,
    tempoBpm: 80,
    passes: 2,
    completed,
    difficulty,
    feel,
    sessionId,
  }
}

describe('practice runs', () => {
  it('gathers a sitting from the runs that share its id, newest sitting first', () => {
    const gathered = practiceRuns([
      run('c', '2026-09-17T18:10:00.000Z', 's-2'),
      run('a', '2026-09-17T09:00:00.000Z', 's-1', { seconds: 90 }),
      run('b', '2026-09-17T09:05:00.000Z', 's-1', { seconds: 120, completed: false }),
    ])

    expect(gathered.map((sitting) => sitting.id)).toEqual(['s-2', 's-1'])
    const morning = gathered[1]
    // Its exercises in playing order, however the history arrived.
    expect(morning.runs.map((exercise) => exercise.id)).toEqual(['a', 'b'])
    expect(morning.startedAt).toBe('2026-09-17T09:00:00.000Z')
    expect(morning.seconds).toBe(210)
    expect(morning.completed).toBe(1)
  })

  it('makes a sitting of one of a run recorded before sittings were the only way to play', () => {
    const gathered = practiceRuns([
      run('old-1', '2026-09-15T09:00:00.000Z', null),
      run('old-2', '2026-09-15T09:02:00.000Z', null),
    ])
    expect(gathered).toHaveLength(2)
    expect(gathered.every((sitting) => sitting.runs.length === 1)).toBe(true)
  })

  it('says how a sitting mostly went and mostly felt, and nothing when it was not answered', () => {
    const answered = practiceRuns([
      run('a', '2026-09-17T09:00:00.000Z', 's', { difficulty: 'good', feel: 'loved' }),
      run('b', '2026-09-17T09:05:00.000Z', 's', { difficulty: 'hard', feel: 'fine' }),
      run('c', '2026-09-17T09:10:00.000Z', 's', { difficulty: 'hard', feel: 'loved' }),
    ])[0]
    expect(runDifficulty(answered)).toBe('hard')
    expect(runFeel(answered)).toBe('loved')

    const silent = practiceRuns([run('a', '2026-09-17T09:00:00.000Z', 's')])[0]
    expect(runDifficulty(silent)).toBeNull()
    expect(runFeel(silent)).toBeNull()
  })
})
