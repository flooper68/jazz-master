import { describe, expect, it } from 'vitest'
import { PlayAlongScheduler, type ScheduledPlayAlongEvent } from './scheduler'
import type { PlayAlongPattern } from './timeline'

function pattern(): PlayAlongPattern {
  return {
    lengthBeats: 1,
    events: [
      { kind: 'click', id: 'click-0', offsetBeats: 0, accent: true },
      {
        kind: 'note',
        id: 'note-0',
        midi: 60,
        offsetBeats: 0,
        durationBeats: 0.45,
        velocity: 96,
      },
      {
        kind: 'note',
        id: 'note-1',
        midi: 62,
        offsetBeats: 0.5,
        durationBeats: 0.45,
        velocity: 96,
      },
    ],
  }
}

describe('PlayAlongScheduler', () => {
  it('schedules count-in clicks before phrase events', () => {
    const events: ScheduledPlayAlongEvent[] = []
    const scheduler = new PlayAlongScheduler(pattern(), (event) => events.push(event), {
      lookaheadSeconds: 10,
    })

    scheduler.start({ startTime: 1, tempoBpm: 60, countInBeats: 2 })
    scheduler.flush(1)

    expect(
      events.map((event) =>
        event.kind === 'click' ? `${event.phase}:${event.time}` : `note:${event.time}`,
      ),
    ).toEqual(['count-in:1', 'count-in:2', 'phrase:3', 'note:3', 'note:3.5'])
  })

  it('wraps looped phrase events after the pattern length', () => {
    const events: ScheduledPlayAlongEvent[] = []
    const scheduler = new PlayAlongScheduler(pattern(), (event) => events.push(event), {
      lookaheadSeconds: 5,
    })

    scheduler.start({ startTime: 0, tempoBpm: 60, countInBeats: 0, loop: true })
    scheduler.flush(0)

    const notes = events.filter((event) => event.kind === 'note')
    expect(notes.map((event) => [event.pass, event.midi, event.time])).toEqual([
      [0, 60, 0],
      [0, 62, 0.5],
      [1, 60, 1],
      [1, 62, 1.5],
      [2, 60, 2],
      [2, 62, 2.5],
      [3, 60, 3],
      [3, 62, 3.5],
      [4, 60, 4],
      [4, 62, 4.5],
      [5, 60, 5],
    ])
  })

  it('stops without scheduling additional future events', () => {
    const events: ScheduledPlayAlongEvent[] = []
    const scheduler = new PlayAlongScheduler(pattern(), (event) => events.push(event), {
      lookaheadSeconds: 0,
    })

    scheduler.start({ startTime: 0, tempoBpm: 60, countInBeats: 0 })
    scheduler.flush(0)
    scheduler.stop()
    scheduler.flush(1)

    expect(events.map((event) => event.id)).toEqual(['click-0', 'note-0'])
    expect(scheduler.isRunning).toBe(false)
  })

  it('uses updated tempo for future loop passes', () => {
    const events: ScheduledPlayAlongEvent[] = []
    const scheduler = new PlayAlongScheduler(pattern(), (event) => events.push(event), {
      lookaheadSeconds: 0,
    })

    scheduler.start({ startTime: 0, tempoBpm: 60, countInBeats: 0, loop: true })
    scheduler.flush(0)
    scheduler.flush(0.5)
    scheduler.setTempoBpm(120)
    scheduler.flush(1)
    scheduler.flush(1.25)

    const notes = events.filter((event) => event.kind === 'note')
    expect(notes.map((event) => [event.pass, event.midi, event.time])).toEqual([
      [0, 60, 0],
      [0, 62, 0.5],
      [1, 60, 1],
      [1, 62, 1.25],
    ])
  })
})
