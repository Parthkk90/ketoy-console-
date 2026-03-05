import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function Layout() {
  const { developer, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/auth')
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="bg-[#1a2332] border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/projects" className="flex items-center gap-2">
              <img 
                src="/ketoy-logo.png" 
                alt="Ketoy Logo" 
                className="w-10 h-10 rounded-full object-cover"
              />
              <span className="text-xl font-bold text-white">Ketoy</span>
            </Link>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              <span className="text-gray-400 text-sm hidden sm:block">{developer?.email}</span>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg bg-[#0f1c2e] hover:bg-[#152235] text-gray-400 hover:text-white transition-colors"
                title="Logout"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        <Outlet />
      </main>
    </div>
  )
}
