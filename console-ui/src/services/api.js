import axios from 'axios'
import { getIdToken, useAuthStore } from '../store/authStore'

const BASE = import.meta.env.DEV ? '/__api' : import.meta.env.VITE_API_BASE_URL

const normalizeApp = (app) => {
  if (!app || typeof app !== 'object') return app
  return {
    ...app,
    packageName: app.packageName || app.bundleId
  }
}

const normalizeScreen = (screen) => {
  if (!screen || typeof screen !== 'object') return screen
  return {
    ...screen,
    screenName: screen.screenName || screen.screenId
  }
}

const normalizeResponse = (response) => {
  const payload = response?.data?.data
  if (!payload) return response

  if (Array.isArray(payload)) {
    const hasAppLike = payload.some((item) => item && (item.bundleId || item.packageName || item.appName))
    const hasScreenLike = payload.some((item) => item && (item.screenId || item.screenName))
    if (hasAppLike) {
      response.data.data = payload.map(normalizeApp)
    } else if (hasScreenLike) {
      response.data.data = payload.map(normalizeScreen)
    }
    return response
  }

  if (payload.bundleId || payload.packageName || payload.appName) {
    response.data.data = normalizeApp(payload)
  }

  if (payload.screenId || payload.screenName) {
    response.data.data = normalizeScreen(response.data.data)
  }

  return response
}

// Management + protected routes
const api = axios.create({
  baseURL: BASE,
  headers: {
    'Content-Type': 'application/json'
  }
})

const publicApi = axios.create({
  baseURL: BASE,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor to add Cognito ID token for protected APIs.
api.interceptors.request.use(
  (config) => {
    const idToken = getIdToken()
    if (idToken) {
      config.headers.Authorization = `Bearer ${idToken}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    if (response?.data?.ok === false) {
      throw new Error(response.data?.error?.message || 'Request failed')
    }
    return normalizeResponse(response)
  },
  (error) => {
    const status = error.response?.status
    const responseMessage = error.response?.data?.error?.message || error.response?.data?.message

    if (status === 401) {
      useAuthStore.getState().logout()
    }

    if (responseMessage && !error.message) {
      error.message = responseMessage
    }

    return Promise.reject(error)
  }
)

// App APIs
export const appAPI = {
  register: (data) => {
    const payload = {
      bundleId: data.bundleId || data.packageName,
      appName: data.appName,
      contacts: Array.isArray(data.contacts) ? data.contacts : []
    }

    return api.post('/apps', payload)
  },
  getAll: () => api.get('/apps'),
  getDetails: (bundleId) => api.get(`/apps/${bundleId}`),
  update: (bundleId, data) => {
    const payload = {}
    if (typeof data?.appName === 'string') payload.appName = data.appName
    if (Array.isArray(data?.contacts)) payload.contacts = data.contacts
    return api.put(`/apps/${bundleId}`, payload)
  },
  delete: (bundleId) => api.delete(`/apps/${bundleId}`)
}

// Screen APIs
export const screenAPI = {
  upload: (bundleId, screenId, data) => api.post(`/apps/${bundleId}/screens/${screenId}`, data),
  getAll: (bundleId) => api.get(`/apps/${bundleId}/screens`),
  getDetails: (bundleId, screenId) => api.get(`/apps/${bundleId}/screens/${screenId}`),
  update: (bundleId, screenId, data) => api.post(`/apps/${bundleId}/screens/${screenId}`, data),
  delete: (bundleId, screenId) => api.delete(`/apps/${bundleId}/screens/${screenId}`),
  fetchPublic: (bundleId, screenId) => publicApi.get('/json', {
    params: { app: bundleId, screen: screenId }
  }),
  getVersions: (bundleId, screenId) => api.get(`/apps/${bundleId}/screens/${screenId}/versions`),
  getByVersion: (bundleId, screenId, versionId) => api.get(`/apps/${bundleId}/screens/${screenId}/versions/${versionId}`),
  rollback: (bundleId, screenId, versionId) => api.post(`/apps/${bundleId}/screens/${screenId}/rollback`, { versionId })
}

export default api
