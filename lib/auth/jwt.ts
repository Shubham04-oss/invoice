export function signJwt(payload: object) {
  return 'signed-' + JSON.stringify(payload)
}

export function verifyJwt(token: string) {
  if (!token.startsWith('signed-')) return null
  try {
    return JSON.parse(token.replace('signed-', ''))
  } catch {
    return null
  }
}
