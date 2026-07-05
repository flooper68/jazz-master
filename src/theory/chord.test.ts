import { describe, expect, it } from 'vitest'
import { noteName, parseChord, parseNote, spellChord } from './index'

function spell(root: string, quality: Parameters<typeof spellChord>[1]) {
  return spellChord(root, quality).map(noteName).join(' ')
}

// Hand-derived, strictly spelled — including double flats where the
// letter-per-scale-degree rule demands them (Ebm7b5 → Bbb, Cdim7 → Bbb).
const TABLES: Record<string, Array<[string, string]>> = {
  maj7: [
    ['C', 'C E G B'],
    ['Db', 'Db F Ab C'],
    ['D', 'D F# A C#'],
    ['Eb', 'Eb G Bb D'],
    ['E', 'E G# B D#'],
    ['F', 'F A C E'],
    ['F#', 'F# A# C# E#'],
    ['Gb', 'Gb Bb Db F'],
    ['G', 'G B D F#'],
    ['Ab', 'Ab C Eb G'],
    ['A', 'A C# E G#'],
    ['Bb', 'Bb D F A'],
    ['B', 'B D# F# A#'],
  ],
  '7': [
    ['C', 'C E G Bb'],
    ['Db', 'Db F Ab Cb'],
    ['D', 'D F# A C'],
    ['Eb', 'Eb G Bb Db'],
    ['E', 'E G# B D'],
    ['F', 'F A C Eb'],
    ['F#', 'F# A# C# E'],
    ['Gb', 'Gb Bb Db Fb'],
    ['G', 'G B D F'],
    ['Ab', 'Ab C Eb Gb'],
    ['A', 'A C# E G'],
    ['Bb', 'Bb D F Ab'],
    ['B', 'B D# F# A'],
  ],
  m7: [
    ['C', 'C Eb G Bb'],
    ['C#', 'C# E G# B'],
    ['D', 'D F A C'],
    ['Eb', 'Eb Gb Bb Db'],
    ['E', 'E G B D'],
    ['F', 'F Ab C Eb'],
    ['F#', 'F# A C# E'],
    ['G', 'G Bb D F'],
    ['G#', 'G# B D# F#'],
    ['A', 'A C E G'],
    ['Bb', 'Bb Db F Ab'],
    ['B', 'B D F# A'],
  ],
  m7b5: [
    ['C', 'C Eb Gb Bb'],
    ['C#', 'C# E G B'],
    ['D', 'D F Ab C'],
    ['Eb', 'Eb Gb Bbb Db'],
    ['E', 'E G Bb D'],
    ['F', 'F Ab Cb Eb'],
    ['F#', 'F# A C E'],
    ['G', 'G Bb Db F'],
    ['G#', 'G# B D F#'],
    ['A', 'A C Eb G'],
    ['Bb', 'Bb Db Fb Ab'],
    ['B', 'B D F A'],
  ],
  dim7: [
    ['C', 'C Eb Gb Bbb'],
    ['C#', 'C# E G Bb'],
    ['D', 'D F Ab Cb'],
    ['D#', 'D# F# A C'],
    ['E', 'E G Bb Db'],
    ['F', 'F Ab Cb Ebb'],
    ['F#', 'F# A C Eb'],
    ['G', 'G Bb Db Fb'],
    ['G#', 'G# B D F'],
    ['A', 'A C Eb Gb'],
    ['Bb', 'Bb Db Fb Abb'],
    ['B', 'B D F Ab'],
  ],
  '6': [
    ['C', 'C E G A'],
    ['Db', 'Db F Ab Bb'],
    ['D', 'D F# A B'],
    ['Eb', 'Eb G Bb C'],
    ['E', 'E G# B C#'],
    ['F', 'F A C D'],
    ['F#', 'F# A# C# D#'],
    ['Gb', 'Gb Bb Db Eb'],
    ['G', 'G B D E'],
    ['Ab', 'Ab C Eb F'],
    ['A', 'A C# E F#'],
    ['Bb', 'Bb D F G'],
    ['B', 'B D# F# G#'],
  ],
  m6: [
    ['C', 'C Eb G A'],
    ['C#', 'C# E G# A#'],
    ['D', 'D F A B'],
    ['Eb', 'Eb Gb Bb C'],
    ['E', 'E G B C#'],
    ['F', 'F Ab C D'],
    ['F#', 'F# A C# D#'],
    ['G', 'G Bb D E'],
    ['G#', 'G# B D# E#'],
    ['A', 'A C E F#'],
    ['Bb', 'Bb Db F G'],
    ['B', 'B D F# G#'],
  ],
}

describe('spellChord', () => {
  for (const [quality, table] of Object.entries(TABLES)) {
    describe(quality, () => {
      it.each(table)(`%s${quality} = %s`, (root, expected) => {
        expect(spell(root, quality as Parameters<typeof spellChord>[1])).toBe(
          expected,
        )
      })
    })
  }

  it('accepts a Note object as root', () => {
    const root = parseNote('Eb')!
    expect(spellChord(root, '7').map(noteName)).toEqual(['Eb', 'G', 'Bb', 'Db'])
  })

  it('throws on an unparseable root string', () => {
    expect(() => spellChord('H', 'maj7')).toThrow()
  })
})

describe('parseChord', () => {
  it.each([
    ['Cmaj7', 'C', 'maj7'],
    ['F#m7b5', 'F#', 'm7b5'],
    ['Bb7', 'Bb', '7'],
    ['Ebm6', 'Eb', 'm6'],
    ['Gdim7', 'G', 'dim7'],
    ['A6', 'A', '6'],
    ['Dm7', 'D', 'm7'],
    ['Bbbdim7', 'Bbb', 'dim7'],
  ])('parses %s', (symbol, root, quality) => {
    const chord = parseChord(symbol)
    expect(chord).not.toBeNull()
    expect(noteName(chord!.root)).toBe(root)
    expect(chord!.quality).toBe(quality)
  })

  it.each(['H7', 'Cmaj9', 'maj7', '', 'cm7', 'Cm', 'C maj7', 'B♭7'])(
    'returns null for %j',
    (symbol) => {
      expect(parseChord(symbol)).toBeNull()
    },
  )

  it('round-trips with spellChord for the task examples', () => {
    const eb7 = parseChord('Eb7')!
    expect(spellChord(eb7.root, eb7.quality).map(noteName)).toEqual([
      'Eb',
      'G',
      'Bb',
      'Db',
    ])
  })
})
