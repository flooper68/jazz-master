import { describe, expect, it } from 'vitest'
import { DIFFICULTIES, DIFFICULTY_LABELS, FEEL_LABELS, FEELS } from './run'
import { heardNothing, matchSpokenAnswer, SPOKEN_ANSWER_PHRASES } from './voiceAnswer'

describe('matchSpokenAnswer', () => {
  it('hears every answer said by its own name', () => {
    for (const difficulty of DIFFICULTIES) {
      expect(matchSpokenAnswer(DIFFICULTY_LABELS[difficulty]).difficulty).toBe(difficulty)
    }
    for (const feel of FEELS) {
      expect(matchSpokenAnswer(FEEL_LABELS[feel]).feel).toBe(feel)
    }
  })

  it('answers both questions from one sentence', () => {
    expect(matchSpokenAnswer('hard, but loved it')).toEqual({ difficulty: 'hard', feel: 'loved' })
    expect(matchSpokenAnswer('That was easy and honestly it dragged')).toEqual({ difficulty: 'easy', feel: 'dragged' })
  })

  it('leaves the question that was not answered alone', () => {
    expect(matchSpokenAnswer('good')).toEqual({ difficulty: 'good', feel: null })
    expect(matchSpokenAnswer('loved it')).toEqual({ difficulty: null, feel: 'loved' })
  })

  it('keeps the two vocabularies apart: good is how it went, fine is how it felt', () => {
    expect(matchSpokenAnswer('good')).toEqual({ difficulty: 'good', feel: null })
    expect(matchSpokenAnswer('fine')).toEqual({ difficulty: null, feel: 'fine' })
    // No phrase may answer both questions, or one sentence could never say two things.
    const difficultyWords = DIFFICULTIES.flatMap((d) => matchSpokenAnswer(DIFFICULTY_LABELS[d]))
    expect(difficultyWords.every((answer) => answer.feel === null)).toBe(true)
  })

  it('takes the answer that was said first', () => {
    expect(matchSpokenAnswer('again, no, hard').difficulty).toBe('again')
    expect(matchSpokenAnswer('hard, no, again').difficulty).toBe('hard')
  })

  it('hears it however it is said: case, punctuation and filler', () => {
    expect(matchSpokenAnswer('  EASY!!  ').difficulty).toBe('easy')
    expect(matchSpokenAnswer('uh, it went... good?').difficulty).toBe('good')
    expect(matchSpokenAnswer('I think that one fell apart').difficulty).toBe('again')
  })

  it('does not hear an answer inside a longer word', () => {
    expect(matchSpokenAnswer('goodness').difficulty).toBeNull()
    expect(matchSpokenAnswer('define').feel).toBeNull()
    expect(matchSpokenAnswer('hardly anything').difficulty).toBeNull()
  })

  it('says when nothing was an answer', () => {
    expect(heardNothing(matchSpokenAnswer('what time is it'))).toBe(true)
    expect(heardNothing(matchSpokenAnswer(''))).toBe(true)
    expect(heardNothing(matchSpokenAnswer('good'))).toBe(false)
  })

  it('offers every phrase it knows to the recogniser, so none is a guess', () => {
    for (const label of [...DIFFICULTIES.map((d) => DIFFICULTY_LABELS[d]), ...FEELS.map((f) => FEEL_LABELS[f])]) {
      expect(SPOKEN_ANSWER_PHRASES).toContain(label.toLowerCase())
    }
  })
})
