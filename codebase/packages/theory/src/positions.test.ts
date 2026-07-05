import { describe, expect, it } from 'vitest'
import {
  arpeggioPositions,
  noteAt,
  noteName,
  notePositions,
  parseNote,
  pitchClass,
  scalePositions,
  SCALE_TYPES,
  spellScale,
  STANDARD_TUNING,
  type FretRange,
  type PositionedNote,
} from './index'

/** Compact readable form: "string:fret name(degree)". */
function show(positions: PositionedNote[]): string[] {
  return positions.map(
    (p) => `${p.string}:${p.fret} ${noteName(p.note)}(${p.degree})`,
  )
}

function scale(root: string, type: (typeof SCALE_TYPES)[number]) {
  return { root: parseNote(root)!, type }
}

describe('scalePositions', () => {
  // C major around 7th position — the classic pattern, hand-derived.
  it('spells C ionian in frets 7–10', () => {
    const result = scalePositions(scale('C', 'ionian'), { min: 7, max: 10 })
    expect(show(result)).toEqual([
      '6:7 B(7)',
      '6:8 C(1)',
      '6:10 D(2)',
      '5:7 E(3)',
      '5:8 F(4)',
      '5:10 G(5)',
      '4:7 A(6)',
      '4:9 B(7)',
      '4:10 C(1)',
      '3:7 D(2)',
      '3:9 E(3)',
      '3:10 F(4)',
      '2:8 G(5)',
      '2:10 A(6)',
      '1:7 B(7)',
      '1:8 C(1)',
      '1:10 D(2)',
    ])
  })

  it('includes open strings when the window starts at fret 0', () => {
    const result = scalePositions(scale('C', 'ionian'), { min: 0, max: 3 })
    expect(show(result)).toEqual([
      '6:0 E(3)',
      '6:1 F(4)',
      '6:3 G(5)',
      '5:0 A(6)',
      '5:2 B(7)',
      '5:3 C(1)',
      '4:0 D(2)',
      '4:2 E(3)',
      '4:3 F(4)',
      '3:0 G(5)',
      '3:2 A(6)',
      '2:0 B(7)',
      '2:1 C(1)',
      '2:3 D(2)',
      '1:0 E(3)',
      '1:1 F(4)',
      '1:3 G(5)',
    ])
  })

  it('spells F# dorian in frets 1–4 with sharps, never flats', () => {
    const result = scalePositions(scale('F#', 'dorian'), { min: 1, max: 4 })
    expect(show(result)).toEqual([
      '6:2 F#(1)',
      '6:4 G#(2)',
      '5:2 B(4)',
      '5:4 C#(5)',
      '4:1 D#(6)',
      '4:2 E(7)',
      '4:4 F#(1)',
      '3:1 G#(2)',
      '3:2 A(3)',
      '3:4 B(4)',
      '2:2 C#(5)',
      '2:4 D#(6)',
      '1:2 F#(1)',
      '1:4 G#(2)',
    ])
  })

  it('spells F# dorian in frets 8–12', () => {
    const result = scalePositions(scale('F#', 'dorian'), { min: 8, max: 12 })
    expect(show(result)).toEqual([
      '6:9 C#(5)',
      '6:11 D#(6)',
      '6:12 E(7)',
      '5:9 F#(1)',
      '5:11 G#(2)',
      '5:12 A(3)',
      '4:9 B(4)',
      '4:11 C#(5)',
      '3:8 D#(6)',
      '3:9 E(7)',
      '3:11 F#(1)',
      '2:9 G#(2)',
      '2:10 A(3)',
      '2:12 B(4)',
      '1:9 C#(5)',
      '1:11 D#(6)',
      '1:12 E(7)',
    ])
  })

  it('rejects invalid windows', () => {
    const cMajor = scale('C', 'ionian')
    expect(() => scalePositions(cMajor, { min: 5, max: 3 })).toThrow()
    expect(() => scalePositions(cMajor, { min: -1, max: 3 })).toThrow()
    expect(() => scalePositions(cMajor, { min: 0, max: 2.5 })).toThrow()
  })
})

