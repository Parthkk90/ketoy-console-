import axios from 'axios'

// Use environment variable for API base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor to add API key
api.interceptors.request.use(
  (config) => {
    const developerApiKey = localStorage.getItem('developerApiKey')
    if (developerApiKey) {
      config.headers['x-developer-api-key'] = developerApiKey
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('developerApiKey')
      localStorage.removeItem('developer')
      window.location.href = '/auth'
    }
    return Promise.reject(error)
  }
)

// Developer APIs
// Login = verify API key via GET /developers/profile (x-developer-api-key header auto-attached)
// Registration = POST /developers/register → returns { developer, apiKey }
export const developerAPI = {
  register: (data) => api.post('/developers/register', data),
  getProfile: () => api.get('/developers/profile'),
  updateProfile: (data) => api.put('/developers/profile', data),
  regenerateApiKey: () => api.post('/developers/regenerate-key')
}

// App APIs
export const appAPI = {
  register: (data) => api.post('/apps/register', data),
  getAll: () => api.get('/apps'),
  getDetails: (packageName) => api.get(`/apps/${packageName}`),
  update: (packageName, data) => api.put(`/apps/${packageName}`, data),
  delete: (packageName) => api.delete(`/apps/${packageName}`),
  getStats: (packageName) => api.get(`/apps/${packageName}/stats`),
  regenerateApiKey: (packageName) => api.post(`/apps/${packageName}/regenerate-key`)
}

// Screen APIs
export const screenAPI = {
  upload: (packageName, data) => api.post(`/screens/${packageName}/upload`, data),
  getAll: (packageName) => api.get(`/screens/${packageName}`),
  getDetails: (packageName, screenName) => 
    api.get(`/screens/${packageName}/${screenName}/details?includeJson=true`),
  update: (packageName, screenName, data) => 
    api.put(`/screens/${packageName}/${screenName}`, data),
  delete: (packageName, screenName) => 
    api.delete(`/screens/${packageName}/${screenName}`),
  getVersions: (packageName, screenName) => 
    api.get(`/screens/${packageName}/${screenName}/versions`),
  getByVersion: (packageName, screenName, version) => 
    api.get(`/screens/${packageName}/${screenName}/versions/${version}`),
  rollback: (packageName, screenName, version) => 
    api.post(`/screens/${packageName}/${screenName}/rollback/${version}`)
}

export default api
