import { describe, expect, it } from 'vitest'
import { MOST_USER_EXERCISES, type UserExerciseRepository } from '../../db/userExercises'
import { createMemoryUserExerciseRepository } from '../../../test/memoryUserExercises'
import { createContext } from '../context'
import { createCallerFactory } from '../init'
import { appRouter } from '../router'

const createCaller = createCallerFactory(appRouter)

const line = {
  title: 'D Dorian — fifth position',
  area: 'scales',
  level: 2,
  tempoBpm: 80,
  duration: { kind: 'repetitions', count: 4 },
  key: 'C',
  notes: [
    { string: 5, fret: 5, beats: 1 },
    { string: 5, fret: 7, beats: 1 },
    { string: 5, fret: 8, beats: 1 },
    { string: 4, fret: 5, beats: 1 },
  ],
}

function callerFor(clerkUserId: string | null, userExercises: UserExerciseRepository | null) {
  return createCaller(createContext({ auth: { clerkUserId }, userExercises, runs: null, users: null, dbSmoke: null }))
}

describe('appRouter.exercises', () => {
  it('keeps a library per user: what one creates the other never sees', async () => {
    const repository = createMemoryUserExerciseRepository()
    const mine = callerFor('user_123', repository)
    const theirs = callerFor('user_456', repository)

    const created = await mine.exercises.create(line)
    expect(created).toMatchObject({ status: 'ok', exercise: { ...line, id: expect.stringMatching(/^user-/) } })
    await expect(mine.exercises.list()).resolves.toMatchObject({ status: 'ok', exercises: [{ title: line.title }] })
    await expect(theirs.exercises.list()).resolves.toEqual({ status: 'ok', exercises: [] })
  })

  it('answers a badly made exercise with what is wrong, and stores nothing', async () => {
    const repository = createMemoryUserExerciseRepository()
    const caller = callerFor('user_123', repository)
    await expect(caller.exercises.create({ ...line, notes: line.notes.slice(0, 3) })).resolves.toEqual({
      status: 'invalid',
      problems: [expect.stringContaining('ends mid-bar')],
    })
    await expect(caller.exercises.create('not an exercise')).resolves.toMatchObject({ status: 'invalid' })
    await expect(caller.exercises.list()).resolves.toEqual({ status: 'ok', exercises: [] })
  })

  it('deletes only the caller’s own exercise', async () => {
    const repository = createMemoryUserExerciseRepository()
    const mine = callerFor('user_123', repository)
    const theirs = callerFor('user_456', repository)
    const created = await mine.exercises.create(line)
    if (created.status !== 'ok') throw new Error('expected the exercise to be created')

    await expect(theirs.exercises.delete({ exerciseId: created.exercise.id })).resolves.toEqual({ status: 'ok', deleted: false })
    await expect(mine.exercises.delete({ exerciseId: 'scales-major-open-c' })).resolves.toEqual({ status: 'ok', deleted: false })
    await expect(mine.exercises.delete({ exerciseId: created.exercise.id })).resolves.toEqual({ status: 'ok', deleted: true })
    await expect(mine.exercises.list()).resolves.toEqual({ status: 'ok', exercises: [] })
  })

  it('stops at the library limit and says so', async () => {
    const repository = createMemoryUserExerciseRepository()
    const caller = callerFor('user_123', repository)
    for (let index = 0; index < MOST_USER_EXERCISES; index += 1) await caller.exercises.create(line)
    await expect(caller.exercises.create(line)).resolves.toEqual({
      status: 'full',
      message: `A library holds at most ${MOST_USER_EXERCISES} exercises`,
    })
  })

  it('reports unconfigured without a database, and a failed write without its cause', async () => {
    await expect(callerFor('user_123', null).exercises.list()).resolves.toEqual({ status: 'unconfigured' })
    await expect(callerFor('user_123', null).exercises.create(line)).resolves.toEqual({ status: 'unconfigured' })
    const broken: UserExerciseRepository = {
      listExercises: async () => { throw new Error('connection refused at 10.0.0.5') },
      createExercise: async () => { throw new Error('connection refused at 10.0.0.5') },
      deleteExercise: async () => { throw new Error('connection refused at 10.0.0.5') },
    }
    await expect(callerFor('user_123', broken).exercises.list()).resolves.toEqual({ status: 'error', message: 'Exercise library read failed' })
    await expect(callerFor('user_123', broken).exercises.create(line)).resolves.toEqual({ status: 'error', message: 'Exercise library write failed' })
  })

  it('rejects a caller who is not signed in before the library is touched', async () => {
    const repository = createMemoryUserExerciseRepository()
    await expect(callerFor(null, repository).exercises.create(line)).rejects.toMatchObject({ code: 'UNAUTHORIZED' })
    await expect(callerFor(null, repository).exercises.list()).rejects.toMatchObject({ code: 'UNAUTHORIZED' })
  })
})
