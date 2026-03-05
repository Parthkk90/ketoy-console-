import { useState, useEffect } from 'react'
import { screenAPI } from '../services/api'

export default function VersionHistoryModal({ isOpen, onClose, packageName, screenName, onLoadVersion }) {
  const [versions, setVersions] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedVersion, setSelectedVersion] = useState(null)
  const [viewingJson, setViewingJson] = useState(null)
  const [loadingVersion, setLoadingVersion] = useState(null)
  const [rolling, setRolling] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchVersions()
    }
  }, [isOpen, packageName, screenName])

  const fetchVersions = async () => {
    setLoading(true)
    try {
      const response = await screenAPI.getVersions(packageName, screenName)
      setVersions(response.data.data.versions || [])
    } catch (err) {
      console.error('Failed to fetch versions:', err)
      alert('Failed to load version history')
    } finally {
      setLoading(false)
    }
  }

  const handleViewVersion = async (version) => {
    setLoadingVersion(version)
    try {
      const response = await screenAPI.getByVersion(packageName, screenName, version)
      setSelectedVersion(version)
      setViewingJson(JSON.stringify(response.data.data.ui, null, 2))
    } catch (err) {
      console.error('Failed to fetch version:', err)
      alert('Failed to load version content')
    } finally {
      setLoadingVersion(null)
    }
  }

  const handleLoadVersion = () => {
    if (viewingJson && onLoadVersion) {
      onLoadVersion(viewingJson)
      onClose()
    }
  }

  const handleRollback = async (version) => {
    if (!confirm(`Rollback to version ${version}? This will create a new version with the content from ${version}.`)) {
      return
    }

    setRolling(true)
    try {
      const response = await screenAPI.rollback(packageName, screenName, version)
      alert(response.data.message || 'Rollback successful!')
      fetchVersions()
      setSelectedVersion(null)
      setViewingJson(null)
      if (onLoadVersion) {
        // Reload the current screen to show rolled back content
        window.location.reload()
      }
    } catch (err) {
      console.error('Rollback failed:', err)
      alert(err.response?.data?.error || 'Failed to rollback version')
    } finally {
      setRolling(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A'
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1a2332] rounded-lg border border-gray-800 w-full max-w-5xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Version History</h2>
            <p className="text-sm text-gray-400 mt-1">{screenName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-[#0f1c2e] rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Version List */}
          <div className="w-80 border-r border-gray-800 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : versions.length === 0 ? (
              <div className="text-center py-12 px-4">
                <p className="text-gray-400">No version history available</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-800">
                {versions.map((v) => (
                  <div
                    key={v.version}
                    className={`p-4 cursor-pointer transition-colors ${
                      selectedVersion === v.version
                        ? 'bg-blue-500/10 border-l-4 border-blue-500'
                        : 'hover:bg-[#0f1c2e]'
                    }`}
                    onClick={() => handleViewVersion(v.version)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm text-blue-400">v{v.version}</span>
                        {v.isCurrent && (
                          <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">
                            Current
                          </span>
                        )}
                      </div>
                      {loadingVersion === v.version && (
                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mb-1">{formatDate(v.createdAt)}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(v.fileSize)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Version Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {selectedVersion ? (
              <>
                <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white">Version {selectedVersion}</h3>
                    <p className="text-sm text-gray-400 mt-1">JSON Content Preview</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleLoadVersion}
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      Load in Editor
                    </button>
                    {!versions.find(v => v.version === selectedVersion)?.isCurrent && (
                      <button
                        onClick={() => handleRollback(selectedVersion)}
                        disabled={rolling}
                        className="px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border border-yellow-500/50 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                      >
                        {rolling ? 'Rolling back...' : 'Rollback'}
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex-1 overflow-auto p-6 bg-[#0f1c2e]">
                  <pre className="text-gray-300 text-sm font-mono whitespace-pre-wrap break-words">
                    {viewingJson || 'Loading...'}
                  </pre>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p>Select a version to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
