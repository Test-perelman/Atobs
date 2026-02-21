import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, AlertCircle, Check, X } from 'lucide-react'
import ATSLayout from '../../../components/layout/ATSLayout'
import { User, UserRole } from '../../../lib/types'
import api from '../../../lib/api'
import { format } from 'date-fns'

const ROLE_LABELS: Record<UserRole, string> = {
  admin:          'Admin',
  recruiter:      'Recruiter',
  hiring_manager: 'Hiring Manager',
  viewer:         'Viewer',
}

const ROLE_BADGE: Record<UserRole, string> = {
  admin:          'bg-brand-50 text-brand-700',
  recruiter:      'bg-blue-50 text-blue-700',
  hiring_manager: 'bg-purple-50 text-purple-700',
  viewer:         'bg-gray-100 text-gray-600',
}

interface NewUserForm {
  email: string
  password: string
  fullName: string
  role: UserRole
}

const INITIAL_FORM: NewUserForm = {
  email: '', password: '', fullName: '', role: 'recruiter',
}

export default function Users() {
  const queryClient = useQueryClient()
  const [showAddForm, setShowAddForm] = useState(false)
  const [form, setForm] = useState<NewUserForm>(INITIAL_FORM)
  const [formError, setFormError] = useState('')

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ['ats-users'],
    queryFn: async () => {
      const res = await api.get('/ats/users')
      return res.data
    },
  })

  const createUser = useMutation({
    mutationFn: (data: NewUserForm) => api.post('/ats/users', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ats-users'] })
      setShowAddForm(false)
      setForm(INITIAL_FORM)
      setFormError('')
    },
    onError: (err: any) => {
      setFormError(err?.response?.data?.error || 'Failed to create user.')
    },
  })

  const updateUser = useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: Partial<User & { isActive: boolean }> }) =>
      api.patch(`/ats/users/${userId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ats-users'] })
    },
  })

  const handleFormChange = (field: keyof NewUserForm, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    createUser.mutate(form)
  }

  return (
    <ATSLayout>
      <div className="p-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">User Management</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {users.length} user{users.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={() => setShowAddForm((v) => !v)}
            className="btn-primary"
          >
            <Plus className="w-4 h-4" />
            Add User
          </button>
        </div>

        {/* Add user form */}
        {showAddForm && (
          <div className="card p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900">Add New User</h2>
              <button
                onClick={() => { setShowAddForm(false); setFormError('') }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="flex items-center gap-2 bg-red-50 text-red-700 text-sm px-3 py-2.5 rounded-lg mb-4">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Full Name *</label>
                <input
                  className="input"
                  required
                  placeholder="Jane Smith"
                  value={form.fullName}
                  onChange={(e) => handleFormChange('fullName', e.target.value)}
                />
              </div>
              <div>
                <label className="label">Email *</label>
                <input
                  type="email"
                  className="input"
                  required
                  placeholder="jane@company.com"
                  value={form.email}
                  onChange={(e) => handleFormChange('email', e.target.value)}
                />
              </div>
              <div>
                <label className="label">Password *</label>
                <input
                  type="password"
                  className="input"
                  required
                  minLength={6}
                  placeholder="Min 6 characters"
                  value={form.password}
                  onChange={(e) => handleFormChange('password', e.target.value)}
                />
              </div>
              <div>
                <label className="label">Role *</label>
                <select
                  className="input"
                  value={form.role}
                  onChange={(e) => handleFormChange('role', e.target.value as UserRole)}
                >
                  <option value="recruiter">Recruiter</option>
                  <option value="hiring_manager">Hiring Manager</option>
                  <option value="admin">Admin</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
              <div className="sm:col-span-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => { setShowAddForm(false); setFormError('') }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={createUser.isPending}>
                  {createUser.isPending ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* User table */}
        <div className="card overflow-hidden">
          {isLoading ? (
            <div className="p-8 animate-pulse space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-50 rounded" />
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <p className="text-sm">No users found.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Role</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Last Login</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/40 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-brand-700">
                            {user.fullName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="font-medium text-gray-900">{user.fullName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">
                      {user.email}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        className="text-xs border border-gray-200 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                        value={user.role}
                        onChange={(e) =>
                          updateUser.mutate({
                            userId: user.id,
                            data: { role: e.target.value as UserRole },
                          })
                        }
                      >
                        {(Object.keys(ROLE_LABELS) as UserRole[]).map((r) => (
                          <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      {user.isActive ? (
                        <span className="badge bg-green-50 text-green-700">
                          <Check className="w-3 h-3 mr-1" />
                          Active
                        </span>
                      ) : (
                        <span className="badge bg-gray-100 text-gray-500">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs hidden lg:table-cell">
                      {user.lastLoginAt
                        ? format(new Date(user.lastLoginAt), 'MMM d, yyyy h:mm a')
                        : 'Never'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() =>
                          updateUser.mutate({
                            userId: user.id,
                            data: { isActive: !user.isActive },
                          })
                        }
                        disabled={updateUser.isPending}
                        className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                          user.isActive
                            ? 'border-red-200 text-red-600 hover:bg-red-50'
                            : 'border-green-200 text-green-600 hover:bg-green-50'
                        }`}
                      >
                        {user.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </ATSLayout>
  )
}
