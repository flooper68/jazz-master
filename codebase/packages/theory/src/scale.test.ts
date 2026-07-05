import { describe, expect, it } from 'vitest'
import {
  noteName,
  parseNote,
  SCALE_TYPES,
  spellScale,
  type ScaleType,
} from './index'

function spell(root: string, type: ScaleType) {
  return spellScale(root, type).map(noteName).join(' ')
}

// Hand-derived, strictly spelled — one letter per scale degree, so flat keys
// use Cb/Fb (Eb aeolian contains Cb, never B) and extreme keys use double
// accidentals (G# melodic minor contains F##, Eb locrian contains Bbb).
const TABLES: Record<ScaleType, Array<[string, string]>> = {
  ionian: [
    ['C', 'C D E F G A B'],
    ['Db', 'Db Eb F Gb Ab Bb C'],
    ['D', 'D E F# G A B C#'],
    ['Eb', 'Eb F G Ab Bb C D'],
    ['E', 'E F# G# A B C# D#'],
    ['F', 'F G A Bb C D E'],
    ['F#', 'F# G# A# B C# D# E#'],
    ['Gb', 'Gb Ab Bb Cb Db Eb F'],
    ['G', 'G A B C D E F#'],
    ['Ab', 'Ab Bb C Db Eb F G'],
    ['A', 'A B C# D E F# G#'],
    ['Bb', 'Bb C D Eb F G A'],
    ['B', 'B C# D# E F# G# A#'],
  ],
  dorian: [
    ['C', 'C D Eb F G A Bb'],
    ['C#', 'C# D# E F# G# A# B'],
    ['D', 'D E F G A B C'],
    ['Eb', 'Eb F Gb Ab Bb C Db'],
    ['E', 'E F# G A B C# D'],
    ['F', 'F G Ab Bb C D Eb'],
    ['F#', 'F# G# A B C# D# E'],
    ['G', 'G A Bb C D E F'],
    ['G#', 'G# A# B C# D# E# F#'],
    ['A', 'A B C D E F# G'],
    ['Bb', 'Bb C Db Eb F G Ab'],
    ['B', 'B C# D E F# G# A'],
  ],
  phrygian: [
    ['C', 'C Db Eb F G Ab Bb'],
    ['C#', 'C# D E F# G# A B'],
    ['D', 'D Eb F G A Bb C'],
    ['Eb', 'Eb Fb Gb Ab Bb Cb Db'],
    ['E', 'E F G A B C D'],
    ['F', 'F Gb Ab Bb C Db Eb'],
    ['F#', 'F# G A B C# D E'],
    ['G', 'G Ab Bb C D Eb F'],
    ['G#', 'G# A B C# D# E F#'],
    ['A', 'A Bb C D E F G'],
    ['Bb', 'Bb Cb Db Eb F Gb Ab'],
    ['B', 'B C D E F# G A'],
  ],
  lydian: [
    ['C', 'C D E F# G A B'],
    ['Db', 'Db Eb F G Ab Bb C'],
    ['D', 'D E F# G# A B C#'],
    ['Eb', 'Eb F G A Bb C D'],
    ['E', 'E F# G# A# B C# D#'],
    ['F', 'F G A B C D E'],
    ['F#', 'F# G# A# B# C# D# E#'],
    ['Gb', 'Gb Ab Bb C Db Eb F'],
    ['G', 'G A B C# D E F#'],
    ['Ab', 'Ab Bb C D Eb F G'],
    ['A', 'A B C# D# E F# G#'],
    ['Bb', 'Bb C D E F G A'],
    ['B', 'B C# D# E# F# G# A#'],
  ],
  mixolydian: [
    ['C', 'C D E F G A Bb'],
    ['Db', 'Db Eb F Gb Ab Bb Cb'],
    ['D', 'D E F# G A B C'],
    ['Eb', 'Eb F G Ab Bb C Db'],
    ['E', 'E F# G# A B C# D'],
    ['F', 'F G A Bb C D Eb'],
    ['F#', 'F# G# A# B C# D# E'],
    ['Gb', 'Gb Ab Bb Cb Db Eb Fb'],
    ['G', 'G A B C D E F'],
    ['Ab', 'Ab Bb C Db Eb F Gb'],
    ['A', 'A B C# D E F# G'],
    ['Bb', 'Bb C D Eb F G Ab'],
    ['B', 'B C# D# E F# G# A'],
  ],
  aeolian: [
    ['C', 'C D Eb F G Ab Bb'],
    ['C#', 'C# D# E F# G# A B'],
    ['D', 'D E F G A Bb C'],
    ['Eb', 'Eb F Gb Ab Bb Cb Db'],
    ['E', 'E F# G A B C D'],
    ['F', 'F G Ab Bb C Db Eb'],
    ['F#', 'F# G# A B C# D E'],
    ['G', 'G A Bb C D Eb F'],
    ['G#', 'G# A# B C# D# E F#'],
    ['A', 'A B C D E F G'],
    ['Bb', 'Bb C Db Eb F Gb Ab'],
    ['B', 'B C# D E F# G A'],
  ],
  locrian: [
    ['C', 'C Db Eb F Gb Ab Bb'],
    ['C#', 'C# D E F# G A B'],
    ['D', 'D Eb F G Ab Bb C'],
    ['Eb', 'Eb Fb Gb Ab Bbb Cb Db'],
    ['E', 'E F G A Bb C D'],
    ['F', 'F Gb Ab Bb Cb Db Eb'],
    ['F#', 'F# G A B C D E'],
    ['G', 'G Ab Bb C Db Eb F'],
    ['G#', 'G# A B C# D E F#'],
    ['A', 'A Bb C D Eb F G'],
    ['Bb', 'Bb Cb Db Eb Fb Gb Ab'],
    ['B', 'B C D E F G A'],
  ],
  melodicMinor: [
    ['C', 'C D Eb F G A B'],
    ['C#', 'C# D# E F# G# A# B#'],
    ['D', 'D E F G A B C#'],
    ['Eb', 'Eb F Gb Ab Bb C D'],
    ['E', 'E F# G A B C# D#'],
    ['F', 'F G Ab Bb C D E'],
    ['F#', 'F# G# A B C# D# E#'],
    ['G', 'G A Bb C D E F#'],
    ['G#', 'G# A# B C# D# E# F##'],
    ['A', 'A B C D E F# G#'],
    ['Bb', 'Bb C Db Eb F G A'],
    ['B', 'B C# D E F# G# A#'],
  ],
  harmonicMinor: [
    ['C', 'C D Eb F G Ab B'],
    ['C#', 'C# D# E F# G# A B#'],
    ['D', 'D E F G A Bb C#'],
    ['Eb', 'Eb F Gb Ab Bb Cb D'],
    ['E', 'E F# G A B C D#'],
    ['F', 'F G Ab Bb C Db E'],
    ['F#', 'F# G# A B C# D E#'],
    ['G', 'G A Bb C D Eb F#'],
    ['G#', 'G# A# B C# D# E F##'],
    ['A', 'A B C D E F G#'],
    ['Bb', 'Bb C Db Eb F Gb A'],
    ['B', 'B C# D E F# G A#'],
  ],
  majorPentatonic: [
    ['C', 'C D E G A'],
    ['Db', 'Db Eb F Ab Bb'],
    ['D', 'D E F# A B'],
    ['Eb', 'Eb F G Bb C'],
    ['E', 'E F# G# B C#'],
    ['F', 'F G A C D'],
    ['F#', 'F# G# A# C# D#'],
    ['Gb', 'Gb Ab Bb Db Eb'],
    ['G', 'G A B D E'],
    ['Ab', 'Ab Bb C Eb F'],
    ['A', 'A B C# E F#'],
    ['Bb', 'Bb C D F G'],
    ['B', 'B C# D# F# G#'],
  ],
  minorPentatonic: [
    ['C', 'C Eb F G Bb'],
    ['C#', 'C# E F# G# B'],
    ['D', 'D F G A C'],
    ['Eb', 'Eb Gb Ab Bb Db'],
    ['E', 'E G A B D'],
    ['F', 'F Ab Bb C Eb'],
    ['F#', 'F# A B C# E'],
    ['G', 'G Bb C D F'],
    ['G#', 'G# B C# D# F#'],
    ['A', 'A C D E G'],
    ['Bb', 'Bb Db Eb F Ab'],
    ['B', 'B D E F# A'],
  ],
  blues: [
    ['C', 'C Eb F Gb G Bb'],
    ['C#', 'C# E F# G G# B'],
    ['D', 'D F G Ab A C'],
    ['Eb', 'Eb Gb Ab Bbb Bb Db'],
    ['E', 'E G A Bb B D'],
    ['F', 'F Ab Bb Cb C Eb'],
    ['F#', 'F# A B C C# E'],
    ['G', 'G Bb C Db D F'],
    ['G#', 'G# B C# D D# F#'],
    ['A', 'A C D Eb E G'],
    ['Bb', 'Bb Db Eb Fb F Ab'],
    ['B', 'B D E F F# A'],
  ],
}

describe('spellScale', () => {
  for (const [type, table] of Object.entries(TABLES)) {
    describe(type, () => {
      it.each(table)(`%s ${type} = %s`, (root, expected) => {
        expect(spell(root, type as ScaleType)).toBe(expected)
      })
    })
  }

  it('accepts a Note object as root', () => {
    const root = parseNote('Eb')!
    expect(spellScale(root, 'dorian').map(noteName)).toEqual([
      'Eb',
      'F',
      'Gb',
      'Ab',
      'Bb',
      'C',
      'Db',
    ])
  })

  it('throws on an unparseable root string', () => {
    expect(() => spellScale('H', 'ionian')).toThrow()
  })

  it('lists every scale type in SCALE_TYPES', () => {
    expect([...SCALE_TYPES].sort()).toEqual(Object.keys(TABLES).sort())
  })
})
