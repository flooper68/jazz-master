import { act, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { RunClock, runClockLabel } from './RunClock'

afterEach(() => {
  vi.useRealTimers()
})

describe('the practice run clock', () => {
  it('says the time so far, and what the run was planned to take', () => {
    expect(runClockLabel(0, 20 * 60)).toBe('0:00 of ~20 min')
    expect(runClockLabel(440, 20 * 60)).toBe('7:20 of ~20 min')
    // Nothing planned this run — one exercise, started on its own.
    expect(runClockLabel(95, null)).toBe('1:35')
    // A plan shorter than a minute still reads as a minute rather than zero.
    expect(runClockLabel(10, 40)).toBe('0:10 of ~1 min')
  })

  it('counts up while the run is open, and never below zero', () => {
    vi.useFakeTimers()
    const start = 10_000
    let now = start
    render(<RunClock startedAt={start} plannedSeconds={5 * 60} now={() => now} />)
    expect(screen.getByText('0:00 of ~5 min')).toBeInTheDocument()

    now = start + 65_000
    act(() => vi.advanceTimersByTime(1000))
    expect(screen.getByText('1:05 of ~5 min')).toBeInTheDocument()

    // The device clock jumps backwards mid-run; the run has not un-happened.
    now = start - 30_000
    act(() => vi.advanceTimersByTime(1000))
    expect(screen.getByText('0:00 of ~5 min')).toBeInTheDocument()
  })
})
