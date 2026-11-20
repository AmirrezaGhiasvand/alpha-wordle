import { expect,it } from 'vitest'
import { challengeToken,challengeUrl,friendToken,friendUrl,newFriendToken } from '../src/lib/routes'

it('round-trips cryptographically generated friend invites under the GitHub Pages path', () => {
  const token=newFriendToken()
  expect(token).toMatch(/^[a-f0-9]{64}$/)
  expect(newFriendToken()).not.toBe(token)
  const url=friendUrl(token,{origin:'https://example.com',pathname:'/alpha-wordle/'})
  expect(friendToken(new URL(url).hash)).toBe(token)
  expect(friendToken(new URL(url).hash+'?source=copy')).toBe(token)
  expect(challengeToken(new URL(url).hash)).toBeUndefined()
})

it('round-trips generated custom-game links without dropping any token characters', () => {
  for(const first of '0123456789abcdef') {
    const token=first+'a'.repeat(63)
    const link=challengeUrl(token,{origin:'https://example.com',pathname:'/alpha-wordle/'})
    expect(challengeToken(new URL(link).hash)).toBe(token)
    expect(challengeToken(new URL(link).hash)).toHaveLength(64)
  }
})
it('preserves the full token when shared with a query or trailing slash', () => {
  const token='0123456789abcdef'.repeat(4)
  expect(challengeToken(`#/p/${token}?from=share`)).toBe(token)
  expect(challengeToken(`#/p/${token}/`)).toBe(token)
  expect(challengeToken('#/play')).toBeUndefined()
  expect(challengeToken('#/admin')).toBeUndefined()
})
