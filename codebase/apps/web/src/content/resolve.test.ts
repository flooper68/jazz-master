import { noteName } from '@jazz-master/theory'
import { describe, expect, it } from 'vitest'
import { resolveExercise } from './resolve'
import type { Exercise } from './types'

function exercise(overrides: Partial<Exercise> = {}): Exercise {
  return {
    id: 'ex-1',
    title: 'C major, position II',
    material: { kind: 'scale', root: 'C', scale: 'ionian' },
    window: { min: 1, max: 5 },
    tempoBpm: 80,
    duration: { kind: 'minutes', minutes: 5 },
    display: ['fretboard'],
    ...overrides,
  }
}

describe('resolveExercise', () => {
  it('resolves a scale exercise to its spelled notes', () => {
    const { notes } = resolveExercise(exercise())
    expect(notes.map(noteName)).toEqual(['C', 'D', 'E', 'F', 'G', 'A', 'B'])
  })

  it('keeps flat-key spelling (Bb major has Eb, not D#)', () => {
    const { notes } = resolveExercise(
      exercise({ material: { kind: 'scale', root: 'Bb', scale: 'ionian' } }),
    )
    expect(notes.map(noteName)).toEqual(['Bb', 'C', 'D', 'Eb', 'F', 'G', 'A'])
  })

  it('resolves an arpeggio with correct enharmonics (seventh of Eb7 is Db)', () => {
    const { notes } = resolveExercise(
      exercise({ material: { kind: 'arpeggio', root: 'Eb', quality: '7' } }),
    )
    expect(notes.map(noteName)).toEqual(['Eb', 'G', 'Bb', 'Db'])
  })

  it('returns positions inside the window that all sound resolved notes', () => {
    const resolved = resolveExercise(exercise({ window: { min: 7, max: 10 } }))
    const names = new Set(resolved.notes.map(noteName))
    expect(resolved.positions.length).toBeGreaterThan(0)
    for (const position of resolved.positions) {
      expect(position.fret).toBeGreaterThanOrEqual(7)
      expect(position.fret).toBeLessThanOrEqual(10)
      expect(names).toContain(noteName(position.note))
    }
  })

  it('positions carry the sequence spelling and degree (Eb7 fret 11 on string 4 is Db, degree 4)', () => {
    const { positions } = resolveExercise(
      exercise({
        material: { kind: 'arpeggio', root: 'Eb', quality: '7' },
        window: { min: 8, max: 11 },
      }),
    )
    const seventh = positions.find((p) => p.string === 4 && p.fret === 11)
    expect(seventh).toBeDefined()
    expect(noteName(seventh!.note)).toBe('Db')
    expect(seventh!.degree).toBe(4)
  })

  it('throws on an unparseable root', () => {
    const broken = exercise({
      material: {
        kind: 'scale',
        root: 'H' as never,
        scale: 'ionian',
      },
    })
    expect(() => resolveExercise(broken)).toThrow(/unparseable root "H"/)
  })
})
