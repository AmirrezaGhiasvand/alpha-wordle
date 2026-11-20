// @vitest-environment happy-dom
import { afterEach,beforeEach,expect,it,vi } from 'vitest'
import { act,cleanup,fireEvent,render,screen } from '@testing-library/react'
import type { Game } from '../src/game/engine'
import { score } from '../src/game/engine'

const api=vi.hoisted(()=>({openGame:vi.fn(),guessGame:vi.fn(),resetGame:vi.fn(),rpc:vi.fn()}))
vi.mock('../src/lib/api',()=>({...api,configured:true,adminSupabase:null}))
import App from '../src/App'

const fresh:Game={id:'puzzle',label:'2026-11-20',kind:'daily',attempts:[],status:'playing',round:1}
beforeEach(()=>{localStorage.clear();window.location.hash='#/play';vi.clearAllMocks();api.openGame.mockResolvedValue(fresh)})
afterEach(()=>cleanup())

it('opens a generated custom link with its entire 64-character token',async()=>{
  const token='0123456789abcdef'.repeat(4)
  window.location.hash=`#/p/${token}`
  api.openGame.mockResolvedValue({...fresh,kind:'recording'})
  render(<App/>);await screen.findByText('۰ از ۶ تلاش')
  expect(api.openGame).toHaveBeenCalledWith(token)
  expect(screen.getByText('چالش دوستانه')).toBeDefined()
})

it('responds immediately to submit but reveals only the newly confirmed row without remounting previous rows',async()=>{
  const existing={guess:'پرواز',marks:score('باران','پرواز')}
  const game={...fresh,attempts:[existing]}
  api.openGame.mockResolvedValue(game)
  let respond!:(game:Game)=>void
  api.guessGame.mockImplementation(()=>new Promise<Game>(resolve=>{respond=resolve}))
  render(<App/>);await screen.findByText('۱ از ۶ تلاش')
  const oldRow=document.querySelector('.board-row')
  expect(document.querySelectorAll('.revealing')).toHaveLength(0)
  for(const key of 'آرامش')fireEvent.keyDown(document.body,{key})
  fireEvent.click(screen.getByRole('button',{name:'ثبت حدس'}))
  expect(screen.getByRole('button',{name:'ثبت حدس'}).getAttribute('aria-busy')).toBe('true')
  expect(document.querySelectorAll('.is-submitting')).toHaveLength(1)
  expect(document.querySelectorAll('.revealing')).toHaveLength(0)
  expect(api.guessGame).toHaveBeenCalledTimes(1)
  await act(async()=>respond({...game,attempts:[existing,{guess:'آرامش',marks:score('باران','آرامش')}]}))
  expect(document.querySelector('.board-row')).toBe(oldRow)
  expect(oldRow?.querySelectorAll('.revealing')).toHaveLength(0)
  expect(document.querySelectorAll('.revealing')).toHaveLength(5)
  expect(document.querySelectorAll('.is-submitting')).toHaveLength(0)
})

it('keeps an unconfirmed guess and its retry identifier after a network failure',async()=>{
  api.guessGame.mockRejectedValueOnce(new Error('ارتباط برقرار نشد.'))
  api.guessGame.mockResolvedValueOnce({...fresh,attempts:[{guess:'آرامش',marks:score('باران','آرامش')}]})
  render(<App/>);await screen.findByText('۰ از ۶ تلاش')
  for(const key of 'آرامش')fireEvent.keyDown(document.body,{key})
  fireEvent.click(screen.getByRole('button',{name:'ثبت حدس'}))
  await screen.findByText('ارتباط برقرار نشد.')
  expect(document.querySelectorAll('.revealing')).toHaveLength(0)
  expect(document.querySelectorAll('.is-submitting')).toHaveLength(0)
  fireEvent.click(screen.getByRole('button',{name:'ثبت حدس'}))
  await screen.findByText('۱ از ۶ تلاش')
  expect(api.guessGame.mock.calls[0][2]).toBe(api.guessGame.mock.calls[1][2])
})
