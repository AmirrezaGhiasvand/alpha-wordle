// @vitest-environment happy-dom
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { FriendRoom } from '../src/lib/api'
import { score } from '../src/game/engine'
import { results } from '../src/lib/storage'
const api = vi.hoisted(() => ({ friendRequest: vi.fn(), openGame: vi.fn(), guessGame: vi.fn(), resetGame: vi.fn() }))
vi.mock('../src/lib/api', () => ({ ...api, configured: true, adminSupabase: null }))
import App from '../src/App'
const token = 'a'.repeat(64)
const lobby: FriendRoom = { id:'room',seat:1,chosen:null,opponentJoined:true,opponentReady:true,ready:false,expiresAt:'2026-12-01',result:'pending',opponent:{status:'playing',attempts:0},game:null }
const ready: FriendRoom = { ...lobby, chosen:'باران',ready:true,game:{id:'room',label:'دوئل دوستانه',kind:'recording',attempts:[],status:'playing',round:1} }
beforeEach(() => { localStorage.clear(); vi.clearAllMocks(); window.location.hash=`#/friend/${token}`; api.friendRequest.mockResolvedValue(lobby) })
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks() })

it('opens the full friend invite, chooses a word, plays on the shared board and prevents resets', async () => {
  render(<App />)
  await screen.findByLabelText('واژهٔ مخفی برای دوستت')
  expect(api.friendRequest).toHaveBeenCalledWith('join',token)
  expect(api.openGame).not.toHaveBeenCalled()
  expect(screen.queryByRole('button',{name:'شروع دوباره'})).toBeNull()
  fireEvent.change(screen.getByLabelText('واژهٔ مخفی برای دوستت'),{target:{value:'باران'}})
  api.friendRequest.mockResolvedValueOnce(ready)
  fireEvent.click(screen.getByRole('button',{name:'قفل کردن واژه'}))
  await screen.findByText('کمتر حدس بزن، برنده شو.')
  expect(api.friendRequest).toHaveBeenLastCalledWith('choose',token,{word:'باران'})
  const won: FriendRoom = { ...ready,game:{...ready.game!,status:'won',answer:'پرواز',attempts:[{guess:'پرواز',marks:score('پرواز','پرواز')}]},result:'me',opponent:{status:'won',attempts:2} }
  api.friendRequest.mockResolvedValueOnce(won)
  for(const key of 'پرواز') fireEvent.keyDown(document.body,{key})
  fireEvent.click(screen.getByRole('button',{name:'ثبت حدس'}))
  await screen.findByText('تو برنده شدی!')
  expect(api.friendRequest).toHaveBeenLastCalledWith('guess',token,expect.objectContaining({guess:'پرواز',turn:0,requestId:expect.any(String)}))
  expect(screen.queryByText('بازی دوباره')).toBeNull()
  expect(results()).toEqual([])
})

it('waits for the other player and polls into play without blocking the keyboard', async () => {
  vi.useFakeTimers()
  vi.spyOn(document,'hidden','get').mockReturnValue(false)
  api.friendRequest.mockResolvedValue({...lobby,chosen:'باران',opponentReady:false})
  await act(async () => { render(<App />) })
  expect(screen.getByText('منتظر آماده‌شدن دوستت…')).toBeDefined()
  api.friendRequest.mockResolvedValue(ready)
  await act(async () => { await vi.advanceTimersByTimeAsync(3100) })
  expect(screen.getByText('کمتر حدس بزن، برنده شو.')).toBeDefined()
  for(const key of 'آرامش') fireEvent.keyDown(document.body,{key})
  expect(document.querySelectorAll('.tile.filled')).toHaveLength(5)
})
