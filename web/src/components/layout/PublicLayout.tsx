import { Link, useNavigate } from 'react-router-dom'
import { Briefcase, LogIn, LogOut, LayoutDashboard } from 'lucide-react'
import { getStoredUser, clearAuth, isAuthenticated } from '../../lib/auth'
import api from '../../lib/api'

interface Props {
  children: React.ReactNode
}

export default function PublicLayout({ children }: Props) {
  const navigate = useNavigate()
  const authenticated = isAuthenticated()
  const user = getStoredUser()

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout')
    } catch {}
    clearAuth()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">ATOBS</span>
          </Link>

          <nav className="flex items-center gap-4">
            <Link to="/" className="text-sm text-gray-600 hover:text-brand-600 transition-colors">
              Jobs
            </Link>

            {authenticated && user ? (
              <>
                <Link
                  to="/ats"
                  className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-brand-600 transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>
                <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
                  <div className="w-7 h-7 bg-brand-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-brand-700">
                      {user.fullName?.charAt(0)?.toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-700 hidden sm:block">
                    {user.fullName?.split(' ')[0]}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-600 transition-colors ml-1"
                    title="Sign out"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:block">Sign out</span>
                  </button>
                </div>
              </>
            ) : (
              <Link
                to="/ats/login"
                className="flex items-center gap-1.5 bg-brand-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors"
              >
                <LogIn className="w-4 h-4" />
                Sign In
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* Content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 mt-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm text-gray-500">© 2024 ATOBS. All rights reserved.</span>
          <span className="text-sm text-gray-400">Built for H1B consulting firms</span>
        </div>
      </footer>
    </div>
  )
}
