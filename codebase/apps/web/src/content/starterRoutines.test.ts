import { describe, expect, it } from 'vitest'
import { parseRoutineInput } from '../appData/routine'
import { EXERCISES } from './exercises'
import { STARTER_ROUTINES } from './starterRoutines'

describe('STARTER_ROUTINES', () => {
  it('are valid routines built from the pack alone, each under its own name', () => {
    const pack = new Set(EXERCISES.map((exercise) => exercise.id))
    expect(STARTER_ROUTINES.length).toBeGreaterThan(0)
    for (const routine of STARTER_ROUTINES) {
      expect(parseRoutineInput(routine, pack)).toEqual({ ok: true, routine })
    }
    expect(new Set(STARTER_ROUTINES.map((routine) => routine.name)).size).toBe(STARTER_ROUTINES.length)
  })
})
