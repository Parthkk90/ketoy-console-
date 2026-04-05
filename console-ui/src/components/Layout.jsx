import { useState } from 'react'
import { Outlet, Link, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { getDisplayUsername } from '../services/userDisplay'

export default function Layout() {
  const { developer, logout } = useAuthStore()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const displayName = getDisplayUsername(developer)
  const canGoBack = location.pathname !== '/projects'
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || ''
  const apiEnv = apiBaseUrl.includes('/dev')
    ? 'dev'
    : apiBaseUrl.includes('/prod') || apiBaseUrl.includes('api.ketoy.dev')
      ? 'prod'
      : 'custom'

  const envBadgeClass = apiEnv === 'dev'
    ? 'bg-[rgba(234,179,8,0.15)] border-[rgba(234,179,8,0.4)] text-[rgb(234,179,8)]'
    : apiEnv === 'prod'
      ? 'bg-[rgba(34,197,94,0.15)] border-[rgba(34,197,94,0.4)] text-[rgb(34,197,94)]'
      : 'bg-white/10 border-white/25 text-gray-200'

  const envBadgeLabel = apiEnv.toUpperCase()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1)
      return
    }

    navigate('/projects')
  }

  const navItemClass = ({ isActive }) => `
    flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200
    ${isActive
      ? 'bg-[#1A73E8]/20 text-white border border-[#1A73E8]/40'
      : 'text-gray-300 hover:text-white hover:bg-white/[0.06] border border-transparent'}
  `

  return (
    <div className="h-screen overflow-hidden bg-[#070b12] text-white">
      <div className="flex h-full">
        <aside className="hidden md:flex md:w-64 lg:w-72 shrink-0 sticky top-0 h-screen overflow-y-auto flex-col border-r border-white/10 bg-[linear-gradient(180deg,rgba(26,115,232,0.12),rgba(7,11,18,0)_24%),#0b1320]">
          <div className="px-5 pt-6 pb-4 border-b border-white/10">
            <Link to="/projects" className="flex items-center gap-3">
              <img
                src="/T_ketoy_logo.png"
                alt="Ketoy Logo"
                className="w-10 h-10 rounded-xl object-cover ring-1 ring-white/20"
              />
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-semibold tracking-wide">Ketoy Console</p>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${envBadgeClass}`}>
                    {envBadgeLabel}
                  </span>
                </div>
                <p className="text-xs text-gray-400">Server-Driven UI Studio</p>
              </div>
            </Link>
          </div>

          <nav className="px-4 py-5 space-y-2">
            <NavLink to="/projects" className={navItemClass}>
              <span>Projects</span>
            </NavLink>
          </nav>

          <div className="mt-auto p-4">
            <div className="ketoy-card-surface-soft rounded-2xl px-4 py-3">
              <div className="ketoy-card-content">
                <p className="text-xs uppercase tracking-[0.16em] text-gray-400">Signed in as</p>
                <p className="mt-2 text-sm font-medium text-gray-100 truncate">{displayName}</p>
              </div>
            </div>
          </div>
        </aside>

        <div className="flex-1 min-w-0 h-full overflow-y-auto">
          <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0d1624]/90 backdrop-blur supports-[backdrop-filter]:bg-[#0d1624]/80">
            <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {canGoBack && (
                  <button
                    onClick={handleGoBack}
                    className="btn-ketoy btn-ketoy-secondary !w-9 !h-9 !p-0 inline-flex items-center justify-center rounded-xl"
                    title="Go back"
                    aria-label="Go back"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                )}
                <Link to="/projects" className="md:hidden flex items-center gap-2">
                  <img
                    src="/T_ketoy_logo.png"
                    alt="Ketoy Logo"
                    className="w-8 h-8 rounded-lg object-cover"
                  />
                  <span className="text-base font-semibold">Ketoy</span>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${envBadgeClass}`}>
                    {envBadgeLabel}
                  </span>
                </Link>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-gray-300 text-sm hidden sm:block">{displayName}</span>
                <button
                  onClick={() => setShowLogoutConfirm(true)}
                  className="btn-ketoy btn-ketoy-secondary !p-2"
                  title="Logout"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            </div>
          </header>

          <main>
            <Outlet />
          </main>
        </div>
      </div>

      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-[#111b2b] rounded-2xl max-w-md w-full p-6 border border-white/15 shadow-2xl shadow-black/40">
            <h2 className="text-xl font-bold text-white mb-4">Log out?</h2>
            <p className="text-gray-300 mb-6">Are you sure you want to log out of this session?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="btn-ketoy btn-ketoy-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="btn-ketoy btn-ketoy-danger flex-1"
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
