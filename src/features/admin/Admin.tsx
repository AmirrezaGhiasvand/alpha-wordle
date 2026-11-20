import { useEffect, useState, type FormEvent } from 'react'
import { CalendarDays, Clapperboard, Copy, LogOut, Shuffle, Save, Check, RotateCw } from 'lucide-react'
import { adminSupabase, configured, rpc, type AdminData, type Puzzle } from '../../lib/api'
import { fa, isWord, normalize, tehranDate } from '../../game/engine'

const statusName: Record<string, string> = { draft: 'پیش‌نویس', scheduled: 'زمان‌بندی‌شده', published: 'منتشرشده', retired: 'بسته‌شده', revoked: 'پیوند لغوشده' }
export default function Admin() {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [sent, setSent] = useState(false)
  const [authenticated, setAuthenticated] = useState(false)
  const [data, setData] = useState<AdminData | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [answer, setAnswer] = useState('')
  const [kind, setKind] = useState<'daily' | 'recording'>('daily')
  const [date, setDate] = useState(tehranDate())
  const [editing, setEditing] = useState<Puzzle | null>(null)
  const [link, setLink] = useState('')
  async function refresh() { setData(await rpc<AdminData>('admin_list', {}, true)) }
  async function task(fn: () => Promise<void>) {
    setBusy(true); setMessage('')
    try { await fn() } catch (e) { setMessage(e instanceof Error ? e.message : 'درخواست انجام نشد.') }
    finally { setBusy(false) }
  }
  useEffect(() => {
    if (!adminSupabase) return
    void adminSupabase.auth.getSession().then(({ data: session }) => setAuthenticated(!!session.session && !session.session.user.is_anonymous))
    const { data: listener } = adminSupabase.auth.onAuthStateChange((_event, session) => setAuthenticated(!!session && !session.user.is_anonymous))
    return () => listener.subscription.unsubscribe()
  }, [])
  useEffect(() => { if (authenticated) void task(refresh); else setData(null) }, [authenticated])

  async function login(e: FormEvent) {
    e.preventDefault()
    await task(async () => {
      if (!adminSupabase) return
      if (!sent) {
        const { error } = await adminSupabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } })
        if (error) throw new Error('ارسال کد ممکن نشد. ایمیل یا تنظیمات ورود را بررسی کنید.')
        setSent(true); setMessage('کد ورود را از ایمیل خود وارد کنید.')
      } else {
        const { error } = await adminSupabase.auth.verifyOtp({ email, token: code, type: 'email' })
        if (error) throw new Error('کد معتبر نیست یا منقضی شده است.')
      }
    })
  }
  function edit(puzzle: Puzzle) { setEditing(puzzle); setAnswer(puzzle.answer); setDate(puzzle.date || tehranDate()); setKind(puzzle.kind as 'daily' | 'recording'); setLink(''); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  function clear() { setEditing(null); setAnswer(''); setLink('') }
  async function save(publish: boolean) {
    if (!isWord(answer)) { setMessage('یک واژهٔ پنج‌حرفی فارسی وارد کنید.'); return }
    await task(async () => {
      const saved = await rpc<{ token?: string }>('admin_save', { id: editing?.id, revision: editing?.revision, answer: normalize(answer), kind, date: kind === 'daily' ? date : null, publish }, true)
      await refresh(); setEditing(null); setAnswer('')
      if (saved.token) { setLink(`${location.origin}${location.pathname}#/p/${saved.token}`); setMessage('چالش ساخته شد. پیوند را همین حالا ذخیره کنید؛ دوباره نمایش داده نمی‌شود.') }
      else setMessage(publish ? 'واژه با موفقیت زمان‌بندی شد.' : 'پیش‌نویس ذخیره شد.')
    })
  }
  return <main className="admin-main">
    <a href="#/play" className="text-button">بازگشت به بازی</a>
    <div className="admin-title"><div><span className="eyebrow">مدیریت واژه آلفا</span><h1>واژه‌ها و چالش‌ها</h1></div>{authenticated && <button className="secondary" onClick={() => void task(async () => { await adminSupabase?.auth.signOut(); setData(null) })}><LogOut size={17} />خروج</button>}</div>
    {!configured ? <section className="setup-panel"><h2>اتصال به Supabase هنوز تنظیم نشده است</h2><p>بازی آزمایشی آماده است. برای فعال شدن ورود مدیر، انتخاب واژهٔ روز و چالش‌های مشترک، پروژهٔ Supabase را طبق راهنمای مخزن متصل کنید.</p><p className="muted">در نسخهٔ محلی، تغییر واژه یا ساخت پیوند واقعی انجام نمی‌شود.</p><a className="primary" href="#/play">دیدن بازی آزمایشی</a></section> : !authenticated ? <form className="login-panel" onSubmit={login}>
      <h2>ورود مدیر</h2><p className="muted">فقط حساب‌های تعیین‌شده توسط مالک دسترسی دارند.</p>
      <label>ایمیل<input required type="email" dir="ltr" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} disabled={sent || busy} placeholder="name@example.com" /></label>
      {sent && <label>کد ورود<input required inputMode="numeric" autoComplete="one-time-code" dir="ltr" value={code} onChange={e => setCode(e.target.value)} placeholder="کد ایمیل" /></label>}
      <button className="primary full" disabled={busy}>{busy ? 'لطفاً صبر کنید…' : sent ? 'ورود' : 'دریافت کد ورود'}</button>
      {sent && <button className="text-button" type="button" onClick={() => { setSent(false); setCode('') }}>تغییر ایمیل یا ارسال دوباره</button>}
    </form> : !data ? <section className="setup-panel"><p>در حال بررسی دسترسی مدیریت…</p><button className="secondary" disabled={busy} onClick={() => void task(refresh)}><RotateCw size={16} />تلاش دوباره</button></section> : <>
      <section className="editor-panel">
        <div className="section-heading"><h2>{editing ? 'ویرایش پیش‌نویس' : 'واژهٔ تازه'}</h2>{editing && <button className="text-button" onClick={clear}>انصراف از ویرایش</button>}</div>
        <div className="segmented"><button className={kind === 'daily' ? 'selected' : ''} onClick={() => { setKind('daily'); setEditing(null) }}><CalendarDays size={17} />واژهٔ روز</button><button className={kind === 'recording' ? 'selected' : ''} onClick={() => { setKind('recording'); setEditing(null) }}><Clapperboard size={17} />چالش برای ضبط</button></div>
        <label>واژهٔ پنج‌حرفی<div className="word-field"><input value={answer} onChange={e => setAnswer(normalize(e.target.value))} placeholder="واژه را بنویسید" maxLength={14} /><button className="secondary" disabled={busy} onClick={() => void task(async () => { const result = await rpc<{ answer: string }>('admin_random', {}, true); setAnswer(result.answer) })}><Shuffle size={17} />تصادفی</button></div></label>
        <div className="example-row admin-preview" aria-label="پیش‌نمایش واژه">{Array.from({ length: 5 }, (_, i) => <span className="tile" key={i}>{answer[i]}</span>)}</div>
        {kind === 'daily' ? <label>تاریخ انتشار به وقت تهران<input type="date" dir="ltr" min={tehranDate()} required value={date} onChange={e => setDate(e.target.value)} /></label> : <p className="muted">چالش با یک پیوند مشترک منتشر می‌شود. هرکس پیوند را داشته باشد می‌تواند بازی کند؛ این چالش به روز مشخصی وابسته نیست.</p>}
        <p className="small muted">انتخاب تصادفی، فقط یک پیشنهاد می‌سازد. برای انتشار، دکمهٔ زیر را بزنید.</p>
        <div className="editor-actions"><button className="primary" disabled={busy || !answer || (kind === 'daily' && !date)} onClick={() => void save(true)}><Check size={18} />{kind === 'daily' ? 'زمان‌بندی واژه' : 'ساخت پیوند چالش'}</button><button className="secondary" disabled={busy || !answer} onClick={() => void save(false)}><Save size={17} />ذخیرهٔ پیش‌نویس</button></div>
      </section>
      {link && <section className="link-panel"><h3>پیوند چالش</h3><input aria-label="پیوند چالش" dir="ltr" readOnly value={link} onFocus={e => e.target.select()} /><button className="secondary" onClick={() => void task(async () => { await navigator.clipboard.writeText(link); setMessage('پیوند کپی شد.') })}><Copy size={16} />کپی پیوند</button></section>}
      <section className="puzzles-panel"><div className="section-heading"><h2>واژه‌های ثبت‌شده</h2><button className="icon-button" aria-label="تازه‌سازی واژه‌ها" disabled={busy} onClick={() => void task(refresh)}><RotateCw size={18} /></button></div>
        {data.puzzles.length === 0 ? <p className="muted">هنوز واژه‌ای ثبت نشده است.</p> : <div className="table-scroll">
          <table><thead><tr><th>واژه</th><th>نوع / تاریخ</th><th>وضعیت</th><th>عملیات</th></tr></thead><tbody>
            {data.puzzles.map(puzzle => <tr key={puzzle.id}>
              <td className="word-cell">{puzzle.answer}</td>
              <td>{puzzle.kind === 'daily' ? fa(puzzle.date || '—') : 'چالش ضبط'}</td>
              <td>{statusName[puzzle.status] || puzzle.status}</td>
              <td>{(puzzle.status === 'draft' || (puzzle.status === 'scheduled' && puzzle.date! > tehranDate())) ?
                <button className="text-button" onClick={() => edit(puzzle)}>ویرایش</button> :
                puzzle.kind === 'recording' && ['published','revoked'].includes(puzzle.status) ? <div className="table-actions">
                  {puzzle.status === 'published' && <button className="text-button danger" disabled={busy} onClick={() => void task(async () => {
                    await rpc('admin_revoke', { id: puzzle.id }, true); await refresh(); setMessage('پیوند برای شروع بازی جدید غیرفعال شد.')
                  })}>لغو پیوند</button>}
                  <button className="text-button danger" disabled={busy} onClick={() => {
                    if (window.confirm('این چالش برای همه، حتی بازیکنان فعلی، بسته شود؟')) void task(async () => {
                      await rpc('admin_retire', { id: puzzle.id }, true); await refresh(); setMessage('چالش برای همه بسته شد.')
                    })
                  }}>بستن کامل</button>
                </div> : <span className="muted">قفل‌شده</span>}
              </td>
            </tr>)}
          </tbody></table>
        </div>}
      </section>
    </>}
    {message && <p className="admin-message" role="status">{message}</p>}
  </main>
}
