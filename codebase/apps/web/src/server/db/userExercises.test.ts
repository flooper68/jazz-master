import { describe, expect, it } from 'vitest'
import { rowIdOfUserExercise, storedExercise, userExerciseId } from './userExercises'

const rowId = '57951585-62b0-4bc8-9c1f-d970afc7adfb'
const stored = {
  title: 'Stored line',
  area: 'scales',
  level: 1,
  tempoBpm: 60,
  duration: { kind: 'repetitions', count: 2 },
  notes: [{ string: 5, fret: 3, beats: 4 }],
}

describe('stored user exercises', () => {
  it('reads a stored row back as an exercise under its namespaced id', () => {
    expect(storedExercise(rowId, stored)).toEqual({ ...stored, id: `user-${rowId}` })
  })

  it('leaves out a row that no longer passes the rules instead of handing it to the player', () => {
    expect(storedExercise(rowId, { ...stored, notes: [] })).toBeNull()
    expect(storedExercise(rowId, { ...stored, script: '<script>' })).toBeNull()
    expect(storedExercise(rowId, null)).toBeNull()
    expect(storedExercise(rowId, 'text')).toBeNull()
  })

  it('only takes ids of its own making apart', () => {
    expect(rowIdOfUserExercise(userExerciseId(rowId))).toBe(rowId)
    expect(rowIdOfUserExercise('scales-major-open-c')).toBeNull()
    expect(rowIdOfUserExercise('user-not-a-uuid')).toBeNull()
    expect(rowIdOfUserExercise(`user-${rowId}' or 1=1 --`)).toBeNull()
  })
})
