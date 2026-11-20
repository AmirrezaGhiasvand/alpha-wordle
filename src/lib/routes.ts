const challengePrefix = '#/p/'
export function friendToken(hash: string): string | undefined {
  return hash.startsWith('#/friend/') ? hash.slice('#/friend/'.length).split(/[/?]/,1)[0] : undefined
}
export function friendUrl(token: string, location: Pick<Location,'origin'|'pathname'> = window.location): string {
  return `${location.origin}${location.pathname}#/friend/${token}`
}
export function newFriendToken(): string {
  return [...crypto.getRandomValues(new Uint8Array(32))].map(n => n.toString(16).padStart(2,'0')).join('')
}

export function challengeToken(hash: string): string | undefined {
  if (!hash.startsWith(challengePrefix)) return undefined
  // Use the prefix length: slicing at 5 discarded the first character of every token.
  return hash.slice(challengePrefix.length).split(/[/?]/,1)[0]
}

export function challengeUrl(token: string, location: Pick<Location,'origin'|'pathname'> = window.location): string {
  return `${location.origin}${location.pathname}${challengePrefix}${token}`
}
