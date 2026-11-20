import { createClient } from '@supabase/supabase-js'
import type { Game } from '../game/engine'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
export const configured = !!(url && key)
export const supabase = configured ? createClient(url, key, {
  auth: { detectSessionInUrl: false, storageKey: `alpha-auth:${import.meta.env.BASE_URL}`, persistSession: true },
}) : null
export const adminSupabase = configured ? createClient(url, key, {
  auth: { detectSessionInUrl: false, storageKey: `alpha-admin:${import.meta.env.BASE_URL}`, persistSession: true },
}) : null

const errors: Record<string, string> = {
  not_admin: 'این حساب دسترسی مدیریت ندارد.', unavailable: 'بازی فعلاً آماده نیست. کمی بعد دوباره تلاش کنید.',
  invalid_word: 'این واژه در واژه‌نامه نیست.', invalid_length: 'واژه باید پنج حرف فارسی داشته باشد.',
  finished: 'این بازی تمام شده است.', stale_turn: 'وضعیت بازی تغییر کرده؛ بازی را دوباره بارگذاری کنید.',
  revoked: 'این پیوند دیگر برای شروع بازی فعال نیست.', conflict: 'این تاریخ قبلاً رزرو شده یا نسخه تغییر کرده است.',
  locked: 'واژهٔ منتشرشده قابل تغییر نیست.', no_words: 'واژهٔ مناسبی در مجموعهٔ تأییدشده باقی نمانده است.',
  rate_limit: 'کمی صبر کنید و دوباره تلاش کنید.', invalid_date: 'تاریخ باید امروز یا بعد از امروز باشد.',
  invalid_action: 'این درخواست معتبر نیست.', not_found: 'بازی پیدا نشد.',
  stale_round: 'این دور بازی تغییر کرده است. بازی را دوباره بارگذاری کنید.',
}
export async function rpc<T>(action: string, payload: Record<string, unknown> = {}, admin = false): Promise<T> {
  const client = admin ? adminSupabase : supabase
  if (!client) throw new Error('اتصال به سرور هنوز تنظیم نشده است.')
  const { data, error } = await client.rpc('wordle_api', { action, payload })
  if (error) throw new Error(errors[error.message] || 'ارتباط با سرور برقرار نشد. دوباره تلاش کنید.')
  return data as T
}
let signingIn: Promise<void> | undefined
export async function ensureGuest(): Promise<void> {
  if (!supabase) return
  if (!signingIn) signingIn = (async () => {
    const { data, error } = await supabase.auth.getSession()
    if (error) throw error
    if (!data.session) {
      const { error: signError } = await supabase.auth.signInAnonymously()
      if (signError) throw new Error('ورود مهمان ممکن نشد. دوباره تلاش کنید.')
    }
  })().finally(() => { signingIn = undefined })
  return signingIn
}
export async function openGame(token?: string): Promise<Game> {
  await ensureGuest()
  return rpc<Game>('open', token ? { token } : {})
}
export function guessGame(game: Game, guess: string, requestId: string): Promise<Game> {
  return rpc<Game>('guess', { puzzleId: game.id, guess, requestId, turn: game.attempts.length, round: game.round || 1 })
}
export function resetGame(game: Game): Promise<Game> {
  return rpc<Game>('reset', { puzzleId: game.id, round: game.round || 1 })
}
export type Puzzle = { id: string; answer: string; kind: string; date: string | null; status: string; revision: number; created_at: string }
export type AdminData = { puzzles: Puzzle[]; words: string[] }
