import type { PositionedNote } from '@jazz-master/theory'
import { describe, expect, it } from 'vitest'
import { createExercisePattern, secondsPerBeat } from './timeline'

function position(index: number): PositionedNote {
  return {
    string: 6,
    fret: index,
    note: { letter: 'E', accidental: 0 },
    degree: index + 1,
  }
}

describe('play-along timeline', () => {
  it('derives straight-eighth note spacing from resolved positions', () => {
    const pattern = createExercisePattern([position(0), position(1), position(2)])
    const notes = pattern.events.filter((event) => event.kind === 'note')

    expect(notes.map((event) => event.offsetBeats)).toEqual([0, 0.5, 1])
    expect(notes.map((event) => event.durationBeats)).toEqual([0.45, 0.45, 0.45])
    expect(pattern.lengthBeats).toBe(1.5)
  })

  it('places phrase clicks on quarter-note beats', () => {
    const pattern = createExercisePattern(Array.from({ length: 9 }, (_, i) => position(i)))
    const clicks = pattern.events.filter((event) => event.kind === 'click')

    expect(clicks.map((event) => event.offsetBeats)).toEqual([0, 1, 2, 3, 4])
    expect(clicks.map((event) => event.accent)).toEqual([
      true,
      false,
      false,
      false,
      true,
    ])
  })

  it('can omit phrase clicks for click-free playback', () => {
    const pattern = createExercisePattern([position(0), position(1)], {
      click: false,
    })

    expect(pattern.events.map((event) => event.kind)).toEqual(['note', 'note'])
  })

  it('converts BPM to seconds per beat', () => {
    expect(secondsPerBeat(120)).toBe(0.5)
    expect(secondsPerBeat(60)).toBe(1)
  })
})
