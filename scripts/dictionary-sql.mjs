import { readFile, mkdir, writeFile } from 'node:fs/promises'

const words = JSON.parse(await readFile(new URL('../data/accepted-words.json', import.meta.url), 'utf8'))
const alphabet = /^[آابپتثجچحخدذرزژسشصضطظعغفقکگلمنوهی]{5}$/u
if (!Array.isArray(words) || !words.every(word => typeof word === 'string' && alphabet.test(word))) throw new Error('Dictionary contains invalid entries')
const statements = []
for (let i = 0; i < words.length; i += 1000) {
  statements.push('insert into wordle_private.words(word,eligible) values\n' + words.slice(i,i+1000).map(word => `('${word}',false)`).join(',\n') + '\non conflict do nothing;')
}
await mkdir(new URL('../.local/', import.meta.url), { recursive: true })
await writeFile(new URL('../.local/accepted-guesses.sql', import.meta.url), '-- Hazm-derived accepted guesses. See data/HAZM-LICENSE.txt and data/dictionary-source.json.\n-- Does not approve any answer candidates.\nbegin;\n' + statements.join('\n') + '\ncommit;\n')
console.log(`Generated .local/accepted-guesses.sql with ${words.length} accepted guesses; no new eligible answers.`)
