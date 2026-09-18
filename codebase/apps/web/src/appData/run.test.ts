import { describe, expect, it } from 'vitest'
import { DIFFICULTIES, isDifficulty } from './run'

describe('isDifficulty', () => {
  it('takes the four answers and nothing else', () => {
    expect(DIFFICULTIES.every(isDifficulty)).toBe(true)
    expect(['', 'ok', 'fine', '7', 7, null, undefined].some(isDifficulty)).toBe(false)
  })

  it('runs hardest first, so a tie between answers falls to the harder one', () => {
    expect([...DIFFICULTIES]).toEqual(['again', 'hard', 'good', 'easy'])
  })
})
