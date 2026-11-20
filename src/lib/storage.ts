const namespace = `alpha-wordle:v1:${import.meta.env.BASE_URL}:`
export function read<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(namespace + key) || 'null') ?? fallback }
  catch { return fallback }
}
export function write(key: string, value: unknown): void {
  try { localStorage.setItem(namespace + key, JSON.stringify(value)) } catch { /* Play remains available with storage disabled. */ }
}
export type Result = { id: string; date?: string; won: boolean; attempts: number; kind: string }
export function results(): Result[] {
  const saved = read<unknown>('results', [])
  return Array.isArray(saved) ? saved.filter((r): r is Result => !!r && typeof r.id === 'string' && typeof r.won === 'boolean' && Number.isInteger(r.attempts) && r.attempts >= 1 && r.attempts <= 6) : []
}
export function recordResult(result: Result) {
  const previous = results()
  if (!previous.some(r => r.id === result.id)) write('results', [...previous, result])
}
