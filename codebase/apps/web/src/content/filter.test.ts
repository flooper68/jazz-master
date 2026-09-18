import { describe, expect, it } from 'vitest'
import { activeFilterCount, EVERYTHING, exercisePosition, facetCounts, filterExercises, toggleFacetValue } from './filter'
import type { Exercise } from './types'

function exercise(id: string, rest: Partial<Exercise> = {}): Exercise {
  return {
    id,
    title: id,
    area: 'lines',
    level: 2,
    tempoBpm: 80,
    duration: { kind: 'repetitions', count: 2 },
    notes: [{ string: 3, fret: 5, beats: 4 }],
    ...rest,
  }
}

const scale = exercise('major-scale', { area: 'scales', level: 1 })
const bebop = exercise('bebop-line', { styles: ['jazz/bebop'], contexts: ['major-ii-V-I'], feel: 'swing-8', level: 3 })
const blues = exercise('blues-lick', { styles: ['blues', 'rock'], contexts: ['12-bar-blues'], techniques: ['bends'] })
const shells = exercise('shells', { area: 'chords', styles: ['jazz'], voicings: ['shell'], contexts: ['major-ii-V-I'] })
const all = [scale, bebop, blues, shells]

function ids(found: readonly Exercise[]): string[] {
  return found.map((item) => item.id)
}

describe('filterExercises', () => {
  it('keeps everything, in order, when nothing is chosen', () => {
    expect(filterExercises(all, EVERYTHING)).toEqual(all)
  })

  it('widens within a facet and narrows across facets', () => {
    expect(ids(filterExercises(all, { ...EVERYTHING, contexts: ['major-ii-V-I', '12-bar-blues'] }))).toEqual([
      'bebop-line', 'blues-lick', 'shells',
    ])
    expect(ids(filterExercises(all, { ...EVERYTHING, contexts: ['major-ii-V-I', '12-bar-blues'], areas: ['chords'] }))).toEqual(['shells'])
  })

  it('finds the children of a style family, and brings the fundamentals along unless told not to', () => {
    expect(ids(filterExercises(all, { ...EVERYTHING, styles: ['jazz'] }))).toEqual(['major-scale', 'bebop-line', 'shells'])
    expect(ids(filterExercises(all, { ...EVERYTHING, styles: ['jazz'], fundamentals: false }))).toEqual(['bebop-line', 'shells'])
    expect(ids(filterExercises(all, { ...EVERYTHING, styles: ['jazz/bebop'], fundamentals: false }))).toEqual(['bebop-line'])
  })

  it('leaves an exercise without the label out of a facet that is being asked for', () => {
    expect(ids(filterExercises(all, { ...EVERYTHING, feels: ['swing-8'] }))).toEqual(['bebop-line'])
    expect(ids(filterExercises(all, { ...EVERYTHING, voicings: ['shell'] }))).toEqual(['shells'])
    expect(ids(filterExercises(all, { ...EVERYTHING, levels: [1, 3] }))).toEqual(['major-scale', 'bebop-line'])
  })

  it('searches titles, labels and text, every word required', () => {
    expect(ids(filterExercises(all, { ...EVERYTHING, text: 'BLUES' }))).toEqual(['blues-lick'])
    expect(ids(filterExercises(all, { ...EVERYTHING, text: 'bebop ii-v-i' }))).toEqual(['bebop-line'])
    expect(ids(filterExercises(all, { ...EVERYTHING, text: 'bebop bends' }))).toEqual([])
  })
})

describe('facetCounts', () => {
  it('counts what each option would show, its own facet set aside and the rest applied', () => {
    const counts = facetCounts(all, { ...EVERYTHING, contexts: ['12-bar-blues'], areas: ['lines'] })
    // Choosing another context still offers both: contexts are counted without the context choice.
    expect([...counts.contexts]).toEqual([['12-bar-blues', 1], ['major-ii-V-I', 1]])
    // But the area choice applies to contexts, so the chords exercise is not counted above.
    expect([...counts.areas]).toEqual([['lines', 1]])
  })

  it('counts a child style for its family as well, and offers nothing that finds nothing', () => {
    const counts = facetCounts(all, { ...EVERYTHING, fundamentals: false })
    expect(counts.styles.get('jazz')).toBe(2)
    expect(counts.styles.get('jazz/bebop')).toBe(1)
    expect(counts.styles.has('metal')).toBe(false)
    expect([...counts.levels.keys()]).toEqual([1, 2, 3])
  })
})

describe('style counts and the fundamentals', () => {
  it('says on each style how many rows choosing it shows, the fundamentals it brings along included', () => {
    for (const fundamentals of [true, false]) {
      const query = { ...EVERYTHING, fundamentals }
      for (const [style, count] of facetCounts(all, query).styles) {
        expect({ style, fundamentals, count }).toEqual({ style, fundamentals, count: filterExercises(all, { ...query, styles: [style] }).length })
      }
    }
  })
})

describe('exercisePosition', () => {
  const at = (...frets: number[]) => ({ notes: frets.map((fret) => ({ string: 3 as const, fret, beats: 1 })) })

  it('reads the place on the neck from the frets', () => {
    expect(exercisePosition(at(0, 1, 3))).toBe('open')
    expect(exercisePosition(at(2, 3, 5))).toBe('low')
    expect(exercisePosition(at(5, 7, 8))).toBe('mid')
    expect(exercisePosition(at(9, 10, 12))).toBe('high')
    expect(exercisePosition(at(3, 5, 10))).toBe('shifting')
    expect(exercisePosition(at(0, 0))).toBe('open')
  })

  it('reads every string of a chord', () => {
    const openC = { notes: [{ string: 5 as const, fret: 3, beats: 4, above: [{ string: 4 as const, fret: 2 }, { string: 1 as const, fret: 0 }] }] }
    expect(exercisePosition(openC)).toBe('open')
    const barre = { notes: [{ string: 6 as const, fret: 5, beats: 4, above: [{ string: 5 as const, fret: 7 }, { string: 4 as const, fret: 7 }] }] }
    expect(exercisePosition(barre)).toBe('mid')
  })
})

describe('toggleFacetValue and activeFilterCount', () => {
  it('switches a value on and off and counts what is on', () => {
    const on = toggleFacetValue(toggleFacetValue(EVERYTHING, 'styles', 'blues'), 'levels', 2)
    expect(on.styles).toEqual(['blues'])
    expect(activeFilterCount({ ...on, text: ' dorian ' })).toBe(3)
    expect(toggleFacetValue(on, 'styles', 'blues').styles).toEqual([])
    expect(activeFilterCount(EVERYTHING)).toBe(0)
  })
})
