import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAppStore } from '../store/appStore'
import { appAPI } from '../services/api'
import CreateAppModal from '../components/CreateAppModal'

export default function ProjectsPage() {
  const { apps, setApps, setLoading, loading, error, setError } = useAppStore()
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    fetchApps()
  }, [])

  const fetchApps = async () => {
    setLoading(true)
    try {
      const response = await appAPI.getAll()
      const appsData = response.data?.data?.apps || response.data?.data || []
      setApps(Array.isArray(appsData) ? appsData : [])
      setError(null)
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to fetch apps')
    } finally {
      setLoading(false)
    }
  }

  const timeAgo = (dateString) => {
    if (!dateString) return 'Just now'

    const date = new Date(dateString)
    if (Number.isNaN(date.getTime())) return 'Just now'

    const diffMs = Date.now() - date.getTime()
    const diffMinutes = Math.floor(diffMs / (1000 * 60))

    if (diffMinutes < 1) return 'Just now'
    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`

    const diffHours = Math.floor(diffMinutes / 60)
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`

    const diffDays = Math.floor(diffHours / 24)
    if (diffDays < 30) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`

    const diffMonths = Math.floor(diffDays / 30)
    if (diffMonths < 12) return `${diffMonths} month${diffMonths === 1 ? '' : 's'} ago`

    const diffYears = Math.floor(diffMonths / 12)
    return `${diffYears} year${diffYears === 1 ? '' : 's'} ago`
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Workspace</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">Projects</h1>
          <p className="mt-2 text-sm text-gray-400">Manage bundle IDs, track activity, and jump into screen editing.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-6 py-2.5 bg-[#1A73E8] hover:bg-[#1765cc] text-white font-medium rounded-xl transition-colors shadow-lg shadow-blue-900/40"
        >
          + Create New
        </button>
      </div>

      <div className="ketoy-card-surface-soft rounded-2xl shadow-lg p-6">
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-[#1A73E8] border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-400">Loading projects...</p>
          </div>
        )}

        {/* Apps List */}
        {!loading && (
          <div className="ketoy-card-surface rounded-xl overflow-hidden">
            <div className="ketoy-card-content">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-[#0f1c2e] border-b border-white/10">
              <div className="col-span-4 text-sm font-medium text-gray-400 uppercase">Name</div>
              <div className="col-span-4 text-sm font-medium text-gray-400 uppercase">BUNDLE ID</div>
              <div className="col-span-4 text-sm font-medium text-gray-400 uppercase">Recent Activity</div>
            </div>

            {/* Table Body */}
            {apps.length === 0 ? (
              <div className="px-6 py-12 text-center text-gray-400">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <p className="text-lg">No projects yet</p>
                <p className="mt-2 text-sm">Create your first project to get started</p>
              </div>
            ) : (
              apps.map((app) => (
                <Link
                  key={app.id || app._id}
                  to={`/projects/${app.packageName}`}
                  className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-[rgba(255,255,255,0.04)] border-b border-white/10 last:border-b-0 transition-colors group cursor-pointer focus:outline-none"
                >
                  <div className="col-span-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#0f1c2e] group-hover:bg-[#15233a] rounded-lg flex items-center justify-center border border-white/10 transition-colors">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                    </div>
                    <span className="text-white font-medium select-none">{app.appName}</span>
                  </div>
                  <div className="col-span-4 flex items-center text-blue-100/80 font-mono text-sm select-none">
                    {app.packageName || '-'}
                  </div>
                  <div className="col-span-3 flex items-center text-gray-400 select-none">
                    {timeAgo(app.updatedAt || app.createdAt)}
                  </div>
                  <div className="col-span-1 flex items-center justify-end">
                    <svg className="w-5 h-5 text-gray-500 group-hover:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              ))
            )}
            </div>
          </div>
        )}
      </div>

      {/* Create App Modal */}
      {isModalOpen && (
        <CreateAppModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)}
          onSuccess={fetchApps}
        />
      )}
    </div>
  )
}
