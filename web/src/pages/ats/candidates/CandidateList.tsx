import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Search } from 'lucide-react'
import ATSLayout from '../../../components/layout/ATSLayout'
import StageTag from '../../../components/pipeline/StageTag'
import { Application, STAGE_CONFIG, Stage, VISA_LABELS } from '../../../lib/types'
import api from '../../../lib/api'
import { format } from 'date-fns'

interface PaginatedResponse {
  data: Application[]
  pagination: {
    total: number
    page: number
    limit: number
    pages: number
  }
}

const STAGES: Stage[] = [
  'resume_received', 'screened', 'vetted', 'interview_scheduled',
  'interview_completed', 'client_submitted', 'client_interview',
  'offer_awaiting', 'offer_released', 'h1b_filed', 'hired', 'rejected',
]

const VISA_OPTIONS = [
  { value: 'h1b',      label: 'H1B'        },
  { value: 'opt',      label: 'OPT'        },
  { value: 'stem_opt', label: 'STEM OPT'   },
  { value: 'ead',      label: 'EAD'        },
  { value: 'l1',       label: 'L1'         },
  { value: 'tn',       label: 'TN'         },
  { value: 'gc',       label: 'Green Card' },
  { value: 'citizen',  label: 'US Citizen' },
  { value: 'other',    label: 'Other'      },
]

export default function CandidateList() {
  const [search, setSearch] = useState('')
  const [stage, setStage] = useState('')
  const [visaStatus, setVisaStatus] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery<PaginatedResponse>({
    queryKey: ['applications', search, stage, visaStatus, page],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (stage) params.set('stage', stage)
      if (visaStatus) params.set('visaStatus', visaStatus)
      params.set('page', String(page))
      params.set('limit', '30')
      const res = await api.get(`/ats/applications?${params.toString()}`)
      return res.data
    },
  })

  const applications = data?.data ?? []
  const pagination = data?.pagination

  const handleFilterChange = () => setPage(1)

  return (
    <ATSLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Candidates</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {pagination ? `${pagination.total} total application${pagination.total !== 1 ? 's' : ''}` : ''}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search candidates..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); handleFilterChange() }}
              className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 w-64"
            />
          </div>

          <select
            value={stage}
            onChange={(e) => { setStage(e.target.value); handleFilterChange() }}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">All Stages</option>
            {STAGES.map((s) => (
              <option key={s} value={s}>{STAGE_CONFIG[s].label}</option>
            ))}
          </select>

          <select
            value={visaStatus}
            onChange={(e) => { setVisaStatus(e.target.value); handleFilterChange() }}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">All Visa Types</option>
            {VISA_OPTIONS.map((v) => (
              <option key={v.value} value={v.value}>{v.label}</option>
            ))}
          </select>

          {(search || stage || visaStatus) && (
            <button
              onClick={() => { setSearch(''); setStage(''); setVisaStatus(''); setPage(1) }}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          {isLoading ? (
            <div className="p-8 space-y-3 animate-pulse">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-50 rounded" />
              ))}
            </div>
          ) : applications.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <p className="text-sm">No candidates found.</p>
            </div>
          ) : (
            <>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Candidate</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Visa</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Job</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Stage</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Applied</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 hidden xl:table-cell">Recruiter</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {applications.map((app) => {
                    const c = app.candidate!
                    return (
                      <tr key={app.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="px-4 py-3">
                          <Link
                            to={`/ats/applications/${app.id}`}
                            className="font-medium text-brand-600 hover:text-brand-700"
                          >
                            {c.firstName} {c.lastName}
                          </Link>
                          <div className="text-xs text-gray-400 mt-0.5">
                            {c.email}
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          {c.visaStatus ? (
                            <span className="badge bg-indigo-50 text-indigo-600">
                              {VISA_LABELS[c.visaStatus] || c.visaStatus}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          {app.job ? (
                            <Link
                              to={`/ats/jobs/${app.job.id}`}
                              className="text-gray-700 hover:text-brand-600 transition-colors"
                            >
                              {app.job.title}
                            </Link>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <StageTag stage={app.stage} size="sm" />
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs hidden lg:table-cell">
                          {format(new Date(app.appliedAt), 'MMM d, yyyy')}
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs hidden xl:table-cell">
                          {app.assignedRecruiter?.fullName ?? '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              {/* Pagination */}
              {pagination && pagination.pages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
                  <p className="text-xs text-gray-500">
                    Page {pagination.page} of {pagination.pages} · {pagination.total} total
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                      className="btn-secondary text-xs py-1.5 px-3 disabled:opacity-40"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                      disabled={page >= pagination.pages}
                      className="btn-secondary text-xs py-1.5 px-3 disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </ATSLayout>
  )
}
