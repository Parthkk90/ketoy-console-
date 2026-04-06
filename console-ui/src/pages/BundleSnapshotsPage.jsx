import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { bundleAPI } from '../services/api'
import { formatDateTime, mapApiErrorMessage } from '../services/ktwUtils'

export default function BundleSnapshotsPage() {
  const { packageName } = useParams()
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [items, setItems] = useState([])
  const [nextToken, setNextToken] = useState('')
  const [loadingMore, setLoadingMore] = useState(false)
  const [selectedSnapshotId, setSelectedSnapshotId] = useState(searchParams.get('snapshotId') || '')
  const [detail, setDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [promoting, setPromoting] = useState(false)
  const [showPromoteConfirm, setShowPromoteConfirm] = useState(false)
  const [promoteBump, setPromoteBump] = useState('major')
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchList()
  }, [packageName])

  useEffect(() => {
    if (!selectedSnapshotId) {
      setDetail(null)
      return
    }

    fetchDetail(selectedSnapshotId)
  }, [selectedSnapshotId])

  const fetchList = async (token = '', append = false) => {
    if (append) setLoadingMore(true)
    else setLoading(true)

    try {
      const response = await bundleAPI.getAll(packageName, token ? { nextToken: token } : {})
      const payload = response.data?.data || {}
      const incoming = Array.isArray(payload.items) ? payload.items : []
      setItems((prev) => (append ? [...prev, ...incoming] : incoming))
      setNextToken(payload.nextToken || '')
      setError('')
    } catch (err) {
      setError(mapApiErrorMessage(err, 'Failed to fetch bundle snapshots'))
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const fetchDetail = async (snapshotId) => {
    setDetailLoading(true)
    setError('')

    try {
      const response = await bundleAPI.getDetails(packageName, snapshotId)
      setDetail(response.data?.data || null)
    } catch (err) {
      setError(mapApiErrorMessage(err, 'Failed to fetch snapshot detail'))
    } finally {
      setDetailLoading(false)
    }
  }

  const handlePromote = async () => {
    if (!selectedSnapshotId) return

    setPromoting(true)
    setMessage('')
    setError('')

    try {
      const response = await bundleAPI.promote(packageName, selectedSnapshotId, promoteBump)
      const data = response.data?.data || {}
      const bundleVersion = data.bundleVersion
      const screenResults = Array.isArray(data.results) ? data.results.filter((item) => item?.ok).map((item) => `${item.screenId}:${item.version || '-'}`) : []
      const versionsLine = screenResults.length > 0 ? ` Screens: ${screenResults.join(', ')}` : ''
      setMessage(bundleVersion ? `Snapshot promoted. Bundle version ${bundleVersion}.${versionsLine}` : 'Snapshot promoted successfully.')
      await fetchDetail(selectedSnapshotId)
      await fetchList()
    } catch (err) {
      setError(mapApiErrorMessage(err, 'Failed to promote snapshot'))
    } finally {
      setPromoting(false)
      setShowPromoteConfirm(false)
    }
  }

  const manifestRows = useMemo(() => {
    if (!detail?.screens || typeof detail.screens !== 'object') return []
    return Object.entries(detail.screens)
  }, [detail])

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-2 text-sm mb-6">
        <Link to="/projects" className="text-gray-400 hover:text-white hover:underline">Projects</Link>
        <span className="text-gray-600">/</span>
        <Link to={`/projects/${packageName}`} className="text-gray-400 hover:text-white hover:underline">{packageName}</Link>
        <span className="text-gray-600">/</span>
        <span className="text-white">Bundles</span>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-4">
        <section className="rounded-2xl border border-white/10 bg-[#121d2f] p-4">
          <h1 className="text-xl font-semibold text-white">Bundle Snapshots</h1>
          <p className="text-xs text-gray-400 mt-1">Review uploaded snapshots for this app.</p>

          {error && (
            <div className="mt-3 p-3 rounded-lg border border-red-500/40 bg-red-500/10 text-sm text-red-300">
              {error}
            </div>
          )}

          {loading ? (
            <div className="py-10 text-center text-gray-400">Loading snapshots...</div>
          ) : items.length === 0 ? (
            <div className="py-10 text-center text-gray-400">No snapshots found.</div>
          ) : (
            <div className="mt-4 overflow-hidden rounded-xl border border-white/10">
              <table className="w-full text-sm">
                <thead className="bg-[#0f1c2e] text-gray-300">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium">bundleVersion</th>
                    <th className="text-left px-3 py-2 font-medium">updatedAt</th>
                    <th className="text-left px-3 py-2 font-medium">screens</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {items.map((snapshot) => (
                    <tr
                      key={snapshot.snapshotId}
                      onClick={() => setSelectedSnapshotId(snapshot.snapshotId)}
                      className={`cursor-pointer ${selectedSnapshotId === snapshot.snapshotId ? 'bg-blue-500/15' : 'bg-[#111a2a] hover:bg-[#15233a]'}`}
                    >
                      <td className="px-3 py-2 font-mono text-blue-300">{snapshot.bundleVersion || '—'}</td>
                      <td className="px-3 py-2 text-gray-300">{formatDateTime(snapshot.uploadedAt || snapshot.updatedAt)}</td>
                      <td className="px-3 py-2 text-gray-300">{snapshot.screenCount || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && nextToken && (
            <button
              type="button"
              onClick={() => fetchList(nextToken, true)}
              disabled={loadingMore}
              className="btn-ketoy btn-ketoy-primary mt-4"
            >
              {loadingMore ? 'Loading...' : 'Load more'}
            </button>
          )}
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#121d2f] p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-white">Snapshot Detail</h2>
              <p className="text-xs text-gray-400 mt-1">Inspect manifest and promote a selected snapshot.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowPromoteConfirm(true)}
              disabled={!selectedSnapshotId || promoting}
              className="btn-ketoy btn-ketoy-amber !text-xs disabled:opacity-50"
            >
              {promoting ? 'Promoting...' : 'Promote'}
            </button>
          </div>

          {message && (
            <div className="mt-3 p-3 rounded-lg border border-green-500/40 bg-green-500/10 text-sm text-green-300">
              {message}
            </div>
          )}

          {!selectedSnapshotId ? (
            <div className="py-10 text-center text-gray-400">Select a snapshot to view manifest.</div>
          ) : detailLoading ? (
            <div className="py-10 text-center text-gray-400">Loading detail...</div>
          ) : !detail ? (
            <div className="py-10 text-center text-gray-400">Snapshot detail unavailable.</div>
          ) : (
            <div className="mt-4 space-y-3">
              <div className="text-xs text-gray-400">snapshotId: <span className="text-gray-200 font-mono">{detail.snapshotId}</span></div>
              <div className="text-xs text-gray-400">bundleVersion: <span className="text-blue-300 font-mono">{detail.bundleVersion || '—'}</span></div>
              <div className="text-xs text-gray-400">uploadedAt: <span className="text-gray-200">{formatDateTime(detail.uploadedAt || detail.updatedAt)}</span></div>
              <div className="text-xs text-gray-400">uploadedBy: <span className="text-gray-200">{detail.uploadedBy || '-'}</span></div>
              <div className="text-xs text-gray-400">type: <span className="text-gray-200 uppercase">{detail.type || '-'}</span></div>

              <div className="overflow-hidden rounded-xl border border-white/10">
                <table className="w-full text-xs">
                  <thead className="bg-[#0f1c2e] text-gray-300">
                    <tr>
                      <th className="text-left px-3 py-2 font-medium">screenId</th>
                      <th className="text-left px-3 py-2 font-medium">version</th>
                      <th className="text-left px-3 py-2 font-medium">size</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {manifestRows.map(([screenId, meta]) => (
                      <tr key={screenId} className="bg-[#111a2a]">
                        <td className="px-3 py-2 text-gray-100 font-mono">{screenId}</td>
                        <td className="px-3 py-2 text-blue-300 font-mono">{meta?.version || '—'}</td>
                        <td className="px-3 py-2 text-gray-300">{meta?.ktwSizeBytes ?? '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </div>

      {showPromoteConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-[#111b2b] rounded-2xl max-w-md w-full p-6 border border-amber-500/40 shadow-2xl shadow-black/40">
            <h2 className="text-xl font-bold text-white mb-4">Promote snapshot?</h2>
            <p className="text-gray-300 mb-6">
              This will make all screens in the selected snapshot live simultaneously.
            </p>
            <div className="mb-5">
              <label className="block text-xs text-gray-400 mb-1">Version bump</label>
              <select
                value={promoteBump}
                onChange={(event) => setPromoteBump(event.target.value)}
                className="w-full bg-[#0f1c2e] border border-gray-700 rounded-md px-3 py-2 text-sm text-white"
              >
                <option value="major">Major</option>
                <option value="minor">Minor</option>
                <option value="patch">Patch</option>
              </select>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowPromoteConfirm(false)}
                disabled={promoting}
                className="btn-ketoy btn-ketoy-secondary flex-1 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={handlePromote}
                disabled={promoting}
                className="btn-ketoy btn-ketoy-amber flex-1 disabled:opacity-60"
              >
                {promoting ? 'Promoting...' : 'Confirm Promote'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
