import acceptedWords from '../../data/accepted-words.json'
import starterAnswers from '../../data/starter-answers.json'
const words = new Set([...acceptedWords, ...starterAnswers])
export function acceptsGuess(word: string): boolean { return words.has(word) }
