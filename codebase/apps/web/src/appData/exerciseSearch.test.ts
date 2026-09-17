import { describe, expect, it } from 'vitest'
import { EVERYTHING } from '../content'
import { queryOfSearch, searchOfQuery, validateExerciseSearch } from './exerciseSearch'

describe('the exercise list search', () => {
  it('is empty for everything, and reads an empty search as everything', () => {
    expect(searchOfQuery(EVERYTHING)).toEqual({})
    expect(queryOfSearch({})).toEqual(EVERYTHING)
  })

  it('round-trips a query through the URL', () => {
    const query = {
      ...EVERYTHING,
      text: 'dorian',
      styles: ['jazz/bebop', 'blues'] as const,
      fundamentals: false,
      levels: [1, 2],
      positions: ['mid'] as const,
    }
    expect(searchOfQuery(query)).toEqual({ q: 'dorian', style: 'jazz/bebop,blues', fund: '0', level: '1,2', pos: 'mid' })
    expect(queryOfSearch(searchOfQuery(query))).toEqual(query)
  })

  it('takes a single level the router has read as a number', () => {
    expect(queryOfSearch({ level: 2 }).levels).toEqual([2])
  })

  it('drops what the vocabularies do not know, and a fundamentals switch with no style to go with', () => {
    expect(validateExerciseSearch({ style: 'bagpipes,blues', area: 'standards', level: '0,2,x', fund: '0', junk: 'x' })).toEqual({
      style: 'blues', fund: '0', level: '2',
    })
    expect(validateExerciseSearch({ fund: '0' })).toEqual({})
  })
})
