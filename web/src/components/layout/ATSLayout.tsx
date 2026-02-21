import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  Briefcase, LayoutDashboard, Users, BarChart3,
  Settings, LogOut, ChevronDown, Globe,
} from 'lucide-react'
import { getStoredUser, clearAuth } from '../../lib/auth'
import api from '../../lib/api'

interface Props {
  children: React.ReactNode
}

const navItems = [
  { href: '/ats', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { href: '/ats/jobs', icon: Briefcase, label: 'Jobs' },
  { href: '/ats/candidates', icon: Users, label: 'Candidates' },
  { href: '/ats/analytics', icon: BarChart3, label: 'Analytics' },
]

export default function ATSLayout({ children }: Props) {
  const navigate = useNavigate()
  const location = useLocation()
  const user = getStoredUser()

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout')
    } catch {}
    clearAuth()
    navigate('/ats/login')
  }

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return location.pathname === href
    return location.pathname.startsWith(href)
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-60 bg-white border-r border-gray-200 flex flex-col shrink-0">
        {/* Logo */}
        <div className="h-16 flex items-center px-5 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-sm font-bold text-gray-900">ATOBS</div>
              <div className="text-xs text-gray-500">ATS Dashboard</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-0.5">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive(item.href, item.exact)
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {item.label}
            </Link>
          ))}

          {user?.role === 'admin' && (
            <Link
              to="/ats/settings/users"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive('/ats/settings')
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Settings className="w-4 h-4 shrink-0" />
              Settings
            </Link>
          )}
        </nav>

        {/* View Job Board link */}
        <div className="px-3 pb-2">
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
          >
            <Globe className="w-4 h-4" />
            View Job Board
          </a>
        </div>

        {/* User */}
        <div className="border-t border-gray-100 p-3">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-brand-700">
                {user?.fullName?.charAt(0)?.toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.fullName}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role?.replace('_', ' ')}</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-gray-400 hover:text-red-500 transition-colors p-1"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
