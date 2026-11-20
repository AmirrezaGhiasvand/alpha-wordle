import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { PGlite } from '@electric-sql/pglite'
import { readFile, readdir } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import { score } from '../src/game/engine'

const ADMIN = '00000000-0000-0000-0000-000000000001'
const A = '00000000-0000-0000-0000-000000000002'
const B = '00000000-0000-0000-0000-000000000003'
let db: PGlite
let today: string
type State = { id: string; answer: string | null; attempts: unknown[]; status: string; round?: number }
async function asUser(id: string, anonymous = id !== ADMIN) {
  await db.exec('reset role')
  await db.query("select set_config('request.jwt.claims',$1,false)", [JSON.stringify({ sub: id, is_anonymous: anonymous })])
  await db.exec('set role authenticated')
}
async function call<T = State>(action: string, payload = {}): Promise<T> {
  const r = await db.query<{ result: T }>('select public.wordle_api($1,$2::jsonb) result', [action, JSON.stringify(payload)])
  return r.rows[0].result
}
async function schedule(answer = 'باران') { await asUser(ADMIN); return call<{ id: string }>('admin_save', { answer, kind: 'daily', date: today, publish: true }) }
async function guess(game: State, word: string, turn = game.attempts.length, id = randomUUID()) {
  return call('guess', { puzzleId: game.id, guess: word, turn, requestId: id, round: game.round || 1 })
}

