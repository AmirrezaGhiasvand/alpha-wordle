import { useState } from 'react'
import { Check, Copy, Users } from 'lucide-react'
import type { FriendRoom } from '../lib/api'
import { isWord, normalize } from '../game/engine'
import { friendUrl } from '../lib/routes'

export default function FriendLobby({ room, token, busy, choose }: { room: FriendRoom; token: string; busy: boolean; choose: (word: string) => Promise<void> }) {
  const [word, setWord] = useState('')
  const [copied, setCopied] = useState(false)
  const url = friendUrl(token)
  async function copy() {
    try { await navigator.clipboard.writeText(url); setCopied(true) } catch { setCopied(false) }
  }
  return <section className="friend-lobby" aria-label="آماده‌سازی بازی دونفره">
    <div className="friend-emblem"><Users size={27} /></div>
    <h1>یک واژه برای دوستت انتخاب کن</h1>
    <p className="muted">هر کدام یک واژهٔ پنج‌حرفی برای دیگری انتخاب می‌کنید. هر دو که آماده شدید، بازی شروع می‌شود.</p>
    <div className="invite-field"><input aria-label="پیوند دعوت" readOnly dir="ltr" value={url} onFocus={e => e.target.select()} /><button className="secondary" onClick={() => void copy()}><Copy size={16} />{copied ? 'کپی شد' : 'کپی پیوند'}</button></div>
    <div className="friend-seats"><span><i className={room.chosen ? 'ready-dot' : ''} />تو: {room.chosen ? 'آماده' : 'انتخاب واژه'}</span><span><i className={room.opponentReady ? 'ready-dot' : ''} />دوستت: {room.opponentReady ? 'آماده' : room.opponentJoined ? 'انتخاب واژه' : 'منتظر ورود'}</span></div>
    {room.chosen ? <p className="chosen-word"><Check size={18} />واژهٔ تو برای دوستت: <strong>{room.chosen}</strong><span className="muted">منتظر آماده‌شدن دوستت…</span></p> : <form onSubmit={e => { e.preventDefault(); if (isWord(word) && !busy) void choose(normalize(word)) }}>
      <label htmlFor="friend-word">واژهٔ مخفی برای دوستت</label>
      <div className="friend-word-entry"><input id="friend-word" autoComplete="off" spellCheck={false} value={word} onChange={e => setWord(e.target.value)} placeholder="مثلاً باران" /><button className="primary" disabled={busy || !isWord(word)}>{busy ? 'در حال ثبت…' : 'قفل کردن واژه'}</button></div>
      <p className="muted small">پس از ثبت، واژه عوض نمی‌شود.</p>
    </form>}
    <p className="muted small">اعتبار اتاق: ۷ روز. با همین پیوند و همین مرورگر ادامه بده.</p>
    <a className="text-button" href="#/play">بازگشت به واژهٔ روز</a>
  </section>
}
