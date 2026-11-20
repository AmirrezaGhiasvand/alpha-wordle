const challengePrefix = '#/p/'

export function challengeToken(hash: string): string | undefined {
  if (!hash.startsWith(challengePrefix)) return undefined
  // Use the prefix length: slicing at 5 discarded the first character of every token.
  return hash.slice(challengePrefix.length).split(/[/?]/,1)[0]
}

export function challengeUrl(token: string, location: Pick<Location,'origin'|'pathname'> = window.location): string {
  return `${location.origin}${location.pathname}${challengePrefix}${token}`
}
