import { keySignature, midiAt } from '@jazz-master/theory'
import { describe, expect, it } from 'vitest'
import { EXERCISES } from './exercises'
import { clampTransposition, HIGHEST_TRANSPOSED_FRET, homeLabel, transposeExercise, transposeRange } from './transpose'
import type { Exercise } from './types'

const line: Exercise = {
  id: 'fixture',
  title: 'Fixture line',
  area: 'scales',
  level: 1,
  tempoBpm: 80,
  duration: { kind: 'repetitions', count: 2 },
  key: 'F',
  notes: [
    { string: 5, fret: 3, beats: 1 },
    { string: 4, fret: 5, beats: 1 },
    { string: 3, fret: 10, beats: 2 },
  ],
}

describe('transposeRange', () => {
  it('lets the shape slide down to the open string and up to the top fret', () => {
    expect(transposeRange(line)).toEqual({ min: -3, max: HIGHEST_TRANSPOSED_FRET - 10 })
  })

  it('only lets an open-position exercise go up, through all twelve keys', () => {
    const open = EXERCISES.find((exercise) => exercise.notes.some((note) => note.fret === 0) && Math.max(...exercise.notes.map((note) => note.fret)) <= 6)!
    expect(transposeRange(open).min).toBe(0)
    expect(transposeRange(open).max).toBe(11)
  })

  it('clamps a request to the range and ignores nonsense', () => {
    expect(clampTransposition(line, -9)).toBe(-3)
    expect(clampTransposition(line, 40)).toBe(7)
    expect(clampTransposition(line, 2.4)).toBe(2)
    expect(clampTransposition(line, Number.NaN)).toBe(0)
  })
})

describe('transposeExercise', () => {
  it('returns the exercise itself at zero', () => {
    expect(transposeExercise(line, 0)).toBe(line)
  })

  it('moves every fret by the same amount and leaves strings and rhythm alone', () => {
    const up = transposeExercise(line, 2)
    expect(up.notes).toEqual([
      { string: 5, fret: 5, beats: 1 },
      { string: 4, fret: 7, beats: 1 },
      { string: 3, fret: 12, beats: 2 },
    ])
    expect(up.id).toBe(line.id)
    expect(line.notes[0].fret).toBe(3)
  })

  it('raises every pitch by exactly the transposition', () => {
    const down = transposeExercise(line, -3)
    down.notes.forEach((note, index) => {
      expect(midiAt(note.string, note.fret)).toBe(midiAt(line.notes[index].string, line.notes[index].fret) - 3)
    })
  })

  it('renames the key so the notation is signed for the new one', () => {
    expect(transposeExercise(line, 2).key).toBe('G')
    expect(transposeExercise(line, 1).key).toBe('Gb')
    expect(transposeExercise(line, -1).key).toBe('E')
    expect(transposeExercise({ ...line, key: undefined }, 2).key).toBeUndefined()
  })

  it('stops at the edge of the range instead of running off the neck', () => {
    expect(transposeExercise(line, -8).notes[0].fret).toBe(0)
    expect(Math.max(...transposeExercise(line, 30).notes.map((note) => note.fret))).toBe(HIGHEST_TRANSPOSED_FRET)
  })

  it('gives every exercise in the pack a real key signature everywhere in its range', () => {
    for (const exercise of EXERCISES) {
      const { min, max } = transposeRange(exercise)
      for (let semitones = min; semitones <= max; semitones += 1) {
        const moved = transposeExercise(exercise, semitones)
        expect(moved.notes.every((note) => note.fret >= 0 && note.fret <= HIGHEST_TRANSPOSED_FRET)).toBe(true)
        if (exercise.key) expect(keySignature(moved.key ?? '')).not.toBeNull()
      }
    }
  })
})

describe('the tonic, transposed and captioned', () => {
  const minor: Exercise = {
    id: 'm', title: 'A minor pentatonic', area: 'scales', level: 1, tempoBpm: 60, key: 'C', tonic: 'A',
    duration: { kind: 'repetitions', count: 1 }, notes: [{ string: 6, fret: 5, beats: 4 }],
  }

  it('slides with the shape, by its commonest name', () => {
    expect(transposeExercise(minor, 1)).toMatchObject({ key: 'Db', tonic: 'Bb' })
    expect(transposeExercise(minor, -3)).toMatchObject({ key: 'A', tonic: 'F#' })
  })

  it('captions a key as a major key, and a tonic of its own as the tonic alone', () => {
    expect(homeLabel({ key: 'F' })).toBe('F major')
    expect(homeLabel({ key: 'C', tonic: 'C' })).toBe('C major')
    expect(homeLabel(minor)).toBe('A')
    expect(homeLabel({ tonic: 'G' })).toBe('G')
    expect(homeLabel({})).toBeNull()
  })

  it('names in the pack, as its tonic, the note every exercise titled in a minor key or a mode is built on', () => {
    for (const exercise of EXERCISES) {
      const named = /^([A-G][♭♯]?) (?:natural minor|harmonic minor|melodic minor|minor pentatonic|blues scale|Dorian|Phrygian|Lydian|Mixolydian|Locrian|Hungarian minor|minor triad)/.exec(exercise.title)
      if (named) expect({ id: exercise.id, tonic: exercise.tonic }).toEqual({ id: exercise.id, tonic: named[1].replace('♭', 'b').replace('♯', '#') })
    }
  })
})