describe('database authorization and game transactions', () => {
  beforeAll(async () => {
    db = new PGlite()
    await db.exec(`create role anon; create role authenticated;
      create schema auth; create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql as $$ select (current_setting('request.jwt.claims',true)::jsonb->>'sub')::uuid $$;
      create function auth.jwt() returns jsonb language sql as $$ select current_setting('request.jwt.claims',true)::jsonb $$;
      insert into auth.users values ('${ADMIN}'),('${A}'),('${B}');`)
    const directory = new URL('../supabase/migrations/', import.meta.url)
    for (const file of (await readdir(directory)).filter(name => name.endsWith('.sql')).sort()) await db.exec(await readFile(new URL(file, directory), 'utf8'))
    await db.exec(await readFile(new URL('../supabase/seed-development.sql', import.meta.url), 'utf8'))
    const r = await db.query<{ date: string }>("select ((now() at time zone 'Asia/Tehran')::date)::text date")
    today = r.rows[0].date
  }, 30_000)
  beforeEach(async () => {
    await db.exec('reset role; truncate wordle_private.games, wordle_private.puzzles, wordle_private.audit, wordle_private.admins;')
    await db.query('insert into wordle_private.admins values ($1)', [ADMIN])
  })
  afterAll(async () => { await db?.close() })

  it('denies raw answer tables and every administrative action to ordinary players', async () => {
    await asUser(A)
    await expect(db.query('select * from wordle_private.puzzles')).rejects.toThrow(/permission denied/)
    for (const action of ['admin_list', 'admin_save', 'admin_random', 'admin_revoke', 'admin_retire']) await expect(call(action)).rejects.toThrow('not_admin')
    await db.exec('reset role; set role anon;')
    await expect(call('open')).rejects.toThrow(/permission denied/)
  })
  it('rejects anonymous sessions even if they were accidentally added as admins', async () => {
    await asUser(ADMIN, true)
    await expect(call('admin_list')).rejects.toThrow('not_admin')
  })
  it('gives separate players the same daily puzzle without exposing its answer', async () => {
    await schedule()
    await asUser(A); const first = await call('open')
    await asUser(B); await expect(guess(first, 'باران')).rejects.toThrow('not_found')
    const second = await call('open')
    expect(first.id).toBe(second.id); expect(first.answer).toBeNull(); expect(second.attempts).toEqual([])
  })
  it('keeps player attempts isolated and idempotent across retry', async () => {
    await schedule(); await asUser(A)
    const opened = await call('open'); const id = randomUUID()
    const next = await guess(opened, 'آرامش', 0, id)
    expect(next.attempts).toHaveLength(1); expect(next.answer).toBeNull()
    expect((await guess(opened, 'آرامش', 0, id)).attempts).toEqual(next.attempts)
    await expect(guess(opened, 'پرواز', 0)).rejects.toThrow('stale_turn')
    await asUser(B); const other = await call('open'); expect(other.attempts).toEqual([])
  })
  it('rejects invalid words without consuming an attempt and reveals answers only at completion', async () => {
    await schedule(); await asUser(A); let game = await call('open')
    await expect(guess(game, 'abcde')).rejects.toThrow('invalid_length')
    await expect(guess(game, 'ببببب')).rejects.toThrow('invalid_word')
    game = await call('open'); expect(game.attempts).toHaveLength(0)
    for (let i = 0; i < 5; i++) game = await guess(game, 'آرامش')
    expect(game.answer).toBeNull(); game = await guess(game, 'باران')
    expect(game.status).toBe('won'); expect(game.answer).toBe('باران'); expect(game.attempts).toHaveLength(6)
    await expect(guess(game, 'باران')).rejects.toThrow('finished')
  })
  it('ends a game after six incorrect guesses', async () => {
    await schedule(); await asUser(A); let game = await call('open')
    for (let i = 0; i < 6; i++) game = await guess(game, 'آرامش')
    expect(game.status).toBe('lost'); expect(game.answer).toBe('باران')
    await expect(guess(game, 'باران')).rejects.toThrow('finished')
  })
  it('restarts only the current player round and rejects delayed guesses from before reset', async () => {
    await schedule(); await asUser(A)
    const first = await call('open')
    await guess(first, 'آرامش')
    const fresh = await call('reset', { puzzleId: first.id, round: first.round })
    expect(fresh.id).toBe(first.id); expect(fresh.attempts).toEqual([])
    expect(fresh.status).toBe('playing'); expect(fresh.answer).toBeNull()
    expect(fresh.round).toBe(2)
    expect((await call('reset', { puzzleId: first.id, round: first.round })).round).toBe(2)
    await expect(guess(first, 'باران')).rejects.toThrow('stale_round')
    expect((await guess(fresh, 'باران')).status).toBe('won')
    await asUser(B); await expect(call('reset', { puzzleId: first.id, round: 1 })).rejects.toThrow('not_found')
    expect((await call('open')).attempts).toEqual([])
  })
  it('creates one fallback daily puzzle, locks its answer, and rejects date conflicts', async () => {
    await asUser(A); const first = await call('open')
    await asUser(B); const second = await call('open'); expect(first.id).toBe(second.id)
    await asUser(ADMIN)
    await expect(call('admin_save', { answer: 'آسمان', kind: 'daily', date: today, publish: true })).rejects.toThrow('conflict')
    await expect(call('admin_save', { id: first.id, revision: 1, answer: 'آسمان', kind: 'daily', date: today, publish: true })).rejects.toThrow('locked')
  })
  it('shares recording challenges, revokes new starts, and lets started games finish', async () => {
    await asUser(ADMIN)
    const link = await call<{ token: string; id: string }>('admin_save', { answer: 'باران', kind: 'recording', publish: true })
    expect(link.token).toMatch(/^[a-f0-9]{64}$/)
    const listing = await call('admin_list'); expect(JSON.stringify(listing)).not.toContain(link.token)
    await asUser(A); const game = await call('open', { token: link.token }); expect(game.id).toBe(link.id)
    await asUser(ADMIN); await call('admin_revoke', { id: link.id })
    await asUser(B); await expect(call('open', { token: link.token })).rejects.toThrow('revoked')
    await asUser(A); expect((await guess(game, 'باران')).status).toBe('won')
  })
  it('protects draft revisions and keeps drafts out of public access', async () => {
    await asUser(ADMIN)
    const draft = await call<{ id: string }>('admin_save', { answer: 'باران', kind: 'recording', publish: false })
    await expect(call('admin_save', { id: draft.id, revision: 7, answer: 'آسمان', kind: 'recording', publish: true })).rejects.toThrow('conflict')
    await asUser(A); await expect(guess({ id: draft.id, answer: null, attempts: [], status: 'playing' }, 'باران')).rejects.toThrow('not_found')
  })
  it('can retire a recording challenge to stop even started games', async () => {
    await asUser(ADMIN)
    const link = await call<{ token: string; id: string }>('admin_save', { answer: 'باران', kind: 'recording', publish: true })
    await asUser(A); const game = await call('open', { token: link.token })
    await asUser(ADMIN); await call('admin_retire', { id: link.id })
    await asUser(A); await expect(guess(game, 'باران')).rejects.toThrow('unavailable')
    await expect(call('open', { token: link.token })).rejects.toThrow('not_found')
  })
  it('matches TypeScript scoring and normalization in the actual PostgreSQL implementation', async () => {
    await db.exec('reset role')
    for (const [answer, guess] of [['باران','ااااا'],['باران','آرامش'],['باران','باران'],['آسمان','انسان']]) {
      const r = await db.query<{ marks: string[] }>('select wordle_private.score($1,$2) marks', [answer,guess])
      expect(r.rows[0].marks).toEqual(score(answer,guess))
    }
    const r = await db.query<{ word: string }>("select wordle_private.normalize_word('  كِتابيـ ') word")
    expect(r.rows[0].word).toBe('کتابی')
  })
})
