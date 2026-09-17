import { describe, expect, it } from 'vitest'
import { isRating } from './run'

describe('isRating', () => {
  it('takes whole numbers from 1 to 10, except 7', () => {
    expect([1, 2, 3, 4, 5, 6, 8, 9, 10].every(isRating)).toBe(true)
    expect([0, 7, 11, 2.5, Number.NaN, '5', null].some(isRating)).toBe(false)
  })
})
