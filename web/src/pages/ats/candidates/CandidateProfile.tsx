import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Phone, Mail, Linkedin, MapPin, ChevronRight, Briefcase,
  DollarSign, Calendar, Tag,
} from 'lucide-react'
import ATSLayout from '../../../components/layout/ATSLayout'
import StageTag from '../../../components/pipeline/StageTag'
import StageChangeModal from '../../../components/candidate/StageChangeModal'
import NotesTimeline from '../../../components/candidate/NotesTimeline'
import DocumentVault from '../../../components/candidate/DocumentVault'
import { Application, VISA_LABELS, JOB_TYPE_LABELS } from '../../../lib/types'
import api from '../../../lib/api'
import { format } from 'date-fns'

interface Recruiter {
  id: string
  fullName: string
  email: string
  role: string
}

type ProfileTab = 'profile' | 'notes' | 'documents'

export default function CandidateProfile() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<ProfileTab>('profile')
  const [stageModalOpen, setStageModalOpen] = useState(false)

  const { data: application, isLoading, isError } = useQuery<Application>({
    queryKey: ['application', id],
    queryFn: async () => {
      const res = await api.get(`/ats/applications/${id}`)
      return res.data
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

  const assignRecruiter = useMutation({
    mutationFn: (recruiterId: string | null) =>
      api.patch(`/ats/applications/${id}/assign`, { recruiterId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['application', id] })
    },
  })

  if (isLoading) {
    return (
      <ATSLayout>
        <div className="p-6 animate-pulse space-y-4 max-w-5xl mx-auto">
          <div className="h-8 bg-gray-100 rounded w-1/3" />
          <div className="card h-32" />
          <div className="card h-64" />
        </div>
      </ATSLayout>
    )
  }

  if (isError || !application) {
    return (
      <ATSLayout>
        <div className="p-6">
          <p className="text-gray-500">Application not found.</p>
          <Link to="/ats/candidates" className="text-brand-600 hover:underline text-sm">
            Back to Candidates
          </Link>
        </div>
      </ATSLayout>
    )
  }

  const c = application.candidate!
  const skills: string[] = c.skills ? (() => { try { return JSON.parse(c.skills!) } catch { return [] } })() : []

  return (
    <ATSLayout>
      <div className="flex h-full">
        {/* Main content */}
        <div className="flex-1 overflow-auto min-w-0">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-5">
            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-3">
              <Link to="/ats/candidates" className="hover:text-brand-600 transition-colors">
                Candidates
              </Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-gray-900 font-medium">
                {c.firstName} {c.lastName}
              </span>
            </div>

            {/* Name + applied date */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {c.firstName} {c.lastName}
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  Applied {format(new Date(application.appliedAt), 'MMMM d, yyyy')}
                  {application.job && (
                    <>
                      {' '}for{' '}
                      <Link
                        to={`/ats/jobs/${application.job.id}`}
                        className="text-brand-600 hover:text-brand-700"
                      >
                        {application.job.title}
                      </Link>
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Contact strip */}
            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-600">
              {c.phone && (
                <a href={`tel:${c.phone}`} className="flex items-center gap-1.5 hover:text-brand-600">
                  <Phone className="w-3.5 h-3.5 text-gray-400" />
                  {c.phone}
                </a>
              )}
              <a href={`mailto:${c.email}`} className="flex items-center gap-1.5 hover:text-brand-600">
                <Mail className="w-3.5 h-3.5 text-gray-400" />
                {c.email}
              </a>
              {c.linkedinUrl && (
                <a
                  href={c.linkedinUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 hover:text-brand-600"
                >
                  <Linkedin className="w-3.5 h-3.5 text-gray-400" />
                  LinkedIn
                </a>
              )}
              {(c.locationCity || c.locationState) && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" />
                  {[c.locationCity, c.locationState].filter(Boolean).join(', ')}
                </span>
              )}
              {c.visaStatus && (
                <span className="badge bg-indigo-50 text-indigo-700">
                  {VISA_LABELS[c.visaStatus] || c.visaStatus}
                </span>
              )}
            </div>

            {/* Tab nav */}
            <div className="flex gap-0 mt-4 border-b border-gray-100 -mb-5">
              {(['profile', 'notes', 'documents'] as ProfileTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors capitalize ${
                    activeTab === tab
                      ? 'border-brand-600 text-brand-700'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab}
                  {tab === 'notes' && application.notes && application.notes.length > 0 && (
                    <span className="ml-1.5 badge bg-gray-100 text-gray-600 text-xs">
                      {application.notes.length}
                    </span>
                  )}
                  {tab === 'documents' && application.documents && application.documents.length > 0 && (
                    <span className="ml-1.5 badge bg-gray-100 text-gray-600 text-xs">
                      {application.documents.length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tab content */}
          <div className="p-6">
            {/* PROFILE tab */}
            {activeTab === 'profile' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: 'Visa Status', value: c.visaStatus ? (VISA_LABELS[c.visaStatus] || c.visaStatus) : null },
                  { label: 'Visa Expiry', value: c.visaExpiryDate ? format(new Date(c.visaExpiryDate), 'MMM d, yyyy') : null },
                  { label: 'Passport Country', value: c.passportCountry },
                  { label: 'Passport Expiry', value: c.passportExpiry ? format(new Date(c.passportExpiry), 'MMM d, yyyy') : null },
                  { label: 'Current Employer', value: c.currentEmployer },
                  { label: 'Years of Experience', value: c.experienceYears != null ? `${c.experienceYears} years` : null },
                  { label: 'Salary Expectation', value: c.salaryExpectation ? `$${c.salaryExpectation.toLocaleString()} / yr` : null },
                  { label: 'Location', value: [c.locationCity, c.locationState].filter(Boolean).join(', ') || null },
                  { label: 'Source', value: c.source },
                ].map(({ label, value }) =>
                  value ? (
                    <div key={label} className="card p-4">
                      <p className="text-xs text-gray-400 mb-1">{label}</p>
                      <p className="text-sm font-medium text-gray-800">{value}</p>
                    </div>
                  ) : null
                )}

                {/* Skills */}
                {skills.length > 0 && (
                  <div className="card p-4 sm:col-span-2">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Tag className="w-3.5 h-3.5 text-gray-400" />
                      <p className="text-xs text-gray-400">Skills</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {skills.map((skill) => (
                        <span key={skill} className="badge bg-brand-50 text-brand-700">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Job info */}
                {application.job && (
                  <div className="card p-4 sm:col-span-2">
                    <p className="text-xs text-gray-400 mb-2">Applied for</p>
                    <div className="flex flex-wrap items-center gap-3 text-sm">
                      <Link
                        to={`/ats/jobs/${application.job.id}`}
                        className="font-medium text-brand-600 hover:text-brand-700"
                      >
                        {application.job.title}
                      </Link>
                      {application.job.jobType && (
                        <span className="badge bg-gray-100 text-gray-600">
                          {JOB_TYPE_LABELS[application.job.jobType] || application.job.jobType}
                        </span>
                      )}
                      {(application.job.locationCity || application.job.locationState) && (
                        <span className="flex items-center gap-1 text-gray-500">
                          <MapPin className="w-3 h-3" />
                          {[application.job.locationCity, application.job.locationState].filter(Boolean).join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* NOTES tab */}
            {activeTab === 'notes' && (
              <NotesTimeline
                applicationId={id!}
                notes={application.notes ?? []}
                currentStage={application.stage}
              />
            )}

            {/* DOCUMENTS tab */}
            {activeTab === 'documents' && (
              <DocumentVault
                applicationId={id!}
                documents={application.documents ?? []}
              />
            )}
          </div>
        </div>

        {/* Right rail */}
        <aside className="w-72 border-l border-gray-200 bg-white p-5 shrink-0 overflow-auto">
          {/* Stage */}
          <div className="mb-5">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Current Stage
            </h3>
            <StageTag stage={application.stage} />
            <button
              onClick={() => setStageModalOpen(true)}
              className="mt-2 btn-secondary text-xs py-1.5 px-3 w-full justify-center"
            >
              Change Stage
            </button>
          </div>

          {/* Rejection reason */}
          {application.stage === 'rejected' && application.rejectionReason && (
            <div className="mb-5 p-3 bg-red-50 rounded-lg">
              <p className="text-xs font-medium text-red-700 mb-1">Rejection Reason</p>
              <p className="text-xs text-red-600">{application.rejectionReason}</p>
            </div>
          )}

          {/* Assigned recruiter */}
          <div className="mb-5">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Assigned Recruiter
            </h3>
            <select
              className="input text-sm"
              value={application.assignedRecruiter?.id || ''}
              onChange={(e) => assignRecruiter.mutate(e.target.value || null)}
              disabled={assignRecruiter.isPending}
            >
              <option value="">Unassigned</option>
              {recruiters.map((r) => (
                <option key={r.id} value={r.id}>{r.fullName}</option>
              ))}
            </select>
          </div>

          {/* Candidate info snippet */}
          <div className="mb-5">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Quick Info
            </h3>
            <div className="space-y-2 text-sm">
              {c.currentEmployer && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Briefcase className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  {c.currentEmployer}
                </div>
              )}
              {c.experienceYears != null && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  {c.experienceYears} years exp
                </div>
              )}
              {c.salaryExpectation && (
                <div className="flex items-center gap-2 text-gray-600">
                  <DollarSign className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  ${c.salaryExpectation.toLocaleString()} / yr
                </div>
              )}
              {application.job && (
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-xs text-gray-400 mb-1">Job</p>
                  <Link
                    to={`/ats/jobs/${application.job.id}`}
                    className="text-brand-600 hover:text-brand-700 text-sm"
                  >
                    {application.job.title}
                  </Link>
                </div>
              )}
              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-400 mb-1">Applied</p>
                <p className="text-gray-700">
                  {format(new Date(application.appliedAt), 'MMM d, yyyy')}
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Stage change modal */}
      {stageModalOpen && (
        <StageChangeModal
          applicationId={id!}
          currentStage={application.stage}
          onClose={() => setStageModalOpen(false)}
        />
      )}
    </ATSLayout>
  )
}
