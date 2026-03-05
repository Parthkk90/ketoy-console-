import { useState } from 'react'
import { useAppStore } from '../store/appStore'
import { appAPI } from '../services/api'

export default function CreateAppModal({ isOpen, onClose, onSuccess }) {
  const { addApp } = useAppStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showApiKey, setShowApiKey] = useState(false)
  const [apiKey, setApiKey] = useState(null)
  const [formData, setFormData] = useState({
    packageName: '',
    appName: '',
    description: '',
    platform: 'both'
  })

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await appAPI.register({
        ...formData,
        metadata: {
          platform: formData.platform
        }
      })
      
      const newApp = response.data.data.app
      const newApiKey = newApp.apiKey
      
      addApp(newApp)
      setApiKey(newApiKey)
      setShowApiKey(true)
      
      // Don't close immediately, show API key first
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create app')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (showApiKey && onSuccess) {
      onSuccess()
    }
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-[#1a2332] rounded-lg max-w-md w-full p-6 border border-gray-800">
        {!showApiKey ? (
          <>
            <h2 className="text-2xl font-bold text-white mb-4">Create New Project</h2>
            
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Package Name *
                </label>
                <input
                  type="text"
                  name="packageName"
                  value={formData.packageName}
                  onChange={handleChange}
                  placeholder="com.example.myapp"
                  required
                  pattern="^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$"
                  title="Package name must follow reverse domain format: lowercase letters, numbers, underscores, separated by dots (e.g., com.yourcompany.appname)"
                  className="w-full px-4 py-2 bg-[#0f1c2e] border border-gray-700 rounded-lg focus:outline-none focus:border-emerald-500 text-white select-text"
                />
                <div className="mt-2 p-2 bg-blue-500/10 border border-blue-500/30 rounded text-xs text-blue-300">
                  <p className="font-medium mb-1">Package Name Format Rules:</p>
                  <ul className="list-disc list-inside space-y-0.5 text-gray-400">
                    <li>Use reverse domain format (e.g., <span className="text-emerald-400">com.yourcompany.appname</span>)</li>
                    <li>Only lowercase letters, numbers, and underscores</li>
                    <li>Must start with a letter after each dot</li>
                    <li>At least 2 segments separated by a dot</li>
                    <li>Examples: <span className="text-emerald-400">com.myapp</span>, <span className="text-emerald-400">io.github.project</span></li>
                  </ul>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  App Name *
                </label>
                <input
                  type="text"
                  name="appName"
                  value={formData.appName}
                  onChange={handleChange}
                  placeholder="My App"
                  required
                  className="w-full px-4 py-2 bg-[#0f1c2e] border border-gray-700 rounded-lg focus:outline-none focus:border-emerald-500 text-white select-text"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Brief description of your app"
                  rows={3}
                  className="w-full px-4 py-2 bg-[#0f1c2e] border border-gray-700 rounded-lg focus:outline-none focus:border-emerald-500 text-white resize-none select-text"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Platform
                </label>
                <select
                  name="platform"
                  value={formData.platform}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-[#0f1c2e] border border-gray-700 rounded-lg focus:outline-none focus:border-emerald-500 text-white"
                >
                  <option value="both">Both (iOS & Android)</option>
                  <option value="android">Android</option>
                  <option value="ios">iOS</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 bg-[#0f1c2e] hover:bg-[#152235] text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-white mb-4">App Created Successfully!</h2>
            
            <div className="mb-6">
              <p className="text-gray-300 mb-4">
                Your app has been created. Please save the API key below. You won't be able to see it again.
              </p>
              
              <div className="bg-[#0f1c2e] border border-gray-700 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  API Key
                </label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-emerald-400 text-sm break-all font-mono">
                    {apiKey}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(apiKey)
                      alert('API Key copied to clipboard!')
                    }}
                    className="p-2 bg-[#1a2332] hover:bg-[#152235] rounded-lg text-gray-400 hover:text-white transition-colors"
                    title="Copy to clipboard"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="w-full px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors"
            >
              Continue
            </button>
          </>
        )}
      </div>
    </div>
  )
}
