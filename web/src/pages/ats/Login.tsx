import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Briefcase, AlertCircle } from 'lucide-react'
import api from '../../lib/api'
import { setStoredUser } from '../../lib/auth'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('admin@atobs.com')
  const [password, setPassword] = useState('admin123')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/auth/login', { email, password })
      const { accessToken, user } = res.data
      setStoredUser(user, accessToken)
      navigate('/ats')
    } catch (err: any) {
      const msg = err?.response?.data?.error
      setError(msg === 'Invalid credentials' ? 'Invalid email or password.' : (msg || 'Login failed.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-brand-600 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Briefcase className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">ATOBS</h1>
          <p className="text-sm text-gray-500 mt-1">Recruiter Dashboard</p>
        </div>

        <div className="card p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-5">Sign in to your account</h2>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 text-red-700 text-sm px-3 py-2.5 rounded-lg mb-4">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email address</label>
              <input
                type="email"
                className="input"
                placeholder="admin@atobs.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                autoFocus
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password"
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            <button
              type="submit"
              className="btn-primary w-full justify-center mt-2"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="text-xs text-gray-400 text-center mt-4">
            Demo: admin@atobs.com / admin123
          </p>
        </div>
      </div>
    </div>
  )
}
