import { isWord, normalize, score, tehranDate, type Game } from './engine'
import { read, write } from '../lib/storage'

// Small, original development fixture. Not a production Persian dictionary.
import starterAnswers from '../../data/starter-answers.json'
export const DEMO_WORDS: string[] = starterAnswers
const answer = 'باران'
export function openDemo(): Game {
  const date = tehranDate()
  const id = `demo-v1-${date}`
  const saved = read<Game | null>(id, null)
  if (saved && saved.id === id && Array.isArray(saved.attempts) && saved.attempts.length <= 6) {
    // Recompute from valid guesses instead of trusting cached feedback/outcomes.
    let game: Game = { id, label: date, kind: 'demo', date, attempts: [], status: 'playing' }
    for (const item of saved.attempts) {
      if (game.status !== 'playing' || !item || typeof item.guess !== 'string' || !isWord(item.guess)) break
      game = advance(game, item.guess)
    }
    return game
  }
  return { id, label: date, kind: 'demo', date, attempts: [], status: 'playing' }
}
function advance(game: Game, guess: string): Game {
  const attempts = [...game.attempts, { guess, marks: score(answer, guess) }]
  const status = guess === answer ? 'won' : attempts.length === 6 ? 'lost' : 'playing'
  return { ...game, attempts, status, ...(status !== 'playing' ? { answer } : {}) }
}
export async function submitDemo(game: Game, raw: string): Promise<Game> {
  if (game.status !== 'playing') throw new Error('این بازی تمام شده است.')
  const guess = normalize(raw)
  if (!isWord(guess)) throw new Error('واژه باید پنج حرف فارسی داشته باشد.')
  const { acceptsGuess } = await import('./dictionary')
  if (!acceptsGuess(guess)) throw new Error('این واژه در واژه‌نامه نیست.')
  const next = advance(game, guess)
  write(game.id, next)
  return next
}
