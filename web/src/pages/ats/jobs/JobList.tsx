import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Plus, Search, MapPin, Calendar } from 'lucide-react'
import ATSLayout from '../../../components/layout/ATSLayout'
import { Job, JOB_TYPE_LABELS, JobStatus } from '../../../lib/types'
import api from '../../../lib/api'
import { format } from 'date-fns'

const STATUS_TABS: { label: string; value: string }[] = [
  { label: 'All',     value: '' },
  { label: 'Open',    value: 'open' },
  { label: 'On Hold', value: 'on_hold' },
  { label: 'Closed',  value: 'closed' },
]

const STATUS_BADGE: Record<JobStatus, string> = {
  open:    'bg-green-50 text-green-700',
  on_hold: 'bg-amber-50 text-amber-700',
  closed:  'bg-gray-100 text-gray-600',
}

const STATUS_LABEL: Record<JobStatus, string> = {
  open:    'Open',
  on_hold: 'On Hold',
  closed:  'Closed',
}

export default function JobList() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')

  const { data: jobs = [], isLoading } = useQuery<Job[]>({
    queryKey: ['ats-jobs', search, status],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (status) params.set('status', status)
      const res = await api.get(`/ats/jobs?${params.toString()}`)
      return res.data
    },
  })

  return (
    <ATSLayout>
      <div className="p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Jobs</h1>
            <p className="text-sm text-gray-500 mt-0.5">{jobs.length} position{jobs.length !== 1 ? 's' : ''}</p>
          </div>
          <Link to="/ats/jobs/new" className="btn-primary">
            <Plus className="w-4 h-4" />
            New Job
          </Link>
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search jobs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 w-60"
            />
          </div>

          {/* Status tabs */}
          <div className="flex border border-gray-200 rounded-lg overflow-hidden bg-white">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatus(tab.value)}
                className={`px-3 py-2 text-sm font-medium transition-colors border-r last:border-r-0 border-gray-200 ${
                  status === tab.value
                    ? 'bg-brand-600 text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-gray-400 animate-pulse">
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 bg-gray-50 rounded" />
                ))}
              </div>
            </div>
          ) : jobs.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <p className="text-sm">No jobs found. Try adjusting your filters.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Title</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Department</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Location</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Applicants</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden xl:table-cell">Recruiter</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <Link
                          to={`/ats/jobs/${job.id}`}
                          className="font-medium text-brand-600 hover:text-brand-700"
                        >
                          {job.title}
                        </Link>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {JOB_TYPE_LABELS[job.jobType] || job.jobType}
                          {job.isRemote && ' · Remote'}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className={`badge ${STATUS_BADGE[job.status]}`}>
                        {STATUS_LABEL[job.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden md:table-cell">
                      {job.department || '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">
                      {(job.locationCity || job.locationState) ? (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {[job.locationCity, job.locationState].filter(Boolean).join(', ')}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="font-medium text-gray-900">{job.stats?.total ?? 0}</span>
                      {(job.stats?.unprocessed ?? 0) > 0 && (
                        <span className="ml-1.5 badge bg-amber-50 text-amber-700">
                          {job.stats?.unprocessed} new
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden xl:table-cell">
                      {job.assignedRecruiter?.fullName ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-400 hidden lg:table-cell">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(job.createdAt), 'MMM d, yyyy')}
                      </span>
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
