export type Mark = 'correct' | 'present' | 'absent'
export type Attempt = { guess: string; marks: Mark[] }
export type Game = {
  id: string; label: string; kind: 'daily' | 'recording' | 'demo';
  attempts: Attempt[]; status: 'playing' | 'won' | 'lost'; answer?: string;
  date?: string; serverTime?: string; nextRollover?: string
}
export const ALPHABET = 'آابپتثجچحخدذرزژسشصضطظعغفقکگلمنوهی'
export function normalize(value: string): string {
  return value.normalize('NFC').replace(/ي/g, 'ی').replace(/ك/g, 'ک')
    .replace(/[\u064B-\u0652\u0670\u0640]/g, '').trim()
}
export function isWord(value: string): boolean {
  const letters = [...normalize(value)]
  return letters.length === 5 && letters.every(letter => ALPHABET.includes(letter))
}
export function score(answer: string, guess: string): Mark[] {
  const remaining = new Map<string, number>()
  const marks: Mark[] = [...guess].map((letter, index) => {
    if (letter === answer[index]) return 'correct'
    remaining.set(answer[index], (remaining.get(answer[index]) || 0) + 1)
    return 'absent'
  })
  for (let i = 0; i < guess.length; i++) {
    if (marks[i] === 'correct') continue
    if ((remaining.get(guess[i]) || 0) > 0) {
      marks[i] = 'present'
      remaining.set(guess[i], remaining.get(guess[i])! - 1)
    }
  }
  return marks
}
export function keyMarks(attempts: Attempt[]): Record<string, Mark> {
  const result: Record<string, Mark> = {}
  const rank = { absent: 0, present: 1, correct: 2 }
  attempts.forEach(({ guess, marks }) => [...guess].forEach((letter, i) => {
    if (!result[letter] || rank[marks[i]] > rank[result[letter]]) result[letter] = marks[i]
  }))
  return result
}
export function tehranDate(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tehran', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
}
export const fa = (value: number | string) => String(value).replace(/\d/g, digit => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)])
export function shareText(game: Game, url: string): string {
  const boxes = { correct: '🟩', present: '🟨', absent: '⬜' }
  // Keep logical Persian order while explicitly marking the grid RTL in text.
  return `واژه آلفا · ${game.label}\n${game.status === 'won' ? fa(game.attempts.length) : '×'}/۶\n\n${game.attempts.map(a => '\u200f' + a.marks.map(m => boxes[m]).join('')).join('\n')}\n\n${url}`
}
