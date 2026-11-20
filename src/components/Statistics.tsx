import { fa, type Game } from '../game/engine'
import { results } from '../lib/storage'

export default function Statistics({ game, onShare }: { game?: Game | null; onShare: () => void }) {
  const all = results().filter(r => r.kind !== 'demo')
  const wins = all.filter(r => r.won)
  const distribution = Array.from({ length: 6 }, (_, i) => wins.filter(r => r.attempts === i + 1).length)
  const max = Math.max(1, ...distribution)
  return <>
    {game && game.status !== 'playing' && <div className="result-summary">
      <span className="eyebrow">{game.status === 'won' ? 'پیداش کردی!' : 'این بار نشد'}</span>
      <p>{game.status === 'won' ? `واژه را در ${fa(game.attempts.length)} تلاش پیدا کردی.` : 'شش فرصت تمام شد؛ فردا یک واژهٔ تازه منتظر توست.'}</p>
      <div className="answer">{game.answer}</div>
    </div>}
    <div className="stat-numbers">
      <div><strong>{fa(all.length)}</strong><span>بازی</span></div>
      <div><strong>{fa(all.length ? Math.round(wins.length / all.length * 100) : 0)}٪</strong><span>برد</span></div>
      <div><strong>{fa(wins.length)}</strong><span>واژهٔ پیدا شده</span></div>
    </div>
    <h3>تعداد تلاش تا برد</h3>
    <div className="distribution">{distribution.map((count, i) => <div className="distribution-row" key={i}>
      <span>{fa(i + 1)}</span><div className={game?.status === 'won' && game.attempts.length === i + 1 ? 'highlight' : ''} style={{ width: `${Math.max(8, count / max * 100)}%` }}>{fa(count)}</div>
    </div>)}</div>
    <p className="muted small">آمار روی همین مرورگر ذخیره می‌شود. بازی آزمایشی در آمار حساب نمی‌شود.</p>
    {game && game.status !== 'playing' && <button className="primary full" onClick={onShare}>اشتراک‌گذاری نتیجه</button>}
  </>
}
