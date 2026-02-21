import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, ChevronRight, Globe, CheckCircle2 } from 'lucide-react'
import ATSLayout from '../../../components/layout/ATSLayout'
import StatCard from '../../../components/shared/StatCard'
import CandidateRow from '../../../components/pipeline/CandidateRow'
import { Job, Application, STAGE_CONFIG, Stage } from '../../../lib/types'
import api from '../../../lib/api'

interface JobViewData {
  job: Job
  stats: {
    total: number
    unprocessed: number
    processed: number
    hired: number
    rejected: number
    stageCounts: Record<string, number>
  }
  applications: Application[]
}

const STATUS_CONFIG = {
  open:    { label: 'Open',    classes: 'bg-green-100 text-green-700' },
  on_hold: { label: 'On Hold', classes: 'bg-amber-100 text-amber-700' },
  closed:  { label: 'Closed',  classes: 'bg-gray-100 text-gray-600'  },
}

const STAGE_ORDER: Stage[] = [
  'resume_received', 'screened', 'vetted', 'interview_scheduled',
  'interview_completed', 'client_submitted', 'client_interview',
  'offer_awaiting', 'offer_released', 'h1b_filed', 'hired', 'rejected',
]

export default function JobView() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<'unprocessed' | 'processed'>('unprocessed')
  const [stageFilter, setStageFilter] = useState<string>('')

  const { data, isLoading, isError } = useQuery<JobViewData>({
    queryKey: ['ats-job', id, tab, stageFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.set('tab', tab)
      if (stageFilter) params.set('stage', stageFilter)
      const res = await api.get(`/ats/jobs/${id}?${params.toString()}`)
      return res.data
    },
    enabled: !!id,
  })

  const changeStatus = useMutation({
    mutationFn: async (status: string) =>
      api.patch(`/ats/jobs/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ats-job', id] })
      queryClient.invalidateQueries({ queryKey: ['ats-jobs'] })
    },
  })

  if (isLoading) {
    return (
      <ATSLayout>
        <div className="p-6 animate-pulse space-y-4">
          <div className="h-8 bg-gray-100 rounded w-1/3" />
          <div className="card h-20" />
          <div className="card h-64" />
        </div>
      </ATSLayout>
    )
  }

  if (isError || !data) {
    return (
      <ATSLayout>
        <div className="p-6">
          <p className="text-gray-500">Job not found.</p>
          <Link to="/ats/jobs" className="text-brand-600 hover:underline text-sm">
            Back to Jobs
          </Link>
        </div>
      </ATSLayout>
    )
  }

  const { job, stats, applications } = data
  const statusCfg = STATUS_CONFIG[job.status] || STATUS_CONFIG.open

  return (
    <ATSLayout>
      <div className="flex h-full">
        {/* Left content area */}
        <div className="flex-1 overflow-auto p-6 min-w-0">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-4">
            <Link to="/ats/jobs" className="hover:text-brand-600 transition-colors">Jobs</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-gray-900 font-medium truncate">{job.title}</span>
          </div>

          {/* Title row */}
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{job.title}</h1>
              {job.department && (
                <p className="text-sm text-gray-500 mt-0.5">{job.department}</p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`badge ${statusCfg.classes}`}>{statusCfg.label}</span>
              <Link to={`/ats/jobs/${id}/edit`} className="btn-secondary text-xs py-1.5 px-3">
                <Pencil className="w-3.5 h-3.5" /> Edit
              </Link>
            </div>
          </div>

          {/* Stat bar — JazzHR style clickable */}
          <div className="card mb-5 overflow-hidden">
            <div className="grid grid-cols-5 divide-x divide-gray-100">
              {[
                { label: 'Total',      value: stats.total,       filter: '' },
                { label: 'Unprocessed', value: stats.unprocessed, filter: 'unprocessed' },
                { label: 'Processed',  value: stats.processed,   filter: 'processed'   },
                { label: 'Hired',      value: stats.hired,       filter: 'hired'       },
                { label: 'Not Hired',  value: stats.rejected,    filter: 'rejected'    },
              ].map(({ label, value, filter }) => (
                <StatCard
                  key={label}
                  label={label}
                  value={value}
                  active={
                    filter === '' ? false
                    : filter === 'unprocessed' ? tab === 'unprocessed' && stageFilter === ''
                    : filter === 'processed'   ? tab === 'processed'   && stageFilter === ''
                    : stageFilter === filter
                  }
                  color="purple"
                  onClick={() => {
                    if (filter === '' || filter === 'unprocessed') {
                      setTab('unprocessed')
                      setStageFilter('')
                    } else if (filter === 'processed') {
                      setTab('processed')
                      setStageFilter('')
                    } else {
                      setTab('processed')
                      setStageFilter(filter)
                    }
                  }}
                />
              ))}
            </div>
          </div>

          {/* Tab nav */}
          <div className="flex border-b border-gray-200 mb-4">
            {(['unprocessed', 'processed'] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setStageFilter('') }}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  tab === t
                    ? 'border-brand-600 text-brand-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {t === 'unprocessed' ? 'Not Processed' : 'Processed'}
                <span className="ml-1.5 text-xs text-gray-400">
                  ({t === 'unprocessed' ? stats.unprocessed : stats.processed})
                </span>
              </button>
            ))}
          </div>

          {/* Stage filter pills (only in processed) */}
          {tab === 'processed' && (
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={() => setStageFilter('')}
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                  stageFilter === ''
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                All
              </button>
              {STAGE_ORDER.filter((s) => (stats.stageCounts[s] ?? 0) > 0).map((stage) => {
                const cfg = STAGE_CONFIG[stage]
                return (
                  <button
                    key={stage}
                    onClick={() => setStageFilter(stageFilter === stage ? '' : stage)}
                    className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                      stageFilter === stage
                        ? `${cfg.bgColor} ${cfg.textColor} border-current`
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {cfg.label} ({stats.stageCounts[stage] ?? 0})
                  </button>
                )
              })}
            </div>
          )}

          {/* Candidate list */}
          <div className="card overflow-hidden">
            {applications.length === 0 ? (
              <div className="py-12 text-center text-gray-400">
                <p className="text-sm">No candidates in this view.</p>
              </div>
            ) : (
              <div>
                {applications.map((app) => (
                  <CandidateRow key={app.id} application={app} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right panel */}
        <aside className="w-72 border-l border-gray-200 bg-white p-5 shrink-0 overflow-auto">
          {/* Job Information */}
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Job Information
            </h3>
            <div className="space-y-3 text-sm">
              {/* Status change */}
              <div>
                <p className="text-xs text-gray-400 mb-1">Status</p>
                <div className="flex items-center gap-2">
                  <span className={`badge ${statusCfg.classes}`}>{statusCfg.label}</span>
                  <select
                    className="text-xs border border-gray-200 rounded px-2 py-1 text-gray-600 bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                    value={job.status}
                    onChange={(e) => changeStatus.mutate(e.target.value)}
                    disabled={changeStatus.isPending}
                  >
                    <option value="open">Open</option>
                    <option value="on_hold">On Hold</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-400 mb-1">Syndicated</p>
                <div className="flex items-center gap-1.5">
                  {job.isPublished ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                      <span className="text-green-700">Published</span>
                    </>
                  ) : (
                    <>
                      <Globe className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-gray-500">Not published</span>
                    </>
                  )}
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-400 mb-1">Hiring Manager</p>
                <p className="text-gray-700">
                  {job.assignedRecruiter?.fullName ?? <span className="text-gray-400">Unassigned</span>}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-400 mb-1">Visa Sponsorship</p>
                <p className={job.visaSponsorship ? 'text-green-700' : 'text-gray-500'}>
                  {job.visaSponsorship ? 'Available' : 'Not available'}
                </p>
              </div>

              {(job.locationCity || job.locationState) && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">Location</p>
                  <p className="text-gray-700">
                    {[job.locationCity, job.locationState].filter(Boolean).join(', ')}
                    {job.isRemote && ' (Remote)'}
                  </p>
                </div>
              )}

              {(job.salaryMin || job.salaryMax) && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">Salary Range</p>
                  <p className="text-gray-700">
                    {job.salaryMin ? `$${Math.round(job.salaryMin / 1000)}k` : ''}
                    {job.salaryMin && job.salaryMax ? ' – ' : ''}
                    {job.salaryMax ? `$${Math.round(job.salaryMax / 1000)}k` : ''}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Stage distribution */}
          {Object.keys(stats.stageCounts).length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Stage Breakdown
              </h3>
              <div className="space-y-1.5">
                {STAGE_ORDER.filter((s) => (stats.stageCounts[s] ?? 0) > 0).map((stage) => {
                  const cfg = STAGE_CONFIG[stage]
                  const count = stats.stageCounts[stage] ?? 0
                  return (
                    <button
                      key={stage}
                      onClick={() => {
                        setTab('processed')
                        setStageFilter(stageFilter === stage ? '' : stage)
                      }}
                      className={`w-full flex items-center justify-between text-xs px-2 py-1.5 rounded transition-colors ${
                        stageFilter === stage
                          ? `${cfg.bgColor} ${cfg.textColor}`
                          : 'hover:bg-gray-50 text-gray-600'
                      }`}
                    >
                      <span>{cfg.label}</span>
                      <span className="font-semibold">{count}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Add candidate placeholder */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <button className="btn-secondary w-full justify-center text-xs">
              <Plus className="w-3.5 h-3.5" />
              Add Candidate
            </button>
          </div>
        </aside>
      </div>
    </ATSLayout>
  )
}
