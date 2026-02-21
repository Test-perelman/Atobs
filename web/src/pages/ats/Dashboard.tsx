import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  Plus, MapPin, Users, Briefcase, TrendingUp, CheckCircle2,
} from 'lucide-react'
import ATSLayout from '../../components/layout/ATSLayout'
import StatCard from '../../components/shared/StatCard'
import { Job, JOB_TYPE_LABELS } from '../../lib/types'
import api from '../../lib/api'
import { format } from 'date-fns'

interface AnalyticsOverview {
  totalJobs: number
  openJobs: number
  onHoldJobs: number
  closedJobs: number
  totalCandidates: number
  totalApplications: number
  unprocessed: number
  processed: number
  hired: number
  rejected: number
  thisMonth: number
  stageCounts: Record<string, number>
}

const STATUS_CONFIG = {
  open:    { label: 'Open',    classes: 'bg-green-50 text-green-700'  },
  on_hold: { label: 'On Hold', classes: 'bg-amber-50 text-amber-700'  },
  closed:  { label: 'Closed',  classes: 'bg-gray-100 text-gray-600'   },
}

export default function Dashboard() {
  const { data: overview } = useQuery<AnalyticsOverview>({
    queryKey: ['analytics-overview'],
    queryFn: async () => {
      const res = await api.get('/ats/analytics/overview')
      return res.data
    },
  })

  const { data: jobs = [], isLoading: jobsLoading } = useQuery<Job[]>({
    queryKey: ['ats-jobs-dashboard'],
    queryFn: async () => {
      const res = await api.get('/ats/jobs')
      return res.data
    },
  })

  return (
    <ATSLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-500 mt-0.5">Overview of your recruitment pipeline</p>
          </div>
          <Link to="/ats/jobs/new" className="btn-primary">
            <Plus className="w-4 h-4" />
            New Job
          </Link>
        </div>

        {/* Stat bar */}
        <div className="card mb-6 overflow-hidden">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
            <StatCard label="Total Jobs" value={overview?.totalJobs ?? '—'} />
            <StatCard label="Open Jobs" value={overview?.openJobs ?? '—'} color="green" />
            <StatCard label="Candidates" value={overview?.totalCandidates ?? '—'} />
            <StatCard label="Hired" value={overview?.hired ?? '—'} color="purple" />
            <StatCard label="This Month" value={overview?.thisMonth ?? '—'} color="blue" />
          </div>
        </div>

        {/* Sub stats */}
        {overview && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <div className="card p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-brand-50 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-brand-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Unprocessed</p>
                  <p className="text-lg font-bold text-gray-900">{overview.unprocessed}</p>
                </div>
              </div>
            </div>
            <div className="card p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">In Pipeline</p>
                  <p className="text-lg font-bold text-gray-900">{overview.processed}</p>
                </div>
              </div>
            </div>
            <div className="card p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-amber-50 rounded-lg flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">On Hold Jobs</p>
                  <p className="text-lg font-bold text-gray-900">{overview.onHoldJobs}</p>
                </div>
              </div>
            </div>
            <div className="card p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-green-50 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total Apps</p>
                  <p className="text-lg font-bold text-gray-900">{overview.totalApplications}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Job cards */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">All Jobs</h2>
          <Link to="/ats/jobs" className="text-sm text-brand-600 hover:text-brand-700">
            View all →
          </Link>
        </div>

        {jobsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card p-4 animate-pulse">
                <div className="h-5 bg-gray-100 rounded w-2/3 mb-3" />
                <div className="h-4 bg-gray-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="card p-10 text-center text-gray-400">
            <Briefcase className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No jobs yet. Create your first job posting.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {jobs.map((job) => {
              const statusCfg = STATUS_CONFIG[job.status] || STATUS_CONFIG.open
              return (
                <Link
                  key={job.id}
                  to={`/ats/jobs/${job.id}`}
                  className="card p-4 hover:shadow-md hover:border-brand-200 transition-all group"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-sm font-semibold text-gray-900 group-hover:text-brand-700 transition-colors leading-snug">
                      {job.title}
                    </h3>
                    <span className={`badge shrink-0 ${statusCfg.classes}`}>
                      {statusCfg.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                    {job.department && <span>{job.department}</span>}
                    {(job.locationCity || job.locationState) && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {[job.locationCity, job.locationState].filter(Boolean).join(', ')}
                      </span>
                    )}
                    {job.jobType && (
                      <span>{JOB_TYPE_LABELS[job.jobType] || job.jobType}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-xs pt-2 border-t border-gray-50">
                    <span className="text-gray-600 font-medium">
                      {job.stats?.total ?? 0} applicant{(job.stats?.total ?? 0) !== 1 ? 's' : ''}
                    </span>
                    {(job.stats?.unprocessed ?? 0) > 0 && (
                      <span className="badge bg-amber-50 text-amber-700">
                        {job.stats?.unprocessed} new
                      </span>
                    )}
                    <span className="ml-auto text-gray-400">
                      {job.assignedRecruiter?.fullName ?? 'Unassigned'}
                    </span>
                  </div>

                  <div className="text-xs text-gray-400 mt-1">
                    {format(new Date(job.createdAt), 'MMM d, yyyy')}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </ATSLayout>
  )
}
