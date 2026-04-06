import axios from 'axios'
import { getIdToken, useAuthStore } from '../store/authStore'
import { API_ERROR_MESSAGES } from './ktwUtils'

const BASE = import.meta.env.DEV
  ? '/__api'
  : import.meta.env.VITE_API_BASE_URL || 'https://api.ketoy.dev'

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
    screenName: screen.screenName || screen.screenId,
    ktwSizeBytes: screen.ktwSizeBytes ?? null
  }
}

const normalizeResponse = (response) => {
  const payload = response?.data?.data
  if (!payload) return response

  const normalizeListItems = (items) => {
    const hasAppLike = items.some((item) => item && (item.bundleId || item.packageName || item.appName))
    const hasScreenLike = items.some((item) => item && (item.screenId || item.screenName))

    if (hasAppLike) return items.map(normalizeApp)
    if (hasScreenLike) return items.map(normalizeScreen)
    return items
  }

  if (Array.isArray(payload?.items)) {
    response.data.data = {
      ...payload,
      items: normalizeListItems(payload.items)
    }
    return response
  }

  if (Array.isArray(payload)) {
    response.data.data = {
      items: normalizeListItems(payload)
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

const asKtwBinary = (data) => {
  if (data instanceof Blob || data instanceof ArrayBuffer) return data

  if (ArrayBuffer.isView(data)) {
    return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength)
  }

  return data
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
    if (response?.config?.responseType === 'arraybuffer') {
      return response
    }

    // Known backend error codes surfaced via `ok: false` envelope:
    // INVALID_ID        - appId, screenId, or snapshotId contains
    //                     disallowed characters (must match [a-zA-Z0-9._-]{1,128})
    // INVALID_KTW       - body is not a valid .ktw file
    // INVALID_TYPE      - rollback type is not "json" or "ktw"
    // INVALID_SCREEN    - bundle entry missing required fields
    // BUNDLE_TOO_LARGE  - bundle exceeds 50-screen limit
    // PAYLOAD_TOO_LARGE - file exceeds 1 MB limit
    // MISSING_BODY      - binary upload received no body
    if (response?.data?.ok === false) {
      throw new Error(response.data?.error?.message || 'Request failed')
    }
    return normalizeResponse(response)
  },
  (error) => {
    const status = error.response?.status
    const errorCode = error.response?.data?.error?.code
    const responseMessage = error.response?.data?.error?.message || error.response?.data?.message

    if (status === 401) {
      useAuthStore.getState().logout()
    }

    if (errorCode && API_ERROR_MESSAGES[errorCode]) {
      error.message = API_ERROR_MESSAGES[errorCode]
    } else if (status === 403) {
      error.message = API_ERROR_MESSAGES.FORBIDDEN
    } else if (responseMessage && !error.message) {
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

    if (typeof data?.description === 'string' && data.description.trim()) {
      payload.description = data.description.trim()
    }

    if (data?.metadata && typeof data.metadata === 'object') {
      const metadata = Object.fromEntries(
        Object.entries(data.metadata).filter(([, value]) => value !== undefined && value !== null && value !== '')
      )
      if (Object.keys(metadata).length > 0) {
        payload.metadata = metadata
      }
    }

    return api.post('/apps', payload)
  },
  getAll: (params = {}) => api.get('/apps', { params }),


  getDetails: (bundleId) => api.get(`/apps/${encodeURIComponent(bundleId)}`),


  update: (bundleId, data) => {
    const payload = {}
    if (typeof data?.appName === 'string') payload.appName = data.appName
    if (Array.isArray(data?.contacts)) payload.contacts = data.contacts
    return api.put(`/apps/${encodeURIComponent(bundleId)}`, payload)
  },
  delete: (bundleId) => api.delete(`/apps/${encodeURIComponent(bundleId)}`)
}

// Screen APIs
export const screenAPI = {
  upload: (bundleId, screenId, data, version = '') => screenAPI.uploadKtw(bundleId, screenId, data, version),

  getAll: (bundleId, params = {}) => api.get(`/apps/${encodeURIComponent(bundleId)}/screens`, { params }),

  getDetails: (bundleId, screenId) => api.get(`/apps/${encodeURIComponent(bundleId)}/screens/${encodeURIComponent(screenId)}`),

  update: (bundleId, screenId, data, version = '') => screenAPI.uploadKtw(bundleId, screenId, data, version),

  delete: (bundleId, screenId) => api.delete(`/apps/${encodeURIComponent(bundleId)}/screens/${encodeURIComponent(screenId)}`),
  fetchPublic: (bundleId, screenId) => screenAPI.fetchPublicKtw(bundleId, screenId),

  uploadKtw: (bundleId, screenId, binaryData, version = '') => {
    const normalizedVersion = String(version || '').trim()
    const versionQuery = normalizedVersion ? `?version=${encodeURIComponent(normalizedVersion)}` : ''
    return api.post(`/apps/${encodeURIComponent(bundleId)}/screens/${encodeURIComponent(screenId)}/ktw${versionQuery}`, asKtwBinary(binaryData), {
      headers: { 'Content-Type': 'application/octet-stream' }
    })
  },

  fetchPublicKtw: (bundleId, screenId) =>
    publicApi.get('/ktw', {
      params: { app: bundleId, screen: screenId },
      responseType: 'arraybuffer'
    }),

  uploadBundle: (bundleId, screens, bump = 'patch') => screenAPI.uploadBundleKtw(bundleId, screens, bump),

  uploadBundleKtw: (bundleId, screens, bump = 'patch') => {
    const normalizedBump = ['patch', 'minor', 'major'].includes(bump) ? bump : 'patch'
    return api.post(`/apps/${encodeURIComponent(bundleId)}/screens/bundle/ktw`, { bump: normalizedBump, screens })
  },

  getVersions: (bundleId, screenId) => api.get(`/apps/${encodeURIComponent(bundleId)}/screens/${encodeURIComponent(screenId)}/versions`),

  getByVersion: (bundleId, screenId, version) =>
    api.get(`/apps/${encodeURIComponent(bundleId)}/screens/${encodeURIComponent(screenId)}/versions/${encodeURIComponent(version)}`, {
      responseType: 'arraybuffer'
    }),
  rollback: (bundleId, screenId, version) => api.post(`/apps/${encodeURIComponent(bundleId)}/screens/${encodeURIComponent(screenId)}/rollback`, { version })
}

export const bundleAPI = {
  getAll: (bundleId, params = {}) =>
    api.get(`/apps/${encodeURIComponent(bundleId)}/bundles`, { params }),

  getDetails: (bundleId, snapshotId) =>
    api.get(`/apps/${encodeURIComponent(bundleId)}/bundles/${encodeURIComponent(snapshotId)}`),
  
  promote: (bundleId, snapshotId, bump = 'major') => {
    const normalizedBump = ['patch', 'minor', 'major'].includes(bump) ? bump : 'major'
    return api.post(`/apps/${encodeURIComponent(bundleId)}/bundles/${encodeURIComponent(snapshotId)}/promote`, { bump: normalizedBump })
  }
}

export default api
