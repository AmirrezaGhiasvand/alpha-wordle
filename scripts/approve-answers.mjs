import { readFile, mkdir, writeFile } from 'node:fs/promises'
const words = (await readFile(new URL('../data/launch-answers.txt', import.meta.url), 'utf8')).trim().split(/\s+/)
const dictionary = new Set(JSON.parse(await readFile(new URL('../data/accepted-words.json', import.meta.url), 'utf8')))
if (new Set(words).size !== words.length || words.some(word => !/^[آابپتثجچحخدذرزژسشصضطظعغفقکگلمنوهی]{5}$/u.test(word) || !dictionary.has(word))) throw new Error('Invalid launch answer pool')
if (words.length <= 180) throw new Error('Answer pool must exceed the 180-day non-repeat window')
await mkdir(new URL('../.local/', import.meta.url), {recursive:true})
await writeFile(new URL('../.local/approve-launch-answers.sql', import.meta.url), 'update wordle_private.words set eligible=true where dictionary_version=1 and word in (' + words.map(word => `'${word}'`).join(',') + ');\n')
console.log(`Generated .local/approve-launch-answers.sql for ${words.length} eligible answers.`)
