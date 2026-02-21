import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import ATSLayout from '../../../components/layout/ATSLayout'
import { Job } from '../../../lib/types'
import api from '../../../lib/api'

interface Recruiter {
  id: string
  fullName: string
  email: string
  role: string
}

interface JobFormData {
  title: string
  publicTitle: string
  department: string
  locationCity: string
  locationState: string
  isRemote: boolean
  jobType: string
  visaSponsorship: boolean
  salaryMin: string
  salaryMax: string
  showSalary: boolean
  publicDescription: string
  prerequisites: string
  responsibilities: string
  internalNotes: string
  assignedRecruiterId: string
  isPublished: boolean
  status: string
}

export default function JobEdit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [form, setForm] = useState<JobFormData | null>(null)
  const [apiError, setApiError] = useState('')

  const { data: job, isLoading } = useQuery<Job>({
    queryKey: ['ats-job', id],
    queryFn: async () => {
      const res = await api.get(`/ats/jobs/${id}`)
      return res.data.job
    },
    enabled: !!id,
  })

  const { data: recruiters = [] } = useQuery<Recruiter[]>({
    queryKey: ['recruiters'],
    queryFn: async () => {
      const res = await api.get('/ats/users/recruiters')
      return res.data
    },
  })

  // Populate form once job loads
  useEffect(() => {
    if (job) {
      setForm({
        title: job.title || '',
        publicTitle: job.publicTitle || '',
        department: job.department || '',
        locationCity: job.locationCity || '',
        locationState: job.locationState || '',
        isRemote: job.isRemote ?? false,
        jobType: job.jobType || 'full_time',
        visaSponsorship: job.visaSponsorship ?? true,
        salaryMin: job.salaryMin ? String(job.salaryMin) : '',
        salaryMax: job.salaryMax ? String(job.salaryMax) : '',
        showSalary: job.showSalary ?? false,
        publicDescription: job.publicDescription || '',
        prerequisites: job.prerequisites || '',
        responsibilities: job.responsibilities || '',
        internalNotes: job.internalNotes || '',
        assignedRecruiterId: job.assignedRecruiter?.id || '',
        isPublished: job.isPublished ?? false,
        status: job.status || 'open',
      })
    }
  }, [job])

  const updateJob = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await api.put(`/ats/jobs/${id}`, data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ats-job', id] })
      queryClient.invalidateQueries({ queryKey: ['ats-jobs'] })
      navigate(`/ats/jobs/${id}`)
    },
    onError: (err: any) => {
      setApiError(err?.response?.data?.error || 'Failed to update job.')
    },
  })

  const handleChange = (field: keyof JobFormData, value: string | boolean) =>
    setForm((prev) => prev ? { ...prev, [field]: value } : prev)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form) return
    setApiError('')
    const payload: Record<string, unknown> = {
      title: form.title,
      publicDescription: form.publicDescription,
      isRemote: form.isRemote,
      jobType: form.jobType,
      visaSponsorship: form.visaSponsorship,
      showSalary: form.showSalary,
      isPublished: form.isPublished,
      status: form.status,
    }
    if (form.publicTitle) payload.publicTitle = form.publicTitle
    if (form.department) payload.department = form.department
    if (form.locationCity) payload.locationCity = form.locationCity
    if (form.locationState) payload.locationState = form.locationState
    if (form.salaryMin) payload.salaryMin = parseInt(form.salaryMin)
    if (form.salaryMax) payload.salaryMax = parseInt(form.salaryMax)
    if (form.prerequisites) payload.prerequisites = form.prerequisites
    if (form.responsibilities) payload.responsibilities = form.responsibilities
    if (form.internalNotes) payload.internalNotes = form.internalNotes
    payload.assignedRecruiterId = form.assignedRecruiterId || null
    updateJob.mutate(payload)
  }

  if (isLoading || !form) {
    return (
      <ATSLayout>
        <div className="p-6 max-w-3xl mx-auto animate-pulse space-y-4">
          <div className="h-8 bg-gray-100 rounded w-1/3" />
          <div className="card p-5 h-48" />
          <div className="card p-5 h-48" />
        </div>
      </ATSLayout>
    )
  }

  return (
    <ATSLayout>
      <div className="p-6 max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(`/ats/jobs/${id}`)}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Edit Job</h1>
            <p className="text-sm text-gray-500">{job?.title}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {apiError && (
            <div className="flex items-center gap-2 bg-red-50 text-red-700 text-sm px-3 py-2.5 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {apiError}
            </div>
          )}

          {/* Basic Info */}
          <div className="card p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Basic Information</h2>
            <div>
              <label className="label">Internal Job Title *</label>
              <input
                className="input"
                required
                value={form.title}
                onChange={(e) => handleChange('title', e.target.value)}
              />
            </div>
            <div>
              <label className="label">Public Title</label>
              <input
                className="input"
                placeholder="Defaults to internal title if blank"
                value={form.publicTitle}
                onChange={(e) => handleChange('publicTitle', e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Department</label>
                <input
                  className="input"
                  value={form.department}
                  onChange={(e) => handleChange('department', e.target.value)}
                />
              </div>
              <div>
                <label className="label">Job Type</label>
                <select
                  className="input"
                  value={form.jobType}
                  onChange={(e) => handleChange('jobType', e.target.value)}
                >
                  <option value="full_time">Full Time</option>
                  <option value="contract">Contract</option>
                  <option value="c2c">C2C</option>
                  <option value="w2">W2</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">City</label>
                <input
                  className="input"
                  value={form.locationCity}
                  onChange={(e) => handleChange('locationCity', e.target.value)}
                />
              </div>
              <div>
                <label className="label">State</label>
                <input
                  className="input"
                  value={form.locationState}
                  onChange={(e) => handleChange('locationState', e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isRemote}
                  onChange={(e) => handleChange('isRemote', e.target.checked)}
                  className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                />
                Remote OK
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.visaSponsorship}
                  onChange={(e) => handleChange('visaSponsorship', e.target.checked)}
                  className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                />
                Visa Sponsorship
              </label>
            </div>
          </div>

          {/* Salary */}
          <div className="card p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Compensation</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Min Salary ($/yr)</label>
                <input
                  type="number"
                  className="input"
                  value={form.salaryMin}
                  onChange={(e) => handleChange('salaryMin', e.target.value)}
                />
              </div>
              <div>
                <label className="label">Max Salary ($/yr)</label>
                <input
                  type="number"
                  className="input"
                  value={form.salaryMax}
                  onChange={(e) => handleChange('salaryMax', e.target.value)}
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={form.showSalary}
                onChange={(e) => handleChange('showSalary', e.target.checked)}
                className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              />
              Show salary on public job board
            </label>
          </div>

          {/* Description */}
          <div className="card p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Job Content</h2>
            <div>
              <label className="label">Public Description *</label>
              <textarea
                className="input resize-none"
                rows={6}
                required
                value={form.publicDescription}
                onChange={(e) => handleChange('publicDescription', e.target.value)}
              />
            </div>
            <div>
              <label className="label">Responsibilities</label>
              <textarea
                className="input resize-none"
                rows={4}
                value={form.responsibilities}
                onChange={(e) => handleChange('responsibilities', e.target.value)}
              />
            </div>
            <div>
              <label className="label">Requirements / Prerequisites</label>
              <textarea
                className="input resize-none"
                rows={4}
                value={form.prerequisites}
                onChange={(e) => handleChange('prerequisites', e.target.value)}
              />
            </div>
            <div>
              <label className="label">Internal Notes</label>
              <textarea
                className="input resize-none"
                rows={3}
                value={form.internalNotes}
                onChange={(e) => handleChange('internalNotes', e.target.value)}
              />
            </div>
          </div>

          {/* Settings */}
          <div className="card p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Settings</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Status</label>
                <select
                  className="input"
                  value={form.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                >
                  <option value="open">Open</option>
                  <option value="on_hold">On Hold</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <div>
                <label className="label">Assigned Recruiter</label>
                <select
                  className="input"
                  value={form.assignedRecruiterId}
                  onChange={(e) => handleChange('assignedRecruiterId', e.target.value)}
                >
                  <option value="">Unassigned</option>
                  {recruiters.map((r) => (
                    <option key={r.id} value={r.id}>{r.fullName}</option>
                  ))}
                </select>
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isPublished}
                onChange={(e) => handleChange('isPublished', e.target.checked)}
                className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              />
              Publish to public job board
            </label>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate(`/ats/jobs/${id}`)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={updateJob.isPending}
            >
              {updateJob.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </ATSLayout>
  )
}
