import { useQuery } from '@tanstack/react-query'
import { BarChart3, TrendingUp, Users, Briefcase, CheckCircle2, XCircle } from 'lucide-react'
import ATSLayout from '../../components/layout/ATSLayout'
import StatCard from '../../components/shared/StatCard'
import { STAGE_CONFIG, Stage } from '../../lib/types'
import api from '../../lib/api'

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

const STAGE_ORDER: Stage[] = [
  'resume_received', 'screened', 'vetted', 'interview_scheduled',
  'interview_completed', 'client_submitted', 'client_interview',
  'offer_awaiting', 'offer_released', 'h1b_filed', 'hired', 'rejected',
]

export default function Analytics() {
  const { data: overview, isLoading } = useQuery<AnalyticsOverview>({
    queryKey: ['analytics-overview'],
    queryFn: async () => {
      const res = await api.get('/ats/analytics/overview')
      return res.data
    },
  })

  const maxStageCount = overview
    ? Math.max(...Object.values(overview.stageCounts), 1)
    : 1

  return (
    <ATSLayout>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-500 mt-0.5">Recruitment pipeline overview</p>
        </div>

        {isLoading ? (
          <div className="animate-pulse space-y-4">
            <div className="card h-24" />
            <div className="card h-64" />
          </div>
        ) : overview ? (
          <>
            {/* Top stat bar */}
            <div className="card mb-6 overflow-hidden">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
                <StatCard label="Total Jobs" value={overview.totalJobs} />
                <StatCard label="Open" value={overview.openJobs} color="green" />
                <StatCard label="Candidates" value={overview.totalCandidates} />
                <StatCard label="Hired" value={overview.hired} color="purple" />
                <StatCard label="This Month" value={overview.thisMonth} color="blue" />
              </div>
            </div>

            {/* Secondary stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'On Hold Jobs', value: overview.onHoldJobs, icon: Briefcase, color: 'text-amber-600 bg-amber-50' },
                { label: 'Closed Jobs',  value: overview.closedJobs,  icon: XCircle,   color: 'text-gray-600 bg-gray-100' },
                { label: 'Unprocessed', value: overview.unprocessed, icon: Users,      color: 'text-red-600 bg-red-50'    },
                { label: 'Rejected',    value: overview.rejected,    icon: XCircle,   color: 'text-red-600 bg-red-50'    },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="card p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">{label}</p>
                      <p className="text-xl font-bold text-gray-900">{value}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pipeline stage distribution */}
            <div className="card p-6 mb-6">
              <div className="flex items-center gap-2 mb-6">
                <BarChart3 className="w-5 h-5 text-brand-600" />
                <h2 className="text-base font-semibold text-gray-900">Pipeline Stage Distribution</h2>
              </div>

              {Object.keys(overview.stageCounts).length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">
                  No applications in the pipeline yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {STAGE_ORDER.filter((s) => (overview.stageCounts[s] ?? 0) > 0).map((stage) => {
                    const count = overview.stageCounts[stage] || 0
                    const config = STAGE_CONFIG[stage]
                    const pct = Math.round((count / maxStageCount) * 100)
                    return (
                      <div key={stage} className="flex items-center gap-3">
                        <div className="w-36 text-xs text-gray-600 font-medium truncate shrink-0">
                          {config.label}
                        </div>
                        <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${config.bgColor} transition-all`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="w-8 text-xs text-right text-gray-600 font-semibold shrink-0">
                          {count}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Quick summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-4 h-4 text-brand-600" />
                  <h2 className="text-sm font-semibold text-gray-900">Conversion Rates</h2>
                </div>
                <div className="space-y-3">
                  {[
                    { label: 'Application → Interview', a: (overview.stageCounts['interview_scheduled'] || 0) + (overview.stageCounts['interview_completed'] || 0), b: overview.totalApplications },
                    { label: 'Interview → Client Submit', a: overview.stageCounts['client_submitted'] || 0, b: (overview.stageCounts['interview_scheduled'] || 0) + (overview.stageCounts['interview_completed'] || 0) },
                    { label: 'Client Submit → Offer', a: (overview.stageCounts['offer_awaiting'] || 0) + (overview.stageCounts['offer_released'] || 0), b: overview.stageCounts['client_submitted'] || 0 },
                    { label: 'Overall → Hired', a: overview.hired, b: overview.totalApplications },
                  ].map(({ label, a, b }) => (
                    <div key={label} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{label}</span>
                      <span className="font-semibold text-gray-900">
                        {b > 0 ? `${Math.round((a / b) * 100)}%` : '—'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <h2 className="text-sm font-semibold text-gray-900">Summary</h2>
                </div>
                <div className="space-y-3">
                  {[
                    { label: 'Total Applications', value: overview.totalApplications },
                    { label: 'Processed', value: overview.processed },
                    { label: 'Unprocessed', value: overview.unprocessed },
                    { label: 'Applied This Month', value: overview.thisMonth },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{label}</span>
                      <span className="font-semibold text-gray-900">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </ATSLayout>
  )
}
