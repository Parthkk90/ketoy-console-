import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/appStore'
import { useScreenStore } from '../store/screenStore'
import { appAPI, screenAPI } from '../services/api'
import CreateScreenModal from '../components/CreateScreenModal'

export default function ProjectDetailPage() {
  const { packageName } = useParams()
  const navigate = useNavigate()
  const { currentApp, setCurrentApp } = useAppStore()
  const { screens, setScreens } = useScreenStore()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    fetchAppDetails()
    fetchScreens()
  }, [packageName])

  const fetchAppDetails = async () => {
    try {
      const response = await appAPI.getDetails(packageName)
      setCurrentApp(response.data.data.app)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch app details')
    }
  }

  const fetchScreens = async () => {
    setLoading(true)
    try {
      const response = await screenAPI.getAll(packageName)
      setScreens(response.data.data.screens || [])
      setError(null)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch screens')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteApp = async () => {
    try {
      await appAPI.delete(packageName)
      navigate('/projects')
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete app')
    }
  }

  const handleDeleteScreen = async (screenName) => {
    if (!confirm(`Are you sure you want to delete screen "${screenName}"?`)) return
    
    try {
      await screenAPI.delete(packageName, screenName)
      fetchScreens()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete screen')
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm mb-6">
        <Link to="/projects" className="text-gray-400 hover:text-white">
          App
        </Link>
        <span className="text-gray-600">/</span>
        <span className="text-white">{currentApp?.appName || packageName}</span>
      </div>

      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 select-none">{currentApp?.appName}</h1>
          <p className="text-gray-400 select-none">{currentApp?.packageName}</p>
          {currentApp?.description && (
            <p className="text-gray-500 mt-2 select-none">{currentApp.description}</p>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors shadow-lg shadow-blue-500/20"
          >
            + Add Screen
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/50 font-medium rounded-lg transition-colors"
          >
            Delete App
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-400">Loading screens...</p>
        </div>
      )}

      {/* Screens Grid */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {screens.length === 0 ? (
            <div className="col-span-full bg-[#1a2332] rounded-lg border border-gray-800 px-6 py-12 text-center">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <p className="text-lg text-gray-400">No screens yet</p>
              <p className="mt-2 text-sm text-gray-500">Create your first screen to get started</p>
            </div>
          ) : (
            screens.map((screen) => (
              <div
                key={screen.id || screen._id}
                className="bg-[#1a2332] rounded-lg border border-gray-800 p-6 hover:border-gray-700 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-1">
                      {screen.displayName || screen.screenName}
                    </h3>
                    <p className="text-sm text-gray-500">{screen.screenName}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteScreen(screen.screenName)}
                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Delete screen"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                
                {screen.description && (
                  <p className="text-sm text-gray-400 mb-4">{screen.description}</p>
                )}
                
                <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                  <span>Version {screen.version}</span>
                  <span>{screen.metadata?.fileSize ? `${(screen.metadata.fileSize / 1024).toFixed(1)} KB` : ''}</span>
                </div>

                <Link
                  to={`/projects/${packageName}/screens/${screen.screenName}`}
                  className="block w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-center font-medium rounded-lg transition-colors"
                >
                  Edit Screen
                </Link>
              </div>
            ))
          )}
        </div>
      )}

      {/* Create Screen Modal */}
      {isModalOpen && (
        <CreateScreenModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          packageName={packageName}
          onSuccess={fetchScreens}
        />
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-[#1a2332] rounded-lg max-w-md w-full p-6 border border-gray-800">
            <h2 className="text-xl font-bold text-white mb-4">Delete App</h2>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete <span className="font-semibold">{currentApp?.appName}</span>? 
              This action cannot be undone and will delete all screens associated with this app.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 bg-[#0f1c2e] hover:bg-[#152235] text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteApp}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
