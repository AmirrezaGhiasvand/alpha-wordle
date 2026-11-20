import { useCallback, useEffect, useRef, useState } from 'react'
import { BarChart3, CircleHelp, Settings2, Delete, Check, Share2, RotateCw, Sun, Moon } from 'lucide-react'
import { fa, ALPHABET, keyMarks, normalize, shareText, tehranDate, type Game, type Mark } from './game/engine'
import { openDemo, submitDemo, resetDemo, DEMO_WORDS } from './game/demo'
import { configured, guessGame, openGame, resetGame } from './lib/api'
import { read, recordResult, write } from './lib/storage'
import Modal from './components/Modal'
import Statistics from './components/Statistics'
import Admin from './features/admin/Admin'

const keyboard = ['ض ص ث ق ف غ ع ه خ ح ج چ', 'ش س ی ب ل ا ت ن م ک گ', 'ظ ط ز ر ذ د پ و ژ آ'].map(row => row.split(' '))
const meanings: Record<Mark, string> = { correct: 'حرف درست، جای درست', present: 'حرف درست، جای دیگر', absent: 'در واژه نیست' }
type Preferences = { contrast: boolean; dark: boolean }
type View = 'help' | 'stats' | 'settings' | 'reset' | null

function route() { return window.location.hash || '#/play' }
export default function App() {
  const [path, setPath] = useState(route)
  const [game, setGame] = useState<Game | null>(null)
  const [letters, setLetters] = useState('')
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [view, setView] = useState<View>(null)
  const [shake, setShake] = useState(0)
  const [today, setToday] = useState(tehranDate())
  const [prefs, setPrefs] = useState<Preferences>(() => {
    const saved = read<Partial<Preferences>>('preferences-v2', {})
    return { contrast: saved.contrast === true, dark: saved.dark === true }
  })
  const request = useRef<{ guess: string; id: string; turn: number } | null>(null)
  const inFlight = useRef(false)
  const loadId = useRef(0)
  const serverOffset = useRef(0)
  const token = path.startsWith('#/p/') ? path.slice(5) : undefined
  const admin = path.startsWith('#/admin')

  useEffect(() => {
    const onHash = () => setPath(route())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])
  useEffect(() => {
    document.documentElement.dataset.theme = prefs.dark ? 'dark' : 'light'
    document.documentElement.dataset.contrast = prefs.contrast ? 'high' : 'normal'
    write('preferences-v2', prefs)
  }, [prefs])
  useEffect(() => {
    const refresh = () => setToday(tehranDate(new Date(Date.now() + serverOffset.current)))
    const timer = window.setInterval(refresh, 30_000)
    window.addEventListener('focus', refresh)
    return () => { clearInterval(timer); window.removeEventListener('focus', refresh) }
  }, [])
  const load = useCallback(async () => {
    const generation = ++loadId.current
    setLoading(true); setError(''); setGame(null); setLetters(''); request.current = null
    try {
      if (token && !configured) throw new Error('برای باز کردن چالش، اتصال به سرور باید تنظیم شود.')
      const next = configured ? await openGame(token) : openDemo()
      if (generation !== loadId.current) return
      if (next.serverTime) {
        serverOffset.current = Date.parse(next.serverTime) - Date.now()
        setToday(tehranDate(new Date(next.serverTime)))
      }
      setGame(next)
    } catch (e) { if (generation === loadId.current) setError(e instanceof Error ? e.message : 'بازی بارگذاری نشد.') }
    finally { if (generation === loadId.current) setLoading(false) }
  }, [token])
  useEffect(() => { if (!admin) void load(); return () => { loadId.current++ } }, [admin, load])
  // Switch routes safely: do not reuse a recording game's outcome in another view.
  useEffect(() => { setView(null) }, [path])
  useEffect(() => {
    if (!game || game.status === 'playing' || admin) return
    recordResult({ id: game.id, date: game.date, won: game.status === 'won', attempts: game.attempts.length, kind: game.kind })
    const timer = window.setTimeout(() => setView('stats'), 850)
    return () => clearTimeout(timer)
  }, [game, admin])
  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(''), 3500)
    return () => clearTimeout(timer)
  }, [notice])

  const submit = useCallback(async () => {
    if (!game || inFlight.current || game.status !== 'playing') return
    if (letters.length !== 5) { setNotice('پنج حرف وارد کن.'); setShake(n => n + 1); return }
    inFlight.current = true; setBusy(true)
    const generation = loadId.current
    const guess = normalize(letters)
    if (!request.current || request.current.guess !== guess || request.current.turn !== game.attempts.length) {
      request.current = { guess, id: crypto.randomUUID(), turn: game.attempts.length }
    }
    try {
      const next = configured ? await guessGame(game, guess, request.current.id) : await submitDemo(game, guess)
      if (generation !== loadId.current) return
      setGame(next); setLetters(''); request.current = null
    } catch (e) { if (generation === loadId.current) { setNotice(e instanceof Error ? e.message : 'دوباره تلاش کن.'); setShake(n => n + 1) } }
    finally { inFlight.current = false; setBusy(false) }
  }, [game, letters])
  const input = useCallback((key: string) => {
    if (loading || busy || !game || game.status !== 'playing' || view || admin) return
    if (key === 'Enter') { void submit(); return }
    if (key === 'Backspace') { setLetters(value => value.slice(0, -1)); return }
    const letter = normalize(key)
    if ([...letter].length === 1 && ALPHABET.includes(letter)) setLetters(value => value.length < 5 ? value + letter : value)
  }, [loading, busy, game, view, admin, submit])
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement
      if (event.ctrlKey || event.metaKey || event.altKey || event.isComposing || target.closest('input,textarea,select,dialog,a,button')) return
      if (['Enter', 'Backspace'].includes(event.key) || ALPHABET.includes(normalize(event.key))) { event.preventDefault(); input(event.key) }
    }
    const onPaste = (event: ClipboardEvent) => {
      if (view || admin || busy || game?.status !== 'playing' || (event.target as HTMLElement).closest('input,textarea')) return
      const value = normalize(event.clipboardData?.getData('text') || '')
      event.preventDefault()
      if ([...value].every(l => ALPHABET.includes(l)) && value.length <= 5) setLetters(value)
      else setNotice('فقط حروف فارسی، بدون فاصله، وارد کن.')
    }
    window.addEventListener('keydown', onKey); window.addEventListener('paste', onPaste)
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('paste', onPaste) }
  }, [input, view, admin, busy, game])

  async function share() {
    if (!game || game.status === 'playing') return
    const text = shareText(game, `${location.origin}${location.pathname}${token ? `#/p/${token}` : '#/play'}`)
    try { await navigator.clipboard.writeText(text); setNotice('نتیجه کپی شد.') }
    catch { setNotice('کپی خودکار ممکن نشد؛ متن نتیجه را انتخاب و کپی کن.'); setView('stats') }
  }
  async function restart() {
    if (!game || inFlight.current) return
    inFlight.current = true; setBusy(true)
    const generation = loadId.current
    try {
      const next = configured ? await resetGame(game) : resetDemo(game)
      if (generation !== loadId.current) return
      setGame(next); setLetters(''); setShake(0); request.current = null; setView(null)
      setNotice('بازی از اول شروع شد.')
    } catch (e) { setNotice(e instanceof Error ? e.message : 'شروع دوباره انجام نشد.') }
    finally { inFlight.current = false; setBusy(false) }
  }
  const marks = keyMarks(game?.attempts || [])
  const dateLabel = new Intl.DateTimeFormat('fa-IR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Tehran' }).format(game?.date ? new Date(`${game.date}T12:00:00+03:30`) : new Date(Date.now() + serverOffset.current))
  const oldPuzzle = game?.date && game.date !== today && game.kind !== 'recording'
  const base = import.meta.env.BASE_URL
  return <div className={`app ${admin ? 'admin-app' : 'game-app'}`}>
    <header className="site-header">
      <div className="header-inner">
        <a href="#/play" className="identity" aria-label="مدرسهٔ آلفا، صفحهٔ بازی"><img src={`${base}alpha-mark.svg`} width="111" height="40" alt="مدرسهٔ آلفا" /></a>
        <nav className="header-actions" aria-label="ابزارهای بازی">
          {!admin && <button className="icon-button reset-button" onClick={() => setView('reset')} disabled={loading || busy || !game} aria-label="شروع دوباره" title="شروع دوباره"><RotateCw size={20} /></button>}
          <button className="icon-button theme-toggle" onClick={() => setPrefs(p => ({ ...p, dark: !p.dark }))} aria-label="تغییر پوسته" aria-pressed={prefs.dark} title={prefs.dark ? 'پوستهٔ روشن' : 'پوستهٔ تیره'}>{prefs.dark ? <Sun size={21} /> : <Moon size={21} />}</button>
          <button className="icon-button" onClick={() => setView('help')} aria-label="راهنمای بازی" title="راهنما"><CircleHelp size={23} /></button>
          <button className="icon-button" onClick={() => setView('stats')} aria-label="آمار بازی" title="آمار"><BarChart3 size={23} /></button>
          <button className="icon-button" onClick={() => setView('settings')} aria-label="تنظیمات بازی" title="تنظیمات"><Settings2 size={23} /></button>
        </nav>
      </div>
    </header>

    {admin ? <Admin /> : <main className="game-main">
      <section className="puzzle-heading" aria-label="اطلاعات بازی">
        <div className="puzzle-meta"><span className="eyebrow">{token ? 'چالش دوستانه' : 'واژهٔ امروز'}</span><span className="puzzle-date">{dateLabel}</span></div>
        <h1>پنج حرف، شش فرصت.</h1>
      </section>

      {oldPuzzle && <div className="rollover-note">این بازی مربوط به روز قبل است.<button className="text-button" onClick={() => void load()}>بازی امروز</button></div>}

      {error ? <div className="empty-state" role="alert"><h2>بازی آماده نشد</h2><p>{error}</p><button className="primary" onClick={() => void load()}><RotateCw size={17} />تلاش دوباره</button></div> : <>
        <section className="game-stage" aria-label="بازی واژه">
        <div className="board-frame">
        <div key={`${game?.id}-${game?.round || 1}`} className={`board ${loading ? 'is-loading' : ''}`} role="group" aria-label="جدول بازی، شش ردیف و پنج ستون" aria-busy={loading || busy}>
          {Array.from({ length: 6 }, (_, row) => {
            const attempt = game?.attempts[row]
            const active = !!game && row === game.attempts.length && game.status === 'playing'
            const text = attempt?.guess || (active ? letters : '')
            return <div key={`${row}-${active ? shake : 'done'}`} className={`board-row ${active && shake ? 'shake' : ''}`} aria-label={`ردیف ${fa(row + 1)}`}>
              {Array.from({ length: 5 }, (_, col) => {
                const mark = attempt?.marks[col]
                return <div key={col} className={`tile ${mark || ''} ${!mark && text[col] ? 'filled' : ''} ${active ? 'active' : ''}`} style={{ '--reveal-delay': `${col * 90}ms` } as React.CSSProperties}
                  aria-label={`${text[col] || 'خالی'}${mark ? `، ${meanings[mark]}` : ''}`}><span>{text[col]}</span></div>
              })}
            </div>
          })}
        </div>
        </div>
        <div className="board-status">
          <div className="board-caption" aria-live="polite">{loading ? 'در حال آماده‌سازی بازی…' : busy ? 'در حال بررسی…' : game?.status === 'won' ? 'آفرین! واژه را پیدا کردی.' : game?.status === 'lost' ? `واژهٔ امروز: ${game.answer}` : `${fa(game?.attempts.length || 0)} از ۶ تلاش`}</div>
          {game && game.status !== 'playing' ? <div className="finished-actions"><button className="text-button" onClick={() => void restart()} disabled={busy}>بازی دوباره</button><button className="icon-button" onClick={() => setView('stats')} aria-label="دیدن نتیجه"><BarChart3 size={16} /></button><button className="icon-button" onClick={() => void share()} aria-label="اشتراک‌گذاری نتیجه"><Share2 size={16} /></button></div> : null}
        </div>
        </section>
        <section className="game-controls" aria-label="کنترل‌های بازی">
        <div className="keyboard" role="group" aria-label="صفحه‌کلید فارسی" dir="rtl">
          {keyboard.map((row, i) => <div className="keyboard-row" key={i}>
            {i === 2 && <button className="key key-action enter" onClick={() => { input('Enter'); (document.activeElement as HTMLElement)?.blur() }} disabled={loading || busy || game?.status !== 'playing'} aria-label="ثبت حدس"><Check size={20} /><span>ثبت</span></button>}
            {row.map(letter => <button key={letter} className={`key ${marks[letter] || ''}`} aria-label={`${letter}${marks[letter] ? `، ${meanings[marks[letter]]}` : ''}`} disabled={loading || busy || game?.status !== 'playing'} onClick={() => { input(letter); (document.activeElement as HTMLElement)?.blur() }}>{letter}</button>)}
            {i === 2 && <button className="key key-action" onClick={() => { input('Backspace'); (document.activeElement as HTMLElement)?.blur() }} disabled={loading || busy || game?.status !== 'playing'} aria-label="پاک کردن حرف"><Delete size={20} /></button>}
          </div>)}
        </div>
        <div className="keyboard-footer"><div className="legend" aria-label="معنی رنگ‌ها"><span><i className="correct" />جای درست</span><span><i className="present" />جای دیگر</span><span><i className="absent" />در واژه نیست</span></div><button className="text-button" onClick={() => setView('help')}>راهنما</button></div>
        </section>
      </>}
    </main>}

    <footer className="site-footer"><a className="school-signature" href="https://alphaschool.ir/" target="_blank" rel="noreferrer">مدرسهٔ <b>آلفا</b></a>{!configured ? <span className="demo-label" title="واژهٔ ثابت برای بررسی رابط؛ سرور هنوز متصل نیست">نسخهٔ آزمایشی</span> : <span className="footer-caption">هر روز، یک واژهٔ تازه</span>}{!admin && <a className="admin-link" href="#/admin">مدیریت</a>}{admin && <a className="admin-link" href="#/play">بازگشت به بازی</a>}</footer>
    <div className={`toast ${notice ? 'visible' : ''}`} role="status" aria-live="polite">{notice}</div>

    {view === 'help' && <Modal title="چطور بازی کنیم؟" close={() => setView(null)}>
      <p className="dialog-intro">یک واژهٔ پنج‌حرفی را در شش تلاش پیدا کن. بعد از هر حدس، رنگ هر خانه راهنمای توست.</p>
      <div className="example-row" aria-label="نمونهٔ رنگ‌ها">{[...'پرواز'].map((l, i) => <span className={`tile ${i === 0 ? 'correct' : i === 2 ? 'present' : i === 4 ? 'absent' : ''}`} key={i}>{l}</span>)}</div>
      <ul className="help-list"><li><i className="correct" /><div><strong>سبز: درست و سر جای خودش</strong><p>این حرف دقیقاً در همین جای واژه است.</p></div></li><li><i className="present" /><div><strong>زرد: درست، در جای دیگر</strong><p>حرف در واژه هست، اما جای آن فرق می‌کند.</p></div></li><li><i className="absent" /><div><strong>خاکستری: در واژه نیست</strong><p>تعداد تکرار یک حرف هم مهم است.</p></div></li></ul>
      <p className="muted">از صفحه‌کلید فارسی یا دکمه‌های پایین جدول استفاده کن. واژهٔ روز برای همه یکسان است و نیمه‌شب به وقت تهران عوض می‌شود.</p>
      {!configured && <details className="demo-words"><summary>چند واژه برای امتحان نسخهٔ آزمایشی</summary><p>{DEMO_WORDS.slice(0, 18).join('، ')}</p><p className="small">این نمونه برای بررسی رابط است؛ واژهٔ آن روزانه عوض نمی‌شود.</p></details>}
      <button className="primary full" onClick={() => setView(null)}>شروع کنیم</button>
    </Modal>}
    {view === 'stats' && <Modal title={game?.status !== 'playing' && game ? 'نتیجهٔ بازی' : 'آمار بازی‌ها'} close={() => setView(null)}><Statistics game={game} onShare={() => void share()} />{game && game.status !== 'playing' && <><button className="secondary full replay-button" disabled={busy} onClick={() => void restart()}><RotateCw size={17} />بازی دوباره</button><textarea className="share-fallback" aria-label="متن نتیجه برای کپی" readOnly value={shareText(game, `${location.origin}${location.pathname}${token ? `#/p/${token}` : '#/play'}`)} /></>}</Modal>}
    {view === 'reset' && <Modal title="از اول شروع کنیم؟" close={() => { if (!busy) setView(null) }}><p className="dialog-intro">حدس‌های این دور پاک می‌شوند و همین واژه را دوباره بازی می‌کنی. نتیجه‌ای که قبلاً در آمار ثبت شده، تغییر نمی‌کند.</p><div className="reset-actions"><button className="primary" onClick={() => void restart()} disabled={busy}><RotateCw size={17} />شروع دوباره</button><button className="secondary" onClick={() => setView(null)} disabled={busy}>ادامهٔ بازی</button></div></Modal>}
    {view === 'settings' && <Modal title="تنظیمات" close={() => setView(null)}>
      <div className="setting-row"><div><strong>کنتراست بیشتر</strong><p>رنگ‌های متمایزتر برای خانه‌ها</p></div><input type="checkbox" role="switch" aria-label="کنتراست بیشتر" checked={prefs.contrast} onChange={e => setPrefs(p => ({ ...p, contrast: e.target.checked }))} /></div>
      <div className="setting-row"><div><strong>پوستهٔ تیره</strong><p>پوستهٔ روشن یا تیره را انتخاب کن</p></div><button className="icon-button" aria-label="تغییر پوسته در تنظیمات" aria-pressed={prefs.dark} onClick={() => setPrefs(p => ({ ...p, dark: !p.dark }))}>{prefs.dark ? <Moon size={22} /> : <Sun size={22} />}</button></div>
      <p className="muted small">تنظیمات فقط روی همین مرورگر ذخیره می‌شوند.</p>
    </Modal>}
  </div>
}