describe('notePositions', () => {
  it('respects an alternate tuning (drop D)', () => {
    const dropD = {
      ...STANDARD_TUNING,
      6: parseNote('D')!,
    }
    const notes = spellScale('D', 'mixolydian') // D E F# G A B C
    const result = notePositions(notes, { min: 0, max: 2 }, dropD)
    // String 6 is now D: open D(1), fret 2 E(2) — standard E string gives
    // E(2) open, F#(3) at 2 instead.
    expect(
      show(result.filter((p) => p.string === 6)),
    ).toEqual(['6:0 D(1)', '6:2 E(2)'])
    expect(
      show(
        notePositions(notes, { min: 0, max: 2 }).filter((p) => p.string === 6),
      ),
    ).toEqual(['6:0 E(2)', '6:2 F#(3)'])
  })

  it('gives the earlier note the position when pitch classes collide', () => {
    const collision = [parseNote('C')!, parseNote('B#')!]
    const result = notePositions(collision, { min: 8, max: 8 })
    expect(show(result)).toEqual(['6:8 C(1)', '1:8 C(1)'])
  })
})

describe('arpeggioPositions', () => {
  // Enharmonics matter: the seventh of Eb7 is Db, and the positions must
  // carry that spelling even though noteAt alone would say C#.
  it('spells an Eb7 arpeggio in frets 5–9 with the chord spelling', () => {
    const result = arpeggioPositions(
      { root: parseNote('Eb')!, quality: '7' },
      { min: 5, max: 9 },
    )
    expect(show(result)).toEqual([
      '6:6 Bb(3)',
      '6:9 Db(4)',
      '5:6 Eb(1)',
      '4:5 G(2)',
      '4:8 Bb(3)',
      '3:6 Db(4)',
      '3:8 Eb(1)',
      '2:8 G(2)',
      '1:6 Bb(3)',
      '1:9 Db(4)',
    ])
  })
})

describe('notePositions properties', () => {
  // All twelve keys, both spellings at the enharmonic seam.
  const roots = [
    'C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B',
  ] as const
  const windows: FretRange[] = [
    { min: 0, max: 4 },
    { min: 3, max: 7 },
    { min: 7, max: 11 },
    { min: 10, max: 15 },
  ]

  it('agrees with noteAt, stays in window, orders low→high, misses nothing', () => {
    for (const type of SCALE_TYPES) {
      for (const root of roots) {
        const notes = spellScale(root, type)
        const scalePcs = new Set(notes.map(pitchClass))
        for (const window of windows) {
          const result = notePositions(notes, window)

          for (const p of result) {
            // The sounding pitch matches the carried spelling.
            expect(pitchClass(noteAt(p.string, p.fret))).toBe(
              pitchClass(p.note),
            )
            // The carried note is the scale's own spelling at that degree.
            expect(p.note).toEqual(notes[p.degree - 1])
            expect(p.fret).toBeGreaterThanOrEqual(window.min)
            expect(p.fret).toBeLessThanOrEqual(window.max)
          }

          // Ordered low string (6) to high, then by fret.
          for (let i = 1; i < result.length; i++) {
            const prev = result[i - 1]
            const curr = result[i]
            expect(
              curr.string < prev.string ||
                (curr.string === prev.string && curr.fret > prev.fret),
            ).toBe(true)
          }

          // Exhaustive: every in-window fret sounding a scale tone appears.
          const found = new Set(result.map((p) => `${p.string}:${p.fret}`))
          for (const string of [6, 5, 4, 3, 2, 1] as const) {
            for (let fret = window.min; fret <= window.max; fret++) {
              const sounds = scalePcs.has(pitchClass(noteAt(string, fret)))
              expect(found.has(`${string}:${fret}`)).toBe(sounds)
            }
          }
        }
      }
    }
  })
})
