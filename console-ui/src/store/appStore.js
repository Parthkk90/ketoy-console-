import { create } from 'zustand'

export const useAppStore = create((set) => ({
  apps: [],
  currentApp: null,
  loading: false,
  error: null,
  
  setApps: (apps) => set({ apps }),
  setCurrentApp: (app) => set({ currentApp: app }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  
  addApp: (app) => set((state) => ({ apps: [...state.apps, app] })),
  updateApp: (packageName, updatedData) => set((state) => ({
    apps: state.apps.map((app) => 
      app.packageName === packageName ? { ...app, ...updatedData } : app
    ),
    currentApp: state.currentApp?.packageName === packageName 
      ? { ...state.currentApp, ...updatedData } 
      : state.currentApp
  })),
  removeApp: (packageName) => set((state) => ({
    apps: state.apps.filter((app) => app.packageName !== packageName),
    currentApp: state.currentApp?.packageName === packageName ? null : state.currentApp
  }))
}))
