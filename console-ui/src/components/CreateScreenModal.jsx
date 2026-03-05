import { useState } from 'react'
import { useScreenStore } from '../store/screenStore'
import { screenAPI } from '../services/api'

const defaultJsonContent = {
  type: "scaffold",
  body: {
    type: "center",
    child: {
      type: "text",
      data: "Hello World"
    }
  }
}

export default function CreateScreenModal({ isOpen, onClose, packageName, onSuccess }) {
  const { addScreen } = useScreenStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [formData, setFormData] = useState({
    screenName: '',
    displayName: '',
    description: '',
    jsonContent: JSON.stringify(defaultJsonContent, null, 2)
  })

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Validate JSON
      JSON.parse(formData.jsonContent)
      
      const response = await screenAPI.upload(packageName, {
        screenName: formData.screenName,
        displayName: formData.displayName,
        description: formData.description,
        jsonContent: formData.jsonContent // Send as string
      })
      
      const newScreen = response.data.data.screen
      addScreen(newScreen)
      
      if (onSuccess) {
        onSuccess()
      }
      onClose()
    } catch (err) {
      if (err instanceof SyntaxError) {
        setError('Invalid JSON format. Please check your JSON.')
      } else {
        setError(err.response?.data?.message || 'Failed to create screen')
      }
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-[#1a2332] rounded-lg max-w-2xl w-full p-6 border border-gray-800 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-white mb-4">Create New Screen</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Screen Name *
            </label>
            <input
              type="text"
              name="screenName"
              value={formData.screenName}
              onChange={handleChange}
              placeholder="home_screen"
              required
              pattern="^[a-zA-Z0-9_-]+$"
              className="w-full px-4 py-2 bg-[#0f1c2e] border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white select-text"
            />
            <p className="mt-1 text-xs text-gray-500">Only letters, numbers, hyphens, and underscores</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Display Name
            </label>
            <input
              type="text"
              name="displayName"
              value={formData.displayName}
              onChange={handleChange}
              placeholder="Home Screen"
              className="w-full px-4 py-2 bg-[#0f1c2e] border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white select-text"
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
              placeholder="Brief description of the screen"
              rows={2}
              className="w-full px-4 py-2 bg-[#0f1c2e] border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white resize-none select-text"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              JSON Content - Drop your content here*
            </label>
            <textarea
              name="jsonContent"
              value={formData.jsonContent}
              onChange={handleChange}
              rows={12}
              required
              className="w-full px-4 py-2 bg-[#0f1c2e] border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white font-mono text-sm resize-none select-text"
            />
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
              className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
