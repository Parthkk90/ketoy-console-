const USERNAME_KEY = 'ketoy_username'
const TOKEN_KEY = 'developerToken'

const decodeTokenPayload = (token) => {
  if (!token || typeof token !== 'string') return null

  try {
    const [, payload] = token.split('.')
    if (!payload) return null

    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
    return JSON.parse(atob(padded))
  } catch {
    return null
  }
}

const usernameFromEmail = (email) => {
  if (!email || typeof email !== 'string') return ''
  return email.split('@')[0]?.trim() || ''
}

export const getDisplayUsername = (developer) => {
  if (typeof window === 'undefined') {
    return developer?.name || usernameFromEmail(developer?.email) || 'Developer'
  }

  const storedUsername = localStorage.getItem(USERNAME_KEY)?.trim()
  if (storedUsername) return storedUsername

  const token = localStorage.getItem(TOKEN_KEY)
  const payload = decodeTokenPayload(token)
  const claimEmail = payload?.email || payload?.['cognito:username'] || ''
  const tokenUsername = usernameFromEmail(claimEmail)

  if (tokenUsername) return tokenUsername

  return developer?.name || usernameFromEmail(developer?.email) || 'Developer'
}