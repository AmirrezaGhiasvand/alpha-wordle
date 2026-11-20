import { expect, it } from 'vitest'
import words from '../data/accepted-words.json'
import { acceptsGuess } from '../src/game/dictionary'
import { isWord, normalize } from '../src/game/engine'

it('imports only unique normalized five-letter guesses and accepts words beyond the answer fixtures', () => {
  expect(words.length).toBeGreaterThan(40_000)
  expect(new Set(words).size).toBe(words.length)
  expect(words.every(word => isWord(word) && normalize(word) === word)).toBe(true)
  expect(acceptsGuess('آشپزی')).toBe(true)
  expect(acceptsGuess('ببببب')).toBe(false)
})
