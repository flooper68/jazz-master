import { describe, expect, it } from 'vitest'
import { transpose } from './interval'
import { noteName, parseNote } from './note'

function up(from: string, interval: Parameters<typeof transpose>[1]): string {
  return noteName(transpose(parseNote(from)!, interval))
}

describe('transpose', () => {
  it('is identity for P1', () => {
    expect(up('Gb', 'P1')).toBe('Gb')
  })

  it.each([
    // simple intervals, natural roots
    ['E', 'm2', 'F'],
    ['C', 'M2', 'D'],
    ['B', 'm3', 'D'],
    ['C', 'M3', 'E'],
    ['C', 'P4', 'F'],
    ['C', 'A4', 'F#'],
    ['C', 'd5', 'Gb'],
    ['C', 'P5', 'G'],
    ['C', 'm6', 'Ab'],
    ['C', 'M6', 'A'],
    ['C', 'd7', 'Bbb'],
    ['C', 'm7', 'Bb'],
    ['C', 'M7', 'B'],
    ['C', 'P8', 'C'],
    // spelling correctness on altered roots — the reason this module exists
    ['Eb', 'm7', 'Db'], // the seventh of Eb7 is Db, not C#
    ['Eb', 'M3', 'G'],
    ['Bb', 'M7', 'A'],
    ['Cb', 'M3', 'Eb'],
    ['E#', 'm3', 'G#'],
    ['F#', 'M3', 'A#'],
    ['Gb', 'm7', 'Fb'],
    ['B', 'M7', 'A#'],
    // compound / extension intervals collapse to the right spelling
    ['C', 'b9', 'Db'],
    ['C', '9', 'D'],
    ['C', '#9', 'D#'],
    ['C', '11', 'F'],
    ['F#', '#11', 'B#'],
    ['C', 'b13', 'Ab'],
    ['G', '13', 'E'],
  ])('%s + %s = %s', (from, interval, expected) => {
    expect(up(from, interval as Parameters<typeof transpose>[1])).toBe(
      expected,
    )
  })

  it('transposes every chromatic root by P5 with correct spelling', () => {
    const fifths: Array<[string, string]> = [
      ['C', 'G'],
      ['Db', 'Ab'],
      ['D', 'A'],
      ['Eb', 'Bb'],
      ['E', 'B'],
      ['F', 'C'],
      ['F#', 'C#'],
      ['Gb', 'Db'],
      ['G', 'D'],
      ['Ab', 'Eb'],
      ['A', 'E'],
      ['Bb', 'F'],
      ['B', 'F#'],
    ]
    for (const [from, expected] of fifths) {
      expect(up(from, 'P5')).toBe(expected)
    }
  })
})
