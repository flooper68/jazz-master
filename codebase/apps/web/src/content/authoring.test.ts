import { midiAt } from '@jazz-master/theory'
import { describe, expect, it } from 'vitest'
import {
  arpeggioRun,
  arpeggiosThrough,
  closeOnBarLine,
  midiOfName,
  phrase,
  placeIn,
  scaleRun,
  sequenceRun,
  shape,
  strum,
  tab,
  threePerStringRun,
} from './authoring'
import { passBeats } from './timeline'
import type { TabNote } from './types'

const NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']

function names(notes: readonly TabNote[]): string {
  return notes.map((note) => NAMES[midiAt(note.string, note.fret) % 12]).join(' ')
}

function places(notes: readonly TabNote[]): string {
  return notes.map((note) => `${note.string}/${note.fret}`).join(' ')
}

describe('midiOfName and placeIn', () => {
  it('reads scientific pitch: the low E string is E2, middle C is C4', () => {
    expect(midiOfName('E2')).toBe(midiAt(6, 0))
    expect(midiOfName('C4')).toBe(60)
    expect(midiOfName('Bb3')).toBe(58)
    expect(midiOfName('F#4')).toBe(66)
    expect(() => midiOfName('H2')).toThrow()
  })

  it('plays a pitch on the highest string the position has it on', () => {
    // E4 is 3/9 and 2/5; in fifth position it is the B string.
    expect(placeIn(midiOfName('E4'), { min: 5, max: 9 })).toEqual({ string: 2, fret: 5 })
    expect(placeIn(midiOfName('B3'), { min: 0, max: 4 })).toEqual({ string: 2, fret: 0 })
  })

  it('reaches one fret outside a four-fret position for the note between its strings, and no further', () => {
    // C#3 lies between the low E string's C (fret 8) and the A string's D (fret 5).
    expect(placeIn(midiOfName('C#3'), { min: 5, max: 8 })).toEqual({ string: 5, fret: 4 })
    expect(() => placeIn(midiOfName('E2'), { min: 5, max: 8 })).toThrow()
  })
})

describe('closeOnBarLine', () => {
  const eighths = (count: number): TabNote[] => Array.from({ length: count }, () => ({ string: 3, fret: 5, beats: 0.5 }))

  it('leaves a tab that already ends on a bar line alone', () => {
    expect(closeOnBarLine(eighths(8))).toEqual(eighths(8))
  })

  it('holds the last note to the bar line when a drawable length does it', () => {
    expect(closeOnBarLine(eighths(5)).at(-1)?.beats).toBe(2)
  })

  it('spreads the wait over the last notes when one note would need a length the score cannot draw', () => {
    // Four eighths are two beats short. A 2.5-beat note cannot be drawn, so: a half note, and the eighth before it becomes a quarter.
    const closed = closeOnBarLine(eighths(4))
    expect(closed.map((note) => note.beats)).toEqual([0.5, 0.5, 1, 2])
    expect(passBeats(closed) % 4).toBe(0)
  })
})

describe('scaleRun', () => {
  it('plays box 1 of A minor pentatonic as every guitarist knows it', () => {
    const run = scaleRun('A', 'minorPentatonic', { min: 5, max: 8 })
    expect(places(run.slice(0, 12))).toBe('6/5 6/8 5/5 5/7 4/5 4/7 3/5 3/7 2/5 2/8 1/5 1/8')
    expect(passBeats(run) % 4).toBe(0)
  })

  it('plays each pitch once where the G and B strings overlap', () => {
    // Open position C major: B is the open B string, not the G string's fourth fret as well.
    const run = scaleRun('C', 'major', { min: 0, max: 4 })
    const pitches = run.slice(0, 17).map((note) => midiAt(note.string, note.fret))
    expect(new Set(pitches).size).toBe(pitches.length)
    expect(places(run)).not.toContain('3/4')
  })

  it('from the root: up to the top of the position, down to the bottom, back to the root', () => {
    const run = scaleRun('D', 'dorian', { min: 4, max: 8 }, { fromRoot: true })
    expect(names(run.slice(0, 3))).toBe('D E F')
    expect(names(run.slice(-1))).toBe('D')
    const pitches = run.map((note) => midiAt(note.string, note.fret))
    expect(Math.min(...pitches)).toBe(midiOfName('A2'))
    expect(Math.max(...pitches)).toBe(midiOfName('C5'))
  })
})

describe('sequenceRun', () => {
  it('climbs a cell a step at a time and mirrors it on the way down', () => {
    const thirds = sequenceRun('C', 'major', { min: 7, max: 10 }, [0, 2])
    expect(names(thirds.slice(0, 6))).toBe('B D C E D F')
    // The way down mirrors it: a third down, a step up.
    expect(names(thirds.slice(thirds.length / 2, thirds.length / 2 + 4))).toBe('D B C A')
    expect(passBeats(thirds) % 4).toBe(0)
  })

  it('covers only the span asked for, from the lowest root', () => {
    const fours = sequenceRun('C', 'major', { min: 7, max: 10 }, [0, 1, 2, 3], { span: 10 })
    expect(names(fours.slice(0, 4))).toBe('C D E F')
    expect(fours).toHaveLength(56)
  })
})

