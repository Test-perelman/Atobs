import { useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ChevronRight, ChevronLeft, CheckCircle2, Upload, X, FileText, Loader2,
} from 'lucide-react'
import PublicLayout from '../../components/layout/PublicLayout'
import api from '../../lib/api'

interface PublicJobDetail {
  id: string
  title: string
  department?: string
  locationCity?: string
  locationState?: string
}

interface Step1Data {
  firstName: string
  lastName: string
  email: string
  phone: string
  city: string
  state: string
  linkedin: string
}

interface Step2Data {
  visaStatus: string
  currentEmployer: string
  experienceYears: string
  salaryExpectation: string
  skills: string
}

const VISA_OPTIONS = [
  { value: 'h1b',      label: 'H1B' },
  { value: 'opt',      label: 'OPT' },
  { value: 'stem_opt', label: 'STEM OPT' },
  { value: 'ead',      label: 'EAD' },
  { value: 'l1',       label: 'L1' },
  { value: 'tn',       label: 'TN' },
  { value: 'gc',       label: 'Green Card' },
  { value: 'citizen',  label: 'US Citizen' },
  { value: 'other',    label: 'Other' },
]

const STEPS = ['Personal Info', 'Visa & Experience', 'Documents']

export default function ApplyForm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Step 1 data
  const [step1, setStep1] = useState<Step1Data>({
    firstName: '', lastName: '', email: '', phone: '',
    city: '', state: '', linkedin: '',
  })

  // Step 2 data
  const [step2, setStep2] = useState<Step2Data>({
    visaStatus: '', currentEmployer: '', experienceYears: '',
    salaryExpectation: '', skills: '',
  })

  // Step 3 — file refs
  const resumeRef = useRef<HTMLInputElement>(null)
  const passportRef = useRef<HTMLInputElement>(null)
  const visaRef = useRef<HTMLInputElement>(null)
  const otherRef = useRef<HTMLInputElement>(null)

  const [files, setFiles] = useState<{
    resume?: File
    passport?: File
    visa?: File
    other?: File
  }>({})

  const { data: job } = useQuery<PublicJobDetail>({
    queryKey: ['public-job-apply', id],
    queryFn: async () => {
      const res = await api.get(`/jobs/${id}`)
      return res.data
    },
    enabled: !!id,
  })

  const handleStep1Change = (field: keyof Step1Data, value: string) =>
    setStep1((prev) => ({ ...prev, [field]: value }))

  const handleStep2Change = (field: keyof Step2Data, value: string) =>
    setStep2((prev) => ({ ...prev, [field]: value }))

  const handleFileChange = (
    field: 'resume' | 'passport' | 'visa' | 'other',
    file?: File,
  ) => setFiles((prev) => ({ ...prev, [field]: file }))

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault()
    if (step < STEPS.length - 1) setStep((s) => s + 1)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!files.resume) {
      setError('A resume is required.')
      return
    }
    setError('')
    setSubmitting(true)

    const formData = new FormData()
    formData.append('firstName', step1.firstName)
    formData.append('lastName', step1.lastName)
    formData.append('email', step1.email)
    if (step1.phone) formData.append('phone', step1.phone)
    if (step1.city) formData.append('locationCity', step1.city)
    if (step1.state) formData.append('locationState', step1.state)
    if (step1.linkedin) formData.append('linkedinUrl', step1.linkedin)
    if (step2.visaStatus) formData.append('visaStatus', step2.visaStatus)
    if (step2.currentEmployer) formData.append('currentEmployer', step2.currentEmployer)
    if (step2.experienceYears) formData.append('experienceYears', step2.experienceYears)
    if (step2.salaryExpectation) formData.append('salaryExpectation', step2.salaryExpectation)
    if (step2.skills) {
      const skillsArray = step2.skills.split(',').map((s) => s.trim()).filter(Boolean)
      formData.append('skills', JSON.stringify(skillsArray))
    }
    formData.append('resume', files.resume)
    if (files.passport) formData.append('passport', files.passport)
    if (files.visa) formData.append('visaDoc', files.visa)
    if (files.other) formData.append('other', files.other)

    try {
      await api.post(`/jobs/${id}/apply`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setSubmitted(true)
    } catch (err: any) {
      setError(
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        'Submission failed. Please try again.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <PublicLayout>
        <div className="max-w-lg mx-auto px-4 py-20 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted!</h1>
          <p className="text-gray-500 mb-2">
            Thank you for applying{job ? ` for <strong>${job.title}</strong>` : ''}.
          </p>
          <p className="text-gray-500 mb-8">
            We'll review your application and reach out if there's a match.
          </p>
          <button onClick={() => navigate('/')} className="btn-primary">
            View More Jobs
          </button>
        </div>
      </PublicLayout>
    )
  }

  const fileItem = (
    label: string,
    field: 'resume' | 'passport' | 'visa' | 'other',
    ref: React.RefObject<HTMLInputElement>,
    required?: boolean,
  ) => (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-gray-50">
      <FileText className="w-5 h-5 text-gray-400 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </p>
        {files[field] ? (
          <p className="text-xs text-gray-500 truncate">{files[field]?.name}</p>
        ) : (
          <p className="text-xs text-gray-400">No file selected</p>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {files[field] && (
          <button
            type="button"
            onClick={() => handleFileChange(field, undefined)}
            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        <button
          type="button"
          onClick={() => ref.current?.click()}
          className="btn-secondary text-xs py-1.5 px-3"
        >
          <Upload className="w-3.5 h-3.5" />
          {files[field] ? 'Change' : 'Upload'}
        </button>
      </div>
      <input
        ref={ref}
        type="file"
        className="hidden"
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
        onChange={(e) => handleFileChange(field, e.target.files?.[0])}
      />
    </div>
  )

  return (
    <PublicLayout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Apply: {job?.title || 'Loading...'}
          </h1>
          {job?.department && (
            <p className="text-brand-600 text-sm mt-1">{job.department}</p>
          )}
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-0 mb-8">
          {STEPS.map((label, i) => (
            <div key={i} className="flex items-center flex-1 last:flex-none">
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-colors ${
                    i < step
                      ? 'bg-brand-600 border-brand-600 text-white'
                      : i === step
                      ? 'border-brand-600 text-brand-600 bg-white'
                      : 'border-gray-200 text-gray-400 bg-white'
                  }`}
                >
                  {i < step ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                </div>
                <span
                  className={`text-sm font-medium hidden sm:block ${
                    i === step ? 'text-brand-700' : i < step ? 'text-gray-600' : 'text-gray-400'
                  }`}
                >
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-3 ${i < step ? 'bg-brand-600' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="card p-6">
          {/* Step 1: Personal Info */}
          {step === 0 && (
            <form onSubmit={handleNext} className="space-y-4">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Personal Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">First Name *</label>
                  <input
                    className="input"
                    required
                    value={step1.firstName}
                    onChange={(e) => handleStep1Change('firstName', e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Last Name *</label>
                  <input
                    className="input"
                    required
                    value={step1.lastName}
                    onChange={(e) => handleStep1Change('lastName', e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="label">Email *</label>
                <input
                  type="email"
                  className="input"
                  required
                  value={step1.email}
                  onChange={(e) => handleStep1Change('email', e.target.value)}
                />
              </div>
              <div>
                <label className="label">Phone</label>
                <input
                  type="tel"
                  className="input"
                  placeholder="+1 (555) 000-0000"
                  value={step1.phone}
                  onChange={(e) => handleStep1Change('phone', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">City</label>
                  <input
                    className="input"
                    value={step1.city}
                    onChange={(e) => handleStep1Change('city', e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">State</label>
                  <input
                    className="input"
                    placeholder="CA"
                    value={step1.state}
                    onChange={(e) => handleStep1Change('state', e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="label">LinkedIn URL</label>
                <input
                  type="url"
                  className="input"
                  placeholder="https://linkedin.com/in/..."
                  value={step1.linkedin}
                  onChange={(e) => handleStep1Change('linkedin', e.target.value)}
                />
              </div>
              <div className="flex justify-end pt-2">
                <button type="submit" className="btn-primary">
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* Step 2: Visa & Experience */}
          {step === 1 && (
            <form onSubmit={handleNext} className="space-y-4">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Visa & Experience</h2>
              <div>
                <label className="label">Visa Status *</label>
                <select
                  className="input"
                  required
                  value={step2.visaStatus}
                  onChange={(e) => handleStep2Change('visaStatus', e.target.value)}
                >
                  <option value="">Select visa status...</option>
                  {VISA_OPTIONS.map((v) => (
                    <option key={v.value} value={v.value}>{v.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Current Employer</label>
                <input
                  className="input"
                  placeholder="Company name"
                  value={step2.currentEmployer}
                  onChange={(e) => handleStep2Change('currentEmployer', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Years of Experience</label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    className="input"
                    placeholder="e.g. 5"
                    value={step2.experienceYears}
                    onChange={(e) => handleStep2Change('experienceYears', e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Salary Expectation ($/yr)</label>
                  <input
                    type="number"
                    min="0"
                    className="input"
                    placeholder="e.g. 120000"
                    value={step2.salaryExpectation}
                    onChange={(e) => handleStep2Change('salaryExpectation', e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="label">Skills</label>
                <input
                  className="input"
                  placeholder="React, Node.js, Python, AWS (comma-separated)"
                  value={step2.skills}
                  onChange={(e) => handleStep2Change('skills', e.target.value)}
                />
                <p className="text-xs text-gray-400 mt-1">Enter skills separated by commas</p>
              </div>
              <div className="flex justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep(0)}
                  className="btn-secondary"
                >
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <button type="submit" className="btn-primary">
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* Step 3: Documents */}
          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Upload Documents</h2>
              <p className="text-sm text-gray-500">
                Upload your resume (required) and any supporting documents.
                Accepted formats: PDF, DOC, DOCX, JPG, PNG. Max 10MB per file.
              </p>

              <div className="space-y-3">
                {fileItem('Resume', 'resume', resumeRef, true)}
                {fileItem('Passport Copy', 'passport', passportRef)}
                {fileItem('Visa Stamp / I-797', 'visa', visaRef)}
                {fileItem('Other Document', 'other', otherRef)}
              </div>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                  {error}
                </div>
              )}

              <div className="flex justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="btn-secondary"
                  disabled={submitting}
                >
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
                    </>
                  ) : (
                    'Submit Application'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </PublicLayout>
  )
}
