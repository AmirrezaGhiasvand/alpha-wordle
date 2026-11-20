import { describe, expect, it } from 'vitest'
import { isWord, keyMarks, normalize, score, shareText, tehranDate } from '../src/game/engine'
import { DEMO_WORDS } from '../src/game/demo'

describe('Persian text and scoring', () => {
  it('normalizes keyboard variants and removes vowel marks without conflating آ and ا', () => {
    expect(normalize('  كِتابيـ ')).toBe('کتابی')
    expect(normalize('آسمان')).toBe('آسمان')
    expect(isWord('آسمان')).toBe(true)
  })
  it.each(['بار ان', 'بار‌ان', 'hello', '۱۲۳۴۵', 'باران!', 'بارا', 'باراa', 'بارأ ن', 'بارانن'])('rejects unsupported guess %s', word => expect(isWord(word)).toBe(false))
  it('awards exact matches before allocating duplicate letters', () => {
    expect(score('باران', 'آرامش')).toEqual(['absent', 'present', 'present', 'absent', 'absent'])
    expect(score('باران', 'ااااا')).toEqual(['absent', 'correct', 'absent', 'correct', 'absent'])
    expect(score('باران', 'باران')).toEqual(Array(5).fill('correct'))
  })
  it('never downgrades a known correct keyboard letter', () => {
    expect(keyMarks([{ guess: 'باران', marks: score('باران', 'باران') }, { guess: 'آرامش', marks: score('باران', 'آرامش') }]).ا).toBe('correct')
  })
  it('selects one Tehran date regardless of the viewer timezone', () => {
    expect(tehranDate(new Date('2026-11-20T20:29:59Z'))).toBe('2026-11-20')
    expect(tehranDate(new Date('2026-11-20T20:30:00Z'))).toBe('2026-11-21')
  })
  it('never includes guesses or the answer in share text', () => {
    const text = shareText({ id: 'test', label: 'test', kind: 'daily', attempts: [{ guess: 'باران', marks: score('باران', 'باران') }], status: 'won', answer: 'باران' }, 'https://example.com/#/play')
    expect(text).not.toContain('باران')
    expect(text).toContain('🟩🟩🟩🟩🟩')
  })
  it('keeps development fixtures unique, normalized, and exactly five letters', () => {
    expect(new Set(DEMO_WORDS).size).toBe(DEMO_WORDS.length)
    for (const word of DEMO_WORDS) { expect(normalize(word)).toBe(word); expect(isWord(word), word).toBe(true) }
  })
})