describe('threePerStringRun', () => {
  it('puts three notes on every string, continuing the scale across them', () => {
    const run = threePerStringRun('G', 'major', 3)
    expect(places(run.slice(0, 9))).toBe('6/3 6/5 6/7 5/3 5/5 5/7 4/4 4/5 4/7')
    expect(names(run.slice(0, 9))).toBe('G A B C D E F# G A')
    expect(() => threePerStringRun('G', 'major', 4)).toThrow()
  })
})

describe('arpeggios', () => {
  it('runs the chord tones of a position, low to high and back', () => {
    expect(names(arpeggioRun('C', 'major', { min: 5, max: 8 }).slice(0, 7))).toBe('C E G C E G C')
  })

  it('gives a bar with one chord root-3-5-7-root-7-5-3, and a bar with two four notes each, from the root', () => {
    const tabbed = arpeggiosThrough(
      [[{ root: 'D', chord: 'm7' }], [{ root: 'G', chord: '7' }, { root: 'C', chord: 'maj7' }]],
      { min: 5, max: 9 },
    )
    expect(names(tabbed)).toBe('D F A C D C A F G B D F C E G B')
    expect(passBeats(tabbed)).toBe(8)
  })
})

describe('phrase and tab', () => {
  it('reads pitches with lengths and repeats, ignoring bar lines', () => {
    const line = phrase('D4 F4:1 | A4:0.25*2', { min: 5, max: 9 })
    expect(line).toEqual([
      { string: 3, fret: 7, beats: 0.5 },
      { string: 2, fret: 6, beats: 1 },
      { string: 1, fret: 5, beats: 0.25 },
      { string: 1, fret: 5, beats: 0.25 },
    ])
    expect(() => phrase('D4 nonsense', { min: 5, max: 9 })).toThrow()
  })

  it('reads a tab written string/fret', () => {
    expect(tab('6/3:2 | 1/12*2')).toEqual([
      { string: 6, fret: 3, beats: 2 },
      { string: 1, fret: 12, beats: 0.5 },
      { string: 1, fret: 12, beats: 0.5 },
    ])
    expect(() => tab('7/3')).toThrow()
  })
})

describe('chords', () => {
  it('reads strings joined with + as one chord, its lowest string the note and the rest stacked above', () => {
    expect(tab('5/3+4/2+3/0+2/1+1/0:4')).toEqual([
      { string: 5, fret: 3, beats: 4, above: [{ string: 4, fret: 2 }, { string: 3, fret: 0 }, { string: 2, fret: 1 }, { string: 1, fret: 0 }] },
    ])
    // Written in any order, stacked from the bass; a string struck twice is a mistake.
    expect(tab('1/0+5/3:1')).toEqual([{ string: 5, fret: 3, beats: 1, above: [{ string: 1, fret: 0 }] }])
    expect(() => tab('5/3+5/2')).toThrow(/twice/)
  })

  it('reads a chord box low E to high E, skipping the strings marked x, with dashes for frets past 9', () => {
    expect(shape('x32010')).toEqual([
      { string: 5, fret: 3 },
      { string: 4, fret: 2 },
      { string: 3, fret: 0 },
      { string: 2, fret: 1 },
      { string: 1, fret: 0 },
    ])
    expect(shape('x-x-10-12-12-10')).toEqual([
      { string: 4, fret: 10 },
      { string: 3, fret: 12 },
      { string: 2, fret: 12 },
      { string: 1, fret: 10 },
    ])
    expect(() => shape('x3201')).toThrow(/six strings/)
    expect(() => shape('x3201y')).toThrow(/Unreadable fret/)
  })

  it('strums named shapes, a beat each unless told, repeating and holding as asked', () => {
    const shapes = { C: 'x32010', G5: '355xxx' }
    const strummed = strum('C*2 | G5:2', shapes)
    expect(strummed).toHaveLength(3)
    expect(strummed[0]).toEqual({ string: 5, fret: 3, beats: 1, above: [{ string: 4, fret: 2 }, { string: 3, fret: 0 }, { string: 2, fret: 1 }, { string: 1, fret: 0 }] })
    expect(strummed[1]).toEqual(strummed[0])
    expect(strummed[2]).toEqual({ string: 6, fret: 3, beats: 2, above: [{ string: 5, fret: 5 }, { string: 4, fret: 5 }] })
    expect(strum('C', shapes, 0.5)[0].beats).toBe(0.5)
    expect(() => strum('C Dm', shapes)).toThrow(/No shape for "Dm"/)
  })
})
