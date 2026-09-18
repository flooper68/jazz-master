import { describe, expect, it } from 'vitest'
import { PLAN_CONSTANTS } from './planConstants'
import { recoveryState } from './recovery'
import type { ExerciseRun, Feel } from './run'

/** When the app decides to back off, and when it leaves well alone. */

let counter = 0

function run(day: string, { completed = true, feel = null as Feel | null } = {}): ExerciseRun {
  counter += 1
  return {
    id: `run-${counter}`,
    exerciseId: 'ex-1',
    startedAt: new Date(`${day}T10:00:00`).toISOString(),
    durationSeconds: 120,
    tempoBpm: 100,
    passes: 4,
    completed,
    difficulty: null,
    feel,
    sessionId: null,
  }
}

/** A day where most of what was started was abandoned, and nothing was enjoyed. */
function badDay(day: string): ExerciseRun[] {
  return [run(day, { completed: false }), run(day, { completed: false }), run(day, { completed: true })]
}

function goodDay(day: string): ExerciseRun[] {
  return [run(day), run(day), run(day)]
}

const on = (day: string) => new Date(`${day}T20:00:00`)

describe('recoveryState', () => {
  it('has nothing to say before anything has been played', () => {
    expect(recoveryState([], on('2026-03-05'))).toEqual({ recovering: false, badDays: 0 })
  })

  it('does not back off after one bad day', () => {
    const state = recoveryState([...goodDay('2026-03-03'), ...badDay('2026-03-04')], on('2026-03-05'))
    expect(state).toEqual({ recovering: false, badDays: 1 })
  })

  it('backs off after two in a row', () => {
    const state = recoveryState([...badDay('2026-03-03'), ...badDay('2026-03-04')], on('2026-03-05'))
    expect(state.badDays).toBe(2)
    expect(state.recovering).toBe(true)
  })

  it('counts a day with something loved in it as a good day, however it went', () => {
    // Everything abandoned, but one exercise was still a pleasure.
    const loved = [run('2026-03-04', { completed: false }), run('2026-03-04', { completed: false, feel: 'loved' })]
    const state = recoveryState([...badDay('2026-03-03'), ...loved], on('2026-03-05'))
    expect(state).toEqual({ recovering: false, badDays: 0 })
  })

  it('counts a day where the work got finished as a good day, however it felt', () => {
    const state = recoveryState([...badDay('2026-03-03'), ...goodDay('2026-03-04')], on('2026-03-05'))
    expect(state).toEqual({ recovering: false, badDays: 0 })
  })

  it('does not count a rest day against the user', () => {
    // Two bad days with a week between them: still two bad days, and no amount
    // of not practising makes a third.
    const state = recoveryState([...badDay('2026-03-03'), ...badDay('2026-03-10')], on('2026-03-11'))
    expect(state.badDays).toBe(2)
    expect(state.recovering).toBe(true)
  })

  it('does not judge the day being practised, so a session cannot turn mid-sitting', () => {
    // Yesterday went badly, and the first thing today was abandoned. That is
    // not yet a second bad day: today is not over.
    const runs = [...badDay('2026-03-04'), run('2026-03-05', { completed: false })]
    expect(recoveryState(runs, on('2026-03-05'))).toEqual({ recovering: false, badDays: 1 })
    // Tomorrow, with today finished and bad, it is.
    expect(recoveryState(runs, on('2026-03-06')).recovering).toBe(true)
  })

  it('lets a bad week go stale rather than greeting a returning player with it', () => {
    const runs = [...badDay('2026-03-03'), ...badDay('2026-03-04')]
    const staleAfter = PLAN_CONSTANTS.badDayStaleAfterDays
    const within = new Date(`2026-03-04T20:00:00`)
    within.setDate(within.getDate() + staleAfter)
    const beyond = new Date(`2026-03-04T20:00:00`)
    beyond.setDate(beyond.getDate() + staleAfter + 1)

    expect(recoveryState(runs, within).recovering).toBe(true)
    // Weeks later the same two days are history, not a state to recover from.
    expect(recoveryState(runs, beyond).recovering).toBe(false)
    expect(recoveryState(runs, beyond).badDays).toBe(2)
  })

  it('reads the day it was asked about, not the days after it', () => {
    const runs = [...badDay('2026-03-03'), ...badDay('2026-03-04'), ...goodDay('2026-03-05')]
    // Asked on the fifth, that day's own runs are not counted yet.
    expect(recoveryState(runs, on('2026-03-05')).recovering).toBe(true)
    expect(recoveryState(runs, on('2026-03-06')).recovering).toBe(false)
  })

  it('needs as many bad days as the constant says', () => {
    const days = Array.from({ length: PLAN_CONSTANTS.badDaysBeforeRecovery }, (_, index) =>
      badDay(`2026-03-${String(index + 1).padStart(2, '0')}`),
    ).flat()
    const after = on(`2026-03-0${PLAN_CONSTANTS.badDaysBeforeRecovery + 1}`)
    expect(recoveryState(days, after).badDays).toBe(PLAN_CONSTANTS.badDaysBeforeRecovery)
    expect(recoveryState(days, after).recovering).toBe(true)
  })
})
