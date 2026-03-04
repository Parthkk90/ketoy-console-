import { create } from 'zustand'

export const useAuthStore = create((set) => {
  // Initialize from localStorage
  const storedApiKey = localStorage.getItem('developerApiKey')
  const storedDeveloper = localStorage.getItem('developer')
  
  return {
    developer: storedDeveloper ? JSON.parse(storedDeveloper) : null,
    developerApiKey: storedApiKey,
    
    setAuth: (developer, apiKey) => {
      localStorage.setItem('developerApiKey', apiKey)
      localStorage.setItem('developer', JSON.stringify(developer))
      set({ developer, developerApiKey: apiKey })
    },
    
    updateDeveloper: (developer) => {
      localStorage.setItem('developer', JSON.stringify(developer))
      set({ developer })
    },
    
    logout: () => {
      localStorage.removeItem('developerApiKey')
      localStorage.removeItem('developer')
      set({ developer: null, developerApiKey: null })
    }
  }
})
