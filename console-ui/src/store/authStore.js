import { create } from 'zustand'
import {
  clearDeveloperTokenCookie,
  getDeveloperTokenFromCookie,
  setDeveloperTokenCookie
} from '../services/authCookie'

const TOKEN_KEY = 'developerToken'
const DEVELOPER_KEY = 'developer'
const USERNAME_KEY = 'ketoy_username'

export const getIdToken = () => getDeveloperTokenFromCookie() || localStorage.getItem(TOKEN_KEY)

const parseStoredDeveloper = () => {
  const storedDeveloper = localStorage.getItem(DEVELOPER_KEY)
  if (!storedDeveloper) return null

  try {
    return JSON.parse(storedDeveloper)
  } catch {
    return null
  }
}

const clearAuthStorage = () => {
  clearDeveloperTokenCookie()
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(DEVELOPER_KEY)
  localStorage.removeItem(USERNAME_KEY)
}

export const useAuthStore = create((set) => {
  const storedToken = getIdToken()
  const storedDeveloper = parseStoredDeveloper()
  
  return {
    developer: storedDeveloper,
    developerToken: storedToken,
    isAuthenticated: Boolean(storedToken),
    getIdToken,
    
    setAuth: (developer, token, username) => {
      setDeveloperTokenCookie(token)
      localStorage.setItem(TOKEN_KEY, token)
      localStorage.setItem(DEVELOPER_KEY, JSON.stringify(developer))
      if (username) {
        localStorage.setItem(USERNAME_KEY, username)
      }
      set({ developer, developerToken: token, isAuthenticated: true })
    },
    
    updateDeveloper: (developer) => {
      localStorage.setItem(DEVELOPER_KEY, JSON.stringify(developer))
      set({ developer })
    },
    
    logout: () => {
      clearAuthStorage()
      set({ developer: null, developerToken: null, isAuthenticated: false })
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
  }
})
