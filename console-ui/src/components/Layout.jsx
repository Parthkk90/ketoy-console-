import { Outlet, Link, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { getDisplayUsername } from '../services/userDisplay'

export default function Layout() {
  const { developer, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const displayName = getDisplayUsername(developer)
  const canGoBack = location.pathname !== '/'

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
    <div className="min-h-screen bg-[#070b12] text-white">
      <div className="flex min-h-screen">
        <aside className="hidden md:flex md:w-64 lg:w-72 flex-col border-r border-white/10 bg-[linear-gradient(180deg,rgba(26,115,232,0.12),rgba(7,11,18,0)_24%),#0b1320]">
          <div className="px-5 pt-6 pb-4 border-b border-white/10">
            <Link to="/" className="flex items-center gap-3">
              <img
                src="/T_ketoy_logo.png"
                alt="Ketoy Logo"
                className="w-10 h-10 rounded-xl object-cover ring-1 ring-white/20"
              />
              <div>
                <p className="text-lg font-semibold tracking-wide">Ketoy Console</p>
                <p className="text-xs text-gray-400">Server-Driven UI Studio</p>
              </div>
            </Link>
          </div>

          <nav className="px-4 py-5 space-y-2">
            <NavLink to="/" end className={navItemClass}>
              <span>Home</span>
            </NavLink>
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

        <div className="flex-1 min-w-0">
          <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0d1624]/90 backdrop-blur supports-[backdrop-filter]:bg-[#0d1624]/80">
            <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {canGoBack && (
                  <button
                    onClick={handleGoBack}
                    className="px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-gray-200 hover:text-white text-sm border border-white/10 transition-colors"
                    title="Go back"
                  >
                    ← Back
                  </button>
                )}
                <Link to="/" className="md:hidden flex items-center gap-2">
                  <img
                    src="/T_ketoy_logo.png"
                    alt="Ketoy Logo"
                    className="w-8 h-8 rounded-lg object-cover"
                  />
                  <span className="text-base font-semibold">Ketoy</span>
                </Link>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-gray-300 text-sm hidden sm:block">{displayName}</span>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-gray-300 hover:text-white border border-white/10 transition-colors"
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
    </div>
  )
}
