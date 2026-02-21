import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { MapPin, Briefcase, Globe, DollarSign, CheckCircle2, Search } from 'lucide-react'
import PublicLayout from '../../components/layout/PublicLayout'
import { JOB_TYPE_LABELS } from '../../lib/types'
import api from '../../lib/api'
import { format } from 'date-fns'

interface PublicJob {
  id: string
  title: string
  department?: string
  locationCity?: string
  locationState?: string
  isRemote: boolean
  jobType: string
  visaSponsorship: boolean
  salary: { min?: number; max?: number } | null
  createdAt: string
}

export default function JobBoard() {
  const [search, setSearch] = useState('')
  const [locationFilter, setLocationFilter] = useState('')
  const [jobType, setJobType] = useState('')
  const [visaOnly, setVisaOnly] = useState(false)

  const { data: jobs = [], isLoading } = useQuery<PublicJob[]>({
    queryKey: ['public-jobs', search, locationFilter, jobType, visaOnly],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (locationFilter) params.set('location', locationFilter)
      if (jobType) params.set('jobType', jobType)
      if (visaOnly) params.set('visa', 'sponsored')
      const res = await api.get(`/jobs?${params.toString()}`)
      return res.data
    },
  })

  return (
    <PublicLayout>
      {/* Hero */}
      <div className="bg-gradient-to-br from-brand-600 to-brand-900 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-4xl font-bold text-white mb-3">Find Your Next Opportunity</h1>
          <p className="text-brand-200 text-lg mb-8">
            H1B visa sponsorship available for eligible candidates
          </p>
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search jobs, skills, keywords..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 rounded-xl text-gray-900 text-sm bg-white shadow-lg focus:outline-none focus:ring-2 focus:ring-brand-300"
            />
          </div>
        </div>
      </div>

      {/* Filters + Listings */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <input
            type="text"
            placeholder="Filter by location..."
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 w-48"
          />
          <select
            value={jobType}
            onChange={(e) => setJobType(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">All Job Types</option>
            {Object.entries(JOB_TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={visaOnly}
              onChange={(e) => setVisaOnly(e.target.checked)}
              className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
            />
            Visa Sponsorship Only
          </label>
          <span className="ml-auto text-sm text-gray-500">
            {isLoading ? 'Loading...' : `${jobs.length} job${jobs.length !== 1 ? 's' : ''} found`}
          </span>
        </div>

        {/* Job cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card p-5 animate-pulse">
                <div className="h-5 bg-gray-100 rounded w-3/4 mb-3" />
                <div className="h-4 bg-gray-100 rounded w-1/2 mb-4" />
                <div className="h-4 bg-gray-100 rounded w-full mb-2" />
                <div className="h-4 bg-gray-100 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium text-gray-500">No jobs found</p>
            <p className="text-sm mt-1">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobs.map((job) => (
              <Link
                key={job.id}
                to={`/jobs/${job.id}`}
                className="card p-5 hover:shadow-md hover:border-brand-200 transition-all group"
              >
                <div className="mb-3">
                  <h2 className="text-base font-semibold text-gray-900 group-hover:text-brand-700 transition-colors leading-snug">
                    {job.title}
                  </h2>
                  {job.department && (
                    <p className="text-xs text-gray-500 mt-0.5">{job.department}</p>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5 mb-4">
                  <span className="badge bg-brand-50 text-brand-700">
                    {JOB_TYPE_LABELS[job.jobType] || job.jobType}
                  </span>
                  {job.visaSponsorship && (
                    <span className="badge bg-green-50 text-green-700">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Visa Sponsor
                    </span>
                  )}
                  {job.isRemote && (
                    <span className="badge bg-blue-50 text-blue-700">
                      <Globe className="w-3 h-3 mr-1" />
                      Remote
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs text-gray-500">
                  {(job.locationCity || job.locationState) && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 shrink-0" />
                      {[job.locationCity, job.locationState].filter(Boolean).join(', ')}
                    </span>
                  )}
                  {job.salary && (job.salary.min || job.salary.max) && (
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3 shrink-0" />
                      {job.salary.min ? `$${Math.round(job.salary.min / 1000)}k` : ''}
                      {job.salary.min && job.salary.max ? '–' : ''}
                      {job.salary.max ? `$${Math.round(job.salary.max / 1000)}k` : ''}
                    </span>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-gray-50 text-xs text-gray-400">
                  Posted {format(new Date(job.createdAt), 'MMM d, yyyy')}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </PublicLayout>
  )
}
