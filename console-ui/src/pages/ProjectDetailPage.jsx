import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAppStore } from '../store/appStore'
import { useScreenStore } from '../store/screenStore'
import { appAPI, bundleAPI, screenAPI } from '../services/api'
import BundleSnapshotModal from '../components/BundleSnapshotModal'
import CreateScreenModal from '../components/CreateScreenModal'
import VersionHistoryModal from '../components/VersionHistoryModal'
import { API_ERROR_MESSAGES, fileToBase64, formatDateTime, formatKtwSizeKb, isFreeTierApp, mapApiErrorMessage, prepareKtwUploadBinary, validateKtwFile, validateVersionCode } from '../services/ktwUtils'

const DetailStat = ({ label, value, accent }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</span>
    <span style={{ fontSize: 22, fontWeight: 600, color: accent ? '#60a5fa' : '#fff', letterSpacing: '-0.02em' }}>{value}</span>
  </div>
)

export default function ProjectDetailPage() {
  const { packageName } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { currentApp, setCurrentApp } = useAppStore()
  const { screens, setScreens } = useScreenStore()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [nextToken, setNextToken] = useState(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [snapshots, setSnapshots] = useState([])
  const [snapshotsError, setSnapshotsError] = useState(null)
  const [snapshotsLoading, setSnapshotsLoading] = useState(false)
  const [snapshotsNextToken, setSnapshotsNextToken] = useState(null)
  const [loadingMoreSnapshots, setLoadingMoreSnapshots] = useState(false)
  const [selectedSnapshotId, setSelectedSnapshotId] = useState('')
  const [promotingSnapshotId, setPromotingSnapshotId] = useState('')
  const [confirmPromoteSnapshotId, setConfirmPromoteSnapshotId] = useState('')
  const [promoteMessage, setPromoteMessage] = useState('')
  const [promoteError, setPromoteError] = useState('')
  const [snapshotSectionPulse, setSnapshotSectionPulse] = useState(false)
  const [search, setSearch] = useState('')
  const [historyScreenId, setHistoryScreenId] = useState('')
  const [bundleFiles, setBundleFiles] = useState([])
  const [bundleVersion, setBundleVersion] = useState('')
  const [bundleUploadError, setBundleUploadError] = useState('')
  const [bundleUploadMessage, setBundleUploadMessage] = useState('')
  const [bundleUploadResults, setBundleUploadResults] = useState([])
  const [bundleUploading, setBundleUploading] = useState(false)
  const [promoteNewVersion, setPromoteNewVersion] = useState('')
  const [screenPendingDelete, setScreenPendingDelete] = useState('')
  const [screenDeleting, setScreenDeleting] = useState(false)
  const [bundleUploadResult] = useState(location.state?.bundleUploadResult || null)
  const [verificationData, setVerificationData] = useState(null)
  const [verificationLoading, setVerificationLoading] = useState(false)
  const [checkingVerification, setCheckingVerification] = useState(false)
  const [verificationReason, setVerificationReason] = useState('')
  const [verificationError, setVerificationError] = useState('')
  const [verificationToast, setVerificationToast] = useState('')

  const bundleUploadData = (() => {
    const payload = bundleUploadResult?.data?.data || bundleUploadResult?.data || bundleUploadResult
    return payload && typeof payload === 'object' ? payload : null
  })()

  const processedCount = Number(bundleUploadData?.processed ?? 0)
  const succeededCount = Number(bundleUploadData?.succeeded ?? 0)
  const failedCount = Number(bundleUploadData?.failed ?? 0)
  const isBundleAllSucceeded = Boolean(bundleUploadData) && processedCount > 0 && succeededCount === processedCount
  const hasBundleFailures = Boolean(bundleUploadData) && failedCount > 0

  useEffect(() => {
    fetchAppDetails()
    fetchScreens()
    fetchSnapshots()
  }, [packageName])

  useEffect(() => {
    if (!bundleUploadData) return
    fetchScreens()
    fetchSnapshots()
  }, [bundleUploadData?.snapshotId, bundleUploadData?.updatedAt, packageName])

  const timeAgo = (dateString) => {
    if (!dateString) return 'just now'

    const date = new Date(dateString)
    if (Number.isNaN(date.getTime())) return 'just now'

    const diffMs = Date.now() - date.getTime()
    const diffMinutes = Math.floor(diffMs / (1000 * 60))

    if (diffMinutes < 1) return 'just now'
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

  const getUpdatedByEmail = (screen) => {
    const updatedBy = screen?.updatedBy
    if (!updatedBy) return 'unknown'

    if (typeof updatedBy === 'string') return updatedBy
    return updatedBy.email || updatedBy.username || 'unknown'
  }

  const fetchAppDetails = async () => {
    try {
      const response = await appAPI.getDetails(packageName)
      const appData = response.data?.data?.app || response.data?.data || response.data
      setCurrentApp(appData)
    } catch (err) {
      setError(mapApiErrorMessage(err, 'Failed to fetch app details'))
    }
  }

  const showVerificationToast = (message) => {
    setVerificationToast(message)
    window.setTimeout(() => setVerificationToast(''), 2500)
  }

  const handleCopyToClipboard = async (value) => {
    if (!value) return
    try {
      await navigator.clipboard.writeText(value)
      showVerificationToast('Copied to clipboard')
    } catch {
      setVerificationError('Failed to copy. Please copy manually.')
    }
  }

  const handleRequestVerification = async () => {
    setVerificationLoading(true)
    setVerificationError('')
    setVerificationReason('')

    try {
      const response = await appAPI.requestVerification(packageName)
      const payload = response.data?.data || {}
      setVerificationData(payload)
    } catch (err) {
      setVerificationData(null)
      setVerificationError(mapApiErrorMessage(err, 'Failed to request DNS verification token'))
    } finally {
      setVerificationLoading(false)
    }
  }

  const handleCheckVerification = async () => {
    setCheckingVerification(true)
    setVerificationError('')

    try {
      const response = await appAPI.checkVerification(packageName)
      const payload = response.data?.data || {}

      if (payload.verified) {
        const verifiedDomain = payload.dnsTarget || verificationData?.txtRecord?.host || currentApp?.verifiedDomain || ''
        setCurrentApp({
          ...(currentApp || {}),
          domainVerified: true,
          verifiedDomain,
          verifiedAt: payload.verifiedAt || currentApp?.verifiedAt
        })
        setVerificationData(null)
        setVerificationReason('')
        showVerificationToast('Namespace locked to your account')
        return
      }

      setVerificationReason(payload.reason || 'DNS record not found yet. Please try again.')
    } catch (err) {
      const errorCode = err?.response?.data?.error?.code
      setVerificationError(mapApiErrorMessage(err, 'Failed to check DNS verification'))

      if (errorCode === 'NO_PENDING_VERIFICATION' || errorCode === 'TOKEN_EXPIRED') {
        setVerificationData(null)
        setVerificationReason('')
      }
    } finally {
      setCheckingVerification(false)
    }
  }

  const fetchScreens = async ({ append = false, token = null } = {}) => {
    if (append) {
      setLoadingMore(true)
    } else {
      setLoading(true)
    }

    try {
      const response = await screenAPI.getAll(packageName, token ? { nextToken: token } : {})
      const payload = response.data?.data
      const items = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.items)
          ? payload.items
          : []
      const incomingScreens = Array.isArray(items) ? items : []

      if (append) {
        setScreens([...screens, ...incomingScreens])
      } else {
        setScreens(incomingScreens)
      }

      setNextToken(Array.isArray(payload) ? null : payload?.nextToken || null)
      setError(null)
    } catch (err) {
      setError(mapApiErrorMessage(err, 'Failed to fetch screens'))
    } finally {
      if (append) {
        setLoadingMore(false)
      } else {
        setLoading(false)
      }
    }
  }

  const fetchSnapshots = async ({ append = false, token = null } = {}) => {
    if (append) {
      setLoadingMoreSnapshots(true)
    } else {
      setSnapshotsLoading(true)
    }

    try {
      const response = await bundleAPI.getAll(packageName, token ? { nextToken: token } : {})
      const payload = response.data?.data || {}
      const incoming = Array.isArray(payload.items) ? payload.items : []

      setSnapshots((prev) => (append ? [...prev, ...incoming] : incoming))
      setSnapshotsNextToken(payload.nextToken || null)
      setSnapshotsError(null)
    } catch (err) {
      const status = err?.response?.status
      // If bundles API is not deployed in this environment yet, keep section usable with empty state.
      if (status === 404 || status === 501) {
        setSnapshots([])
        setSnapshotsNextToken(null)
        setSnapshotsError(null)
      } else {
        setSnapshotsError(mapApiErrorMessage(err, 'Failed to fetch bundle snapshots'))
      }
    } finally {
      if (append) {
        setLoadingMoreSnapshots(false)
      } else {
        setSnapshotsLoading(false)
      }
    }
  }

  const handleLoadMore = () => {
    if (!nextToken || loadingMore) return
    fetchScreens({ append: true, token: nextToken })
  }

  const handleLoadMoreSnapshots = () => {
    if (!snapshotsNextToken || loadingMoreSnapshots) return
    fetchSnapshots({ append: true, token: snapshotsNextToken })
  }

  const formatBytes = (bytes) => {
    if (bytes == null) return null
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const handleDeleteApp = async () => {
    try {
      await appAPI.delete(packageName)
      navigate('/projects')
    } catch (err) {
      setError(mapApiErrorMessage(err, 'Failed to delete app'))
    }
  }

  const handleDeleteScreen = async () => {
    if (!screenPendingDelete) return

    setScreenDeleting(true)
    try {
      await screenAPI.delete(packageName, screenPendingDelete)
      setScreenPendingDelete('')
      await fetchScreens()
    } catch (err) {
      setError(mapApiErrorMessage(err, 'Failed to delete screen'))
    } finally {
      setScreenDeleting(false)
    }
  }

  const handlePromoteSnapshot = async (snapshot) => {
    const normalizedVersion = String(promoteNewVersion || '').trim()
    const validationError = validateVersionCode(normalizedVersion)
    if (validationError) {
      setPromoteError(validationError)
      return
    }

    setPromotingSnapshotId(snapshot.snapshotId)
    setPromoteError('')
    setPromoteMessage('')

    try {
      const detailResponse = await bundleAPI.getDetails(packageName, snapshot.snapshotId)
      const detail = detailResponse.data?.data || {}
      const screenIds = Object.keys(detail.screens || {})

      if (screenIds.length === 0) {
        setPromoteError('No screens found in this snapshot. Cannot promote.')
        return
      }

      const response = await bundleAPI.promote(packageName, snapshot.snapshotId, normalizedVersion, screenIds)
      const data = response.data?.data || {}
      const promotedBundleVersion = data.newBundleVersion || data.bundleVersion || normalizedVersion
      const screenResults = Array.isArray(data.results)
        ? data.results.filter((item) => item?.ok).map((item) => `${item.screenId}:${item.newVersion || item.version || '-'}`)
        : []
      const versionsLine = screenResults.length > 0 ? ` Screens: ${screenResults.join(', ')}` : ''
      setPromoteMessage(promotedBundleVersion ? `Promoted successfully. Bundle version ${promotedBundleVersion}.${versionsLine}` : 'Promoted successfully.')
      setConfirmPromoteSnapshotId('')
      setPromoteNewVersion('')
      await fetchScreens()
      await fetchSnapshots()
    } catch (err) {
      const status = err?.response?.status
      const errorCode = err?.response?.data?.error?.code
      if (status === 409 || errorCode === 'VERSION_TAKEN') {
        setPromoteError(mapApiErrorMessage(err, API_ERROR_MESSAGES.VERSION_TAKEN))
      } else {
        setPromoteError(mapApiErrorMessage(err, 'Failed to promote snapshot'))
      }
    } finally {
      setPromotingSnapshotId('')
    }
  }

  const handleBundleFilesChange = (event) => {
    setBundleUploadMessage('')
    setBundleUploadError('')
    setBundleFiles(Array.from(event.target.files || []))
  }

  const normalizeScreenId = (fileName) => {
    return fileName.replace(/\.ktw$/i, '').trim()
  }

  const handleBundleUpload = async () => {
    if (bundleFiles.length === 0) {
      setBundleUploadError('Select one or more .ktw files to upload.')
      return
    }

    if (bundleFiles.length > 50) {
      setBundleUploadError('Bundle exceeds 50 screens')
      return
    }

    const normalizedBundleVersion = String(bundleVersion || '').trim()
    const versionValidationError = validateVersionCode(normalizedBundleVersion)
    if (versionValidationError) {
      setBundleUploadError(versionValidationError)
      return
    }

    setBundleUploading(true)
    setBundleUploadMessage('')
    setBundleUploadResults([])
    setBundleUploadError('')

    try {
      const payload = []
      for (const file of bundleFiles) {
        const screenId = normalizeScreenId(file.name)
        if (!screenId) {
          throw new Error(`Invalid file name: ${file.name}`)
        }

        const validationError = await validateKtwFile(file)
        if (validationError) {
          throw new Error(`${file.name}: ${validationError}`)
        }

        const { binary } = await prepareKtwUploadBinary(file)
        const ktw = await fileToBase64(binary)
        payload.push({ screenId, ktw })
      }

      const response = await screenAPI.uploadBundleKtw(packageName, payload, normalizedBundleVersion)
      const data = response.data?.data || {}
      const snapshotId = data.snapshotId
      const uploadedBundleVersion = data.bundleVersion || normalizedBundleVersion
      setBundleUploadResults(Array.isArray(data.results) ? data.results : [])
      setBundleUploadMessage(uploadedBundleVersion
        ? `Bundle uploaded successfully. Bundle version ${uploadedBundleVersion}${snapshotId ? ` · Snapshot ${snapshotId}` : ''}`
        : 'Bundle uploaded successfully.')

      await fetchScreens()
      await fetchSnapshots()
    } catch (err) {
      setBundleUploadError(mapApiErrorMessage(err, 'Failed to upload bundle'))
    } finally {
      setBundleUploading(false)
    }
  }

  const formatSnapshotId = (snapshotId) => {
    if (!snapshotId) return '-'
    return `${snapshotId.slice(0, 8)}...`
  }

  const getSnapshotVersionLabel = (snapshot, index) => {
    const explicitVersion = snapshot?.version || snapshot?.bundleVersion || snapshot?.versionLabel
    if (explicitVersion) return String(explicitVersion)
    return `v${index + 1}`
  }

  const totalScreens = screens.length
  const totalSnapshots = snapshots.length
  const appBundleId = currentApp?.bundleId || currentApp?.packageName || packageName
  const freeTierApp = isFreeTierApp(appBundleId)
  const latestActivity = screens.length > 0
    ? timeAgo(screens[0]?.updatedAt || screens[0]?.createdAt)
    : 'No updates yet'
  const filteredScreens = screens.filter((s) => {
    const name = (s.displayName || s.screenName || '').toLowerCase()
    const id = (s.screenId || '').toLowerCase()
    const query = search.toLowerCase()
    return name.includes(query) || id.includes(query)
  })

  return (
    <>
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .pd-fade { animation: fadeSlideUp 0.35s cubic-bezier(0.22,1,0.36,1) both; }
        .pd-fade-1 { animation-delay: 0ms; }
        .pd-fade-2 { animation-delay: 60ms; }
        .pd-fade-3 { animation-delay: 110ms; }
        .pd-fade-4 { animation-delay: 150ms; }

        .pd-search {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          padding: 9px 14px 9px 38px;
          color: #fff;
          font-size: 13px;
          outline: none;
          width: 280px;
          transition: border-color 0.18s, box-shadow 0.18s;
        }
        .pd-search::placeholder { color: rgba(255,255,255,0.3); }
        .pd-search:focus {
          border-color: rgba(26,115,232,0.5);
          box-shadow: 0 0 0 3px rgba(26,115,232,0.1);
        }
      `}</style>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm mb-6 pd-fade pd-fade-1">
        <Link to="/projects" className="text-gray-400 hover:text-white hover:underline">
          App
        </Link>
        <span className="text-gray-600">/</span>
        <span className="text-white">{currentApp?.appName || packageName}</span>
      </div>

      {/* Header */}
      <div className="pd-fade pd-fade-1" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, gap: 16 }}>
        <div>
          <p style={{ fontSize: 12, letterSpacing: '0.16em', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', marginBottom: 6 }}>
            App Workspace
          </p>
          <h1 style={{ fontSize: 26, fontWeight: 600, color: '#fff', letterSpacing: '-0.02em', margin: 0 }}>
            {currentApp?.appName || packageName}
          </h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 6, marginBottom: 0, fontFamily: 'monospace' }}>
            {currentApp?.packageName || packageName}
          </p>
          {currentApp?.description && (
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.38)', marginTop: 8, marginBottom: 0, maxWidth: 560 }}>
              {currentApp.description}
            </p>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setIsModalOpen(true)}
            title="Add a new SDUI screen to this app"
            className="btn-ketoy btn-ketoy-primary"
          >
            + Add Screen
          </button>
          <Link
            to={`/projects/${packageName}/bundles`}
            className="btn-ketoy btn-ketoy-secondary"
          >
            Bundle Snapshots
          </Link>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="btn-ketoy btn-ketoy-danger"
          >
            Delete App
          </button>
        </div>
      </div>

      <div className="pd-fade pd-fade-2" style={{ display: 'flex', gap: 32, marginBottom: 28, padding: '16px 20px', background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.07)' }}>
        <DetailStat label="Screens" value={totalScreens} accent />
        <div style={{ width: 1, background: 'rgba(255,255,255,0.08)' }} />
        <DetailStat label="Bundle Versions" value={totalSnapshots} />
        <div style={{ width: 1, background: 'rgba(255,255,255,0.08)' }} />
        <DetailStat label="Last Activity" value={latestActivity} />
      </div>

      <section className="pd-fade pd-fade-2" style={{ marginBottom: 22 }}>
        <div className="ketoy-card-surface-soft rounded-xl p-4" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ color: '#fff', fontSize: 16, fontWeight: 600, margin: 0 }}>Verify Domain</h2>
              <p style={{ color: 'rgba(255,255,255,0.55)', margin: '4px 0 0', fontSize: 13 }}>
                Lock this namespace to your account using DNS TXT verification.
              </p>
            </div>

            {freeTierApp ? (
              <span style={{ padding: '5px 10px', borderRadius: 999, background: 'rgba(148,163,184,0.15)', border: '1px solid rgba(148,163,184,0.35)', color: '#cbd5e1', fontSize: 12, fontWeight: 600 }}>
                Free tier - dev.ketoy namespace
              </span>
            ) : currentApp?.domainVerified ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ padding: '5px 10px', borderRadius: 999, background: 'rgba(22,163,74,0.2)', border: '1px solid rgba(22,163,74,0.5)', color: '#86efac', fontSize: 12, fontWeight: 600 }}>
                  Namespace Verified
                </span>
                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontFamily: 'monospace' }}>
                  {currentApp?.verifiedDomain || 'Verified'}
                </span>
              </div>
            ) : (
              !verificationData && (
                <button
                  type="button"
                  onClick={handleRequestVerification}
                  disabled={verificationLoading}
                  className="btn-ketoy btn-ketoy-primary"
                >
                  {verificationLoading ? 'Requesting...' : 'Verify Domain'}
                </button>
              )
            )}
          </div>

          {freeTierApp && (
            <p style={{ marginTop: 12, color: 'rgba(255,255,255,0.68)', fontSize: 13 }}>
              Screens can be uploaded directly. Domain verification is not available for dev.ketoy apps.
            </p>
          )}

          {!freeTierApp && !currentApp?.domainVerified && !verificationData && (
            <p style={{ marginTop: 12, color: 'rgba(255,255,255,0.58)', fontSize: 12 }}>
              Optional - you can upload screens without verifying. Verification permanently locks this namespace to your account.
            </p>
          )}

          {!freeTierApp && verificationError && (
            <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/40 text-red-300 text-sm">
              {verificationError}
            </div>
          )}

          {!freeTierApp && !currentApp?.domainVerified && verificationData && (
            <div style={{ marginTop: 14, border: '1px solid rgba(59,130,246,0.35)', background: 'rgba(59,130,246,0.08)', borderRadius: 12, padding: 14 }}>
              <p style={{ margin: 0, color: '#dbeafe', fontSize: 13 }}>Add a TXT record to your DNS provider:</p>

              <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', minWidth: 48 }}>Host:</span>
                  <span style={{ fontFamily: 'monospace', color: '#fff', fontSize: 12 }}>{verificationData?.txtRecord?.host || '-'}</span>
                  <button type="button" onClick={() => handleCopyToClipboard(verificationData?.txtRecord?.host)} className="btn-ketoy btn-ketoy-secondary !text-xs !px-2 !py-1">Copy</button>
                </div>

                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', minWidth: 48 }}>Type:</span>
                  <span style={{ fontFamily: 'monospace', color: '#fff', fontSize: 12 }}>TXT</span>
                </div>

                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', minWidth: 48 }}>Value:</span>
                  <span style={{ fontFamily: 'monospace', color: '#fff', fontSize: 12 }}>{verificationData?.txtRecord?.value || '-'}</span>
                  <button type="button" onClick={() => handleCopyToClipboard(verificationData?.txtRecord?.value)} className="btn-ketoy btn-ketoy-secondary !text-xs !px-2 !py-1">Copy</button>
                </div>
              </div>

              <p style={{ margin: '10px 0 0', color: 'rgba(219,234,254,0.8)', fontSize: 12 }}>
                Token expires at {formatDateTime(verificationData?.expiresAt)}
              </p>

              {verificationReason && (
                <div className="mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/40 text-amber-200 text-sm">
                  {verificationReason}
                </div>
              )}

              <div style={{ marginTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleCheckVerification}
                  disabled={checkingVerification}
                  className="btn-ketoy btn-ketoy-primary"
                >
                  {checkingVerification ? 'Checking...' : 'Check Verification'}
                </button>
                {verificationReason && (
                  <button
                    type="button"
                    onClick={handleCheckVerification}
                    disabled={checkingVerification}
                    className="btn-ketoy btn-ketoy-secondary"
                  >
                    Try Again
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      <div className="pd-fade pd-fade-3" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <div style={{ position: 'relative' }}>
          <svg
            style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search screens..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pd-search"
          />
        </div>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginLeft: 'auto' }}>
          {filteredScreens.length} screen{filteredScreens.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 pd-fade pd-fade-3">
          {error}
        </div>
      )}

      {bundleUploadData && (
        <div className={`mb-6 p-4 rounded-lg border ${isBundleAllSucceeded ? 'bg-green-500/10 border-green-500/40 text-green-300' : 'bg-yellow-500/10 border-yellow-500/40 text-yellow-200'}`}>
          {isBundleAllSucceeded ? (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="font-medium">All {processedCount} screens uploaded successfully.</p>
                {bundleUploadData?.snapshotId && (
                  <p className="text-xs text-green-200/80 mt-1">Version created: {String(bundleUploadData.snapshotId).slice(0, 8)}...</p>
                )}
              </div>
              {bundleUploadData?.snapshotId && (
                <button
                  type="button"
                  onClick={() => {
                    document.getElementById('bundle-snapshots-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    setSnapshotSectionPulse(true)
                    setTimeout(() => setSnapshotSectionPulse(false), 1200)
                  }}
                  className="px-3 py-2 rounded-lg bg-green-500/20 hover:bg-green-500/30 border border-green-400/40 text-sm font-medium"
                >
                  View version
                </button>
              )}
            </div>
          ) : (
            <div>
              <p className="font-medium">{succeededCount} of {processedCount} screens uploaded.</p>
              <p className="text-xs text-yellow-100/80 mt-1">{failedCount} failed - check individual results below.</p>
            </div>
          )}

          {hasBundleFailures && Array.isArray(bundleUploadData?.results) && (
            <div className="mt-4 overflow-hidden rounded-lg border border-yellow-500/30">
              <table className="w-full text-xs">
                <thead className="bg-yellow-500/10 text-yellow-200">
                  <tr>
                    <th className="text-left px-3 py-2">screenId</th>
                    <th className="text-left px-3 py-2">status</th>
                    <th className="text-left px-3 py-2">size / error</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-yellow-500/20">
                  {bundleUploadData.results.map((result, index) => (
                    <tr key={`${result?.screenId || 'screen'}-${index}`} className="bg-[#1a2433]/70">
                      <td className="px-3 py-2 font-mono text-yellow-100">{result?.screenId || '-'}</td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-semibold ${result?.ok ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                          {result?.ok ? 'ok' : 'failed'}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-yellow-100/90">
                        {result?.ok
                          ? (result?.sizeBytes != null
                            ? `${result.sizeBytes} B`
                            : result?.ktwSizeBytes != null
                              ? `${result.ktwSizeBytes} B`
                              : '-')
                          : (result?.error || 'Unknown error')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
        <div className="ketoy-card-surface-soft rounded-2xl p-3 pd-fade pd-fade-4">
          {filteredScreens.length === 0 ? (
            <div className="bg-[#121d2f] rounded-xl border border-white/10 px-4 py-7 text-center">
              <svg className="w-12 h-12 mx-auto mb-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <p className="text-base text-gray-400">{search ? 'No matching screens' : 'No screens yet'}</p>
              <p className="mt-2 text-sm text-gray-500">{search ? 'Try a different search term' : 'Create your first screen to get started'}</p>
            </div>
          ) : (
            <div className="max-h-[360px] overflow-y-auto pr-1 rounded-xl border border-white/10">
              <table className="w-full text-sm">
                <thead className="bg-[#0f1c2e] text-gray-300 sticky top-0">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium">Screen ID</th>
                    <th className="text-left px-4 py-3 font-medium">Version</th>
                    <th className="text-left px-4 py-3 font-medium">KTW Size</th>
                    <th className="text-left px-4 py-3 font-medium">Updated At</th>
                    <th className="text-left px-4 py-3 font-medium">Updated By</th>
                    <th className="text-right px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredScreens.map((screen) => {
                    const screenId = screen.screenId || screen.screenName
                    const normalizedScreenId = String(screenId || '').trim()
                    return (
                      <tr key={normalizedScreenId || screen.id || screen._id} className="bg-[#121d2f]/75 hover:bg-[#15233a] transition-colors">
                        <td className="px-4 py-3 font-mono text-white">{screenId || '-'}</td>
                        <td className="px-4 py-3 text-gray-300 font-mono">{screen.version || '—'}</td>
                        <td className="px-4 py-3 text-gray-300">{formatKtwSizeKb(screen.ktwSizeBytes)}</td>
                        <td className="px-4 py-3 text-gray-300">{formatDateTime(screen.updatedAt || screen.createdAt)}</td>
                        <td className="px-4 py-3 text-gray-300">{getUpdatedByEmail(screen)}</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setHistoryScreenId(normalizedScreenId)}
                              className="btn-ketoy btn-ketoy-secondary !px-2.5 !py-1.5 !text-xs"
                            >
                              History
                            </button>
                            <Link
                              to={`/projects/${encodeURIComponent(packageName)}/screens/${encodeURIComponent(normalizedScreenId)}`}
                              className="btn-ketoy btn-ketoy-primary !px-2.5 !py-1.5 !text-xs"
                            >
                              Open
                            </Link>
                            <button
                              onClick={() => setScreenPendingDelete(normalizedScreenId)}
                              className="btn-ketoy btn-ketoy-danger !px-2.5 !py-1.5 !text-xs"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {!loading && nextToken && screens.length > 0 && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="btn-ketoy btn-ketoy-primary"
          >
            {loadingMore ? 'Loading...' : 'Load more'}
          </button>
        </div>
      )}

      <section id="bundle-snapshots-section" className={`mt-10 transition-all ${snapshotSectionPulse ? 'ring-2 ring-blue-400/70 rounded-2xl' : ''}`}>
        <div className="ketoy-card-surface-soft rounded-2xl p-4">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-semibold text-white">Bundle Versions</h2>
              <p className="text-xs text-gray-500 mt-0.5">Inspect or promote previously uploaded bundle versions.</p>
            </div>
            <Link
              to={`/projects/${packageName}/bundles`}
              className="btn-ketoy btn-ketoy-secondary !text-xs"
            >
              Open Full View
            </Link>
          </div>

          <div className="mb-5">
            <p className="text-sm text-white font-medium mb-0.5">Upload Bundle (.ktw files)</p>
            <p className="text-xs text-gray-500 mb-3">Select up to 50 files. Screen IDs are derived from file names.</p>
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              <label
                htmlFor="bundle-ktw-files"
                className="btn-ketoy btn-ketoy-secondary inline-flex items-center cursor-pointer"
              >
                Choose Files
              </label>
              <span className="text-xs text-gray-400 truncate flex-1">
                {bundleFiles.length > 0
                  ? `${bundleFiles.length} file${bundleFiles.length > 1 ? 's' : ''} selected`
                  : 'No files selected'}
              </span>
              <input
                id="bundle-ktw-files"
                type="file"
                multiple
                onChange={handleBundleFilesChange}
                className="sr-only"
              />
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500 whitespace-nowrap">Bundle Version</label>
                <input
                  type="text"
                  value={bundleVersion}
                  onChange={(event) => {
                    setBundleVersion(event.target.value)
                    setBundleUploadError('')
                  }}
                  placeholder="e.g. 1.0.0"
                  className="bg-[#0f1c2e] border border-gray-700 rounded-md px-2.5 py-1.5 text-sm text-white font-mono"
                />
              </div>
              <button
                type="button"
                onClick={handleBundleUpload}
                disabled={bundleUploading || bundleFiles.length === 0}
                className="btn-ketoy btn-ketoy-primary"
              >
                {bundleUploading ? 'Uploading...' : `Upload Bundle${bundleFiles.length ? ` (${bundleFiles.length})` : ''}`}
              </button>
            </div>
            {bundleUploadError && (
              <p className="mt-3 text-sm text-red-300">{bundleUploadError}</p>
            )}
            {bundleUploadMessage && (
              <p className="mt-3 text-sm text-green-300">{bundleUploadMessage}</p>
            )}
            {bundleUploadResults.length > 0 && (
              <div className="mt-3 overflow-hidden rounded-lg border border-white/10">
                <table className="w-full text-xs">
                  <thead className="bg-[#0f1c2e] text-gray-300">
                    <tr>
                      <th className="text-left px-3 py-2">Screen</th>
                      <th className="text-left px-3 py-2">Status</th>
                      <th className="text-left px-3 py-2">Version</th>
                      <th className="text-left px-3 py-2">Size</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {bundleUploadResults.map((result, index) => (
                      <tr key={`${result?.screenId || 'screen'}-${index}`} className="bg-[#111a2a]">
                        <td className="px-3 py-2 font-mono text-gray-200">{result?.screenId || '-'}</td>
                        <td className="px-3 py-2">{result?.ok ? 'ok' : 'failed'}</td>
                        <td className="px-3 py-2 font-mono text-blue-300">{result?.version || '—'}</td>
                        <td className="px-3 py-2 text-gray-300">{result?.ktwSizeBytes ?? result?.sizeBytes ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '4px 0 16px' }} />

          {promoteMessage && (
            <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/40 text-green-300 text-sm">
              {promoteMessage}
            </div>
          )}

          {promoteError && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/40 text-red-300 text-sm">
              {promoteError}
            </div>
          )}

          {snapshotsError && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/40 text-red-300 text-sm">
              {snapshotsError}
            </div>
          )}

          {snapshotsLoading ? (
            <div className="text-center py-10">
              <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-400 text-sm mt-3">Loading bundle versions...</p>
            </div>
          ) : snapshots.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-[#121d2f] px-4 py-5 text-center">
              <p className="text-gray-300">No bundle versions yet. Use ketoyPushAll or the bundle upload endpoint to create one.</p>
            </div>
          ) : (
            <div className="space-y-3 pr-1">
              {snapshots.map((snapshot, index) => {
                const isConfirming = confirmPromoteSnapshotId === snapshot.snapshotId
                const isPromoting = promotingSnapshotId === snapshot.snapshotId
                const versionLabel = getSnapshotVersionLabel(snapshot, index)

                return (
                  <div key={snapshot.snapshotId} className="ketoy-card-surface rounded-xl p-4">
                    <div className="ketoy-card-content">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="text-sm text-white font-semibold">Version {versionLabel}</span>
                          <span className="font-mono text-xs text-gray-400" title={snapshot.snapshotId}>ID {formatSnapshotId(snapshot.snapshotId)}</span>
                          <span className={`text-xs px-2 py-1 rounded-full font-semibold border ${snapshot.type === 'ktw' ? 'text-violet-300 border-violet-400/50 bg-violet-500/10' : 'text-blue-300 border-blue-400/50 bg-blue-500/10'}`}>
                            {(snapshot.type || 'json').toUpperCase()}
                          </span>
                          <span className="text-xs text-gray-400">{timeAgo(snapshot.uploadedAt)}</span>
                          <span className="text-xs text-gray-400">{snapshot.screenCount || 0} screens</span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedSnapshotId(snapshot.snapshotId)}
                            className="btn-ketoy btn-ketoy-primary !px-3 !py-1.5 !text-xs"
                          >
                            Inspect
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setPromoteError('')
                              setPromoteMessage('')
                              setPromoteNewVersion('')
                              setConfirmPromoteSnapshotId((prev) => prev === snapshot.snapshotId ? '' : snapshot.snapshotId)
                            }}
                            className="btn-ketoy btn-ketoy-amber !px-3 !py-1.5 !text-xs"
                          >
                            Promote
                          </button>
                        </div>
                      </div>

                      {isConfirming && (
                        <div className="mt-4 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3">
                          <p className="text-sm text-amber-200">
                            Promote Version {versionLabel}? This will overwrite all {snapshot.screenCount || 0} screens with this uploaded bundle version. Current content will be preserved in version history.
                          </p>
                          <div className="mt-3 max-w-[220px]">
                            <label className="block text-xs text-amber-100/80 mb-1">New Bundle Version</label>
                            <input
                              type="text"
                              value={promoteNewVersion}
                              onChange={(event) => {
                                setPromoteNewVersion(event.target.value)
                                setPromoteError('')
                              }}
                              placeholder="e.g. 2.0.0"
                              className="w-full bg-[#0f1c2e] border border-amber-500/40 rounded-md px-2.5 py-1.5 text-xs text-white font-mono"
                            />
                          </div>
                          <div className="mt-3 flex gap-2">
                            <button
                              type="button"
                              onClick={() => handlePromoteSnapshot(snapshot)}
                              disabled={isPromoting}
                              className="btn-ketoy btn-ketoy-amber !px-3 !py-1.5 !text-xs !font-semibold"
                            >
                              {isPromoting ? 'Promoting...' : 'Confirm Promote'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmPromoteSnapshotId('')}
                              disabled={isPromoting}
                              className="btn-ketoy btn-ketoy-secondary !px-3 !py-1.5 !text-xs"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {!snapshotsLoading && snapshotsNextToken && snapshots.length > 0 && (
            <div className="mt-5 flex justify-center">
              <button
                type="button"
                onClick={handleLoadMoreSnapshots}
                disabled={loadingMoreSnapshots}
                className="btn-ketoy btn-ketoy-primary"
              >
                {loadingMoreSnapshots ? 'Loading...' : 'Load more'}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Create Screen Modal */}
      {isModalOpen && (
        <CreateScreenModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          packageName={packageName}
          onSuccess={fetchScreens}
        />
      )}

      {selectedSnapshotId && (
        <BundleSnapshotModal
          isOpen={Boolean(selectedSnapshotId)}
          onClose={() => setSelectedSnapshotId('')}
          bundleId={packageName}
          snapshotId={selectedSnapshotId}
        />
      )}

      {historyScreenId && (
        <VersionHistoryModal
          isOpen={Boolean(historyScreenId)}
          onClose={() => setHistoryScreenId('')}
          bundleId={packageName}
          packageName={packageName}
          screenName={historyScreenId}
          onLoadVersion={fetchScreens}
        />
      )}

      {screenPendingDelete && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-[#111b2b] rounded-2xl max-w-md w-full p-6 border border-red-500/40 shadow-2xl shadow-red-950/30">
            <h2 className="text-xl font-bold text-white mb-4">Delete screen?</h2>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete screen <span className="font-mono text-white">"{screenPendingDelete}"</span>?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setScreenPendingDelete('')}
                disabled={screenDeleting}
                className="btn-ketoy btn-ketoy-secondary flex-1 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteScreen}
                disabled={screenDeleting}
                className="btn-ketoy btn-ketoy-danger flex-1 disabled:opacity-60"
              >
                {screenDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-[#111b2b] rounded-2xl max-w-md w-full p-6 border border-red-500/40 shadow-2xl shadow-red-950/30">
            <h2 className="text-xl font-bold text-white mb-4">Delete app?</h2>
            <p className="text-gray-300 mb-6">
              This action removes the app from your workspace. You can request retrieval within 15 days.
            </p>
            {snapshots.length > 0 && (
              <p className="text-amber-300 text-sm mb-6">
                Warning: {snapshots.length} bundle snapshot(s) will become orphaned in DynamoDB. Delete all screens before deleting the app to avoid this.
              </p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="btn-ketoy btn-ketoy-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteApp}
                className="btn-ketoy btn-ketoy-danger flex-1"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {verificationToast && (
        <div style={{ position: 'fixed', right: 20, bottom: 20, zIndex: 60, padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(34,197,94,0.5)', background: 'rgba(22,163,74,0.2)', color: '#dcfce7', fontSize: 13, fontWeight: 600 }}>
          {verificationToast}
        </div>
      )}
      </div>
    </>
  )
}
