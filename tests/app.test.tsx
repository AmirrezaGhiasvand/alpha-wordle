// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import App from '../src/App'

beforeEach(() => { localStorage.clear(); window.location.hash = '#/play' })
afterEach(() => cleanup())
async function enter(word: string) {
  for (const letter of word) fireEvent.click(screen.getByRole('button', { name: letter }))
  fireEvent.click(screen.getByRole('button', { name: 'ثبت حدس' }))
}
describe('local playable interface', () => {
  it('plays a complete Persian game and restores progress on reload', async () => {
    const view = render(<App />)
    await screen.findByText('۰ از ۶ تلاش')
    expect(screen.getByText('نسخهٔ آزمایشی')).toBeDefined()
    await enter('باران')
    await screen.findByText('آفرین! واژه را پیدا کردی.')
    expect(screen.getByRole('button', { name: 'دیدن نتیجه' })).toBeDefined()
    view.unmount()
    render(<App />)
    await screen.findByText('آفرین! واژه را پیدا کردی.')
    expect(screen.getAllByLabelText(/حرف درست، جای درست/).length).toBeGreaterThanOrEqual(5)
  })
  it('keeps an unknown guess in the active row and consumes no turn', async () => {
    render(<App />); await screen.findByText('۰ از ۶ تلاش')
    await enter('ببببب')
    await screen.findByText('این واژه در واژه‌نامه نیست.')
    expect(screen.getByText('۰ از ۶ تلاش')).toBeDefined()
    expect(screen.getByRole('button', { name: 'ثبت حدس' }).hasAttribute('disabled')).toBe(false)
  })
  it('supports physical keyboard and normalized paste', async () => {
    render(<App />); await screen.findByText('۰ از ۶ تلاش')
    for (const key of ['آ','س','م','ا','ن']) fireEvent.keyDown(document.body, { key })
    fireEvent.keyDown(document.body, { key: 'Enter' })
    await screen.findByText('۱ از ۶ تلاش')
    fireEvent.paste(document.body, { clipboardData: { getData: () => 'باران' } })
    fireEvent.keyDown(document.body, { key: 'Enter' })
    await screen.findByText('آفرین! واژه را پیدا کردی.')
  })
  it('shows the admin setup boundary without offering fake publication', async () => {
    window.location.hash = '#/admin'
    render(<App />)
    await screen.findByText('اتصال به Supabase هنوز تنظیم نشده است')
    expect(screen.queryByRole('button', { name: 'زمان‌بندی واژه' })).toBeNull()
  })
  it('uses a single layout and persists the chosen light or dark theme', async () => {
    const view = render(<App />); await screen.findByText('۰ از ۶ تلاش')
    expect(screen.queryByRole('button', { name: 'حالت ضبط' })).toBeNull()
    expect(document.documentElement.dataset.theme).toBe('light')
    fireEvent.click(screen.getByRole('button', { name: 'تغییر پوسته' }))
    await waitFor(() => expect(document.documentElement.dataset.theme).toBe('dark'))
    view.unmount(); render(<App />)
    await screen.findByText('۰ از ۶ تلاش')
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(document.querySelector('.app.game-app')).not.toBeNull()
  })
  it('confirms a reset before clearing the active game, then supports playing again after a win', async () => {
    render(<App />); await screen.findByText('۰ از ۶ تلاش')
    await enter('آرامش'); await screen.findByText('۱ از ۶ تلاش')
    fireEvent.click(screen.getByRole('button', { name: 'شروع دوباره' }))
    await screen.findByRole('dialog')
    fireEvent.click(screen.getByRole('button', { name: 'ادامهٔ بازی' }))
    expect(screen.getByText('۱ از ۶ تلاش')).toBeDefined()
    fireEvent.click(screen.getByRole('button', { name: 'شروع دوباره' }))
    fireEvent.click(screen.getAllByRole('button', { name: 'شروع دوباره' }).at(-1)!)
    await screen.findByText('۰ از ۶ تلاش')
    await enter('باران'); await screen.findByText('آفرین! واژه را پیدا کردی.')
    fireEvent.click(screen.getByRole('button', { name: 'بازی دوباره' }))
    await screen.findByText('۰ از ۶ تلاش')
    expect(screen.getByRole('button', { name: 'ثبت حدس' }).hasAttribute('disabled')).toBe(false)
  })
})
