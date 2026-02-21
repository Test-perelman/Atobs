import { useQuery } from '@tanstack/react-query'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  MapPin, Briefcase, Globe, DollarSign, CheckCircle2,
  ArrowLeft, Clock, Building2,
} from 'lucide-react'
import PublicLayout from '../../components/layout/PublicLayout'
import { JOB_TYPE_LABELS } from '../../lib/types'
import api from '../../lib/api'
import { format } from 'date-fns'

interface PublicJobDetail {
  id: string
  title: string
  department?: string
  locationCity?: string
  locationState?: string
  isRemote: boolean
  jobType: string
  visaSponsorship: boolean
  description: string
  prerequisites?: string
  responsibilities?: string
  salary: { min?: number; max?: number } | null
  createdAt: string
}

export default function JobDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: job, isLoading, isError } = useQuery<PublicJobDetail>({
    queryKey: ['public-job', id],
    queryFn: async () => {
      const res = await api.get(`/jobs/${id}`)
      return res.data
    },
    enabled: !!id,
  })

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 animate-pulse">
          <div className="h-8 bg-gray-100 rounded w-1/2 mb-4" />
          <div className="h-4 bg-gray-100 rounded w-1/3 mb-8" />
          <div className="space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-100 rounded w-full" />
            ))}
          </div>
        </div>
      </PublicLayout>
    )
  }

  if (isError || !job) {
    return (
      <PublicLayout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-20 text-center">
          <Briefcase className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Job Not Found</h2>
          <p className="text-gray-500 mb-6">This position may have been filled or is no longer active.</p>
          <Link to="/" className="btn-primary">View All Jobs</Link>
        </div>
      </PublicLayout>
    )
  }

  return (
    <PublicLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Back link */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-600 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Jobs
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2">
            <div className="card p-6 mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{job.title}</h1>
              {job.department && (
                <p className="text-brand-600 font-medium text-sm mb-4">{job.department}</p>
              )}

              {/* Meta chips */}
              <div className="flex flex-wrap gap-2 mb-6">
                <span className="badge bg-brand-50 text-brand-700">
                  {JOB_TYPE_LABELS[job.jobType] || job.jobType}
                </span>
                {job.visaSponsorship && (
                  <span className="badge bg-green-50 text-green-700">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Visa Sponsorship Available
                  </span>
                )}
                {job.isRemote && (
                  <span className="badge bg-blue-50 text-blue-700">
                    <Globe className="w-3 h-3 mr-1" />
                    Remote
                  </span>
                )}
              </div>

              {/* Quick info */}
              <div className="flex flex-wrap gap-6 text-sm text-gray-600 pb-6 border-b border-gray-100">
                {(job.locationCity || job.locationState) && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    {[job.locationCity, job.locationState].filter(Boolean).join(', ')}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-gray-400" />
                  {JOB_TYPE_LABELS[job.jobType] || job.jobType}
                </span>
                {job.salary && (job.salary.min || job.salary.max) && (
                  <span className="flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-gray-400" />
                    {job.salary.min ? `$${Math.round(job.salary.min / 1000)}k` : ''}
                    {job.salary.min && job.salary.max ? ' – ' : ''}
                    {job.salary.max ? `$${Math.round(job.salary.max / 1000)}k` : ''}
                    / year
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-gray-400" />
                  Posted {format(new Date(job.createdAt), 'MMMM d, yyyy')}
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="card p-6 mb-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Job Description</h2>
              <div className="prose prose-sm max-w-none text-gray-600 whitespace-pre-wrap leading-relaxed">
                {job.description}
              </div>
            </div>

            {/* Responsibilities */}
            {job.responsibilities && (
              <div className="card p-6 mb-6">
                <h2 className="text-base font-semibold text-gray-900 mb-4">Responsibilities</h2>
                <div className="prose prose-sm max-w-none text-gray-600 whitespace-pre-wrap leading-relaxed">
                  {job.responsibilities}
                </div>
              </div>
            )}

            {/* Prerequisites */}
            {job.prerequisites && (
              <div className="card p-6 mb-6">
                <h2 className="text-base font-semibold text-gray-900 mb-4">Requirements</h2>
                <div className="prose prose-sm max-w-none text-gray-600 whitespace-pre-wrap leading-relaxed">
                  {job.prerequisites}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Apply CTA */}
            <div className="card p-5 text-center">
              <h3 className="font-semibold text-gray-900 mb-1">Interested in this role?</h3>
              <p className="text-sm text-gray-500 mb-4">
                Submit your application and we'll be in touch.
              </p>
              <Link
                to={`/jobs/${job.id}/apply`}
                className="btn-primary w-full justify-center"
              >
                Apply Now
              </Link>
            </div>

            {/* Job summary */}
            <div className="card p-5">
              <h3 className="font-semibold text-gray-900 mb-4 text-sm uppercase tracking-wide text-gray-500">
                Job Summary
              </h3>
              <div className="space-y-3 text-sm">
                {job.department && (
                  <div className="flex items-start gap-3">
                    <Building2 className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400">Department</p>
                      <p className="text-gray-700 font-medium">{job.department}</p>
                    </div>
                  </div>
                )}
                {(job.locationCity || job.locationState) && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400">Location</p>
                      <p className="text-gray-700 font-medium">
                        {[job.locationCity, job.locationState].filter(Boolean).join(', ')}
                        {job.isRemote && ' (Remote)'}
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <Briefcase className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">Job Type</p>
                    <p className="text-gray-700 font-medium">
                      {JOB_TYPE_LABELS[job.jobType] || job.jobType}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">Visa Sponsorship</p>
                    <p className="text-gray-700 font-medium">
                      {job.visaSponsorship ? 'Available' : 'Not available'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  )
}
