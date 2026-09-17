import { describe, expect, it } from 'vitest'
import { parseExerciseInput } from './exerciseInput'
import { EXERCISES } from './exercises'

const valid = {
  title: 'D Dorian — fifth position',
  area: 'scales',
  level: 2,
  tempoBpm: 80,
  duration: { kind: 'repetitions', count: 4 },
  key: 'C',
  notes: [
    { string: 5, fret: 5, beats: 1 },
    { string: 5, fret: 7, beats: 1 },
    { string: 5, fret: 8, beats: 1 },
    { string: 4, fret: 5, beats: 1 },
  ],
  about: ['The second mode of C major.'],
}

function problemsOf(input: unknown): string[] {
  const result = parseExerciseInput(input)
  return result.ok ? [] : result.problems
}

describe('parseExerciseInput', () => {
  it('accepts a well-formed exercise and hands it back trimmed', () => {
    const result = parseExerciseInput({ ...valid, title: '  D Dorian — fifth position  ' })
    expect(result).toEqual({ ok: true, exercise: valid })
  })

  it('accepts every exercise in the pack, so the library and the pack obey the same rules', () => {
    for (const { id: _id, ...exercise } of EXERCISES) {
      expect(problemsOf(exercise)).toEqual([])
    }
  })

  it('says where a wrongly shaped exercise is wrong instead of throwing', () => {
    expect(problemsOf(null)).not.toEqual([])
    expect(problemsOf({ ...valid, notes: undefined })[0]).toMatch(/^notes: /)
    expect(problemsOf({ ...valid, area: 'licks' })[0]).toMatch(/^area: /)
    expect(problemsOf({ ...valid, notes: [{ string: 7, fret: 1, beats: 1 }] })[0]).toMatch(/^notes\.0\.string: /)
  })

  it('refuses fields it does not know, so nothing unvetted is stored', () => {
    expect(problemsOf({ ...valid, id: 'scales-major-open-c' })).not.toEqual([])
    expect(problemsOf({ ...valid, notes: [{ ...valid.notes[0], beats: 4, html: '<b>' }] })).not.toEqual([])
  })

  it('only takes note lengths the score can draw', () => {
    const notes = [{ string: 5, fret: 5, beats: 2.5 }, { string: 5, fret: 7, beats: 1.5 }]
    expect(problemsOf({ ...valid, notes })[0]).toMatch(/^notes\.0\.beats: beats must be one of 4, 3, 2/)
  })

  it('explains how to fix a tab that ends mid-bar', () => {
    const problems = problemsOf({ ...valid, notes: valid.notes.slice(0, 3) })
    expect(problems).toEqual([
      'notes: the tab is 3 beats long, which ends mid-bar in 4/4; lengthen notes by 1 beats in total (there are no rests) or remove 3',
    ])
    expect(problemsOf({ ...valid, beatsPerBar: 3, notes: valid.notes.slice(0, 3) })).toEqual([])
  })

  it('keeps the tab on the neck, the key among the major keys, and the text short', () => {
    expect(problemsOf({ ...valid, notes: [{ string: 1, fret: 23, beats: 4 }] })[0]).toMatch(/^notes\.0\.fret: /)
    expect(problemsOf({ ...valid, key: 'G#' })[0]).toMatch(/^key: key must be a major key/)
    expect(problemsOf({ ...valid, title: 'x'.repeat(121) })[0]).toMatch(/^title: /)
    expect(problemsOf({ ...valid, about: ['x'.repeat(1201)] })[0]).toMatch(/^about\.0: /)
    expect(problemsOf({ ...valid, tempoBpm: 0 })[0]).toMatch(/^tempoBpm: /)
  })
})
