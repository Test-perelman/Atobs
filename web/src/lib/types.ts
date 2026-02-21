export type UserRole = 'admin' | 'recruiter' | 'hiring_manager' | 'viewer'
export type JobStatus = 'open' | 'on_hold' | 'closed'
export type JobType = 'full_time' | 'contract' | 'c2c' | 'w2'
export type VisaStatus = 'h1b' | 'opt' | 'stem_opt' | 'ead' | 'l1' | 'tn' | 'gc' | 'citizen' | 'other'
export type DocType = 'resume' | 'passport' | 'visa_stamp' | 'i797' | 'i94' | 'ead' | 'lca' | 'offer_letter' | 'other'

export type Stage =
  | 'resume_received'
  | 'screened'
  | 'vetted'
  | 'interview_scheduled'
  | 'interview_completed'
  | 'client_submitted'
  | 'client_interview'
  | 'offer_awaiting'
  | 'offer_released'
  | 'h1b_filed'
  | 'rejected'
  | 'hired'

export interface User {
  id: string
  email: string
  fullName: string
  role: UserRole
  isActive: boolean
  lastLoginAt?: string
  createdAt: string
}

export interface Job {
  id: string
  title: string
  publicTitle?: string
  department?: string
  locationCity?: string
  locationState?: string
  isRemote: boolean
  jobType: JobType
  visaSponsorship: boolean
  internalNotes?: string
  salaryMin?: number
  salaryMax?: number
  publicDescription: string
  prerequisites?: string
  responsibilities?: string
  showSalary: boolean
  isPublished: boolean
  status: JobStatus
  closedAt?: string
  createdAt: string
  updatedAt: string
  createdBy?: Pick<User, 'id' | 'fullName' | 'email'>
  assignedRecruiter?: Pick<User, 'id' | 'fullName' | 'email'>
  stats?: {
    total: number
    unprocessed: number
    processed: number
    hired: number
    rejected: number
  }
  stageCounts?: Record<string, number>
}

export interface Candidate {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  locationCity?: string
  locationState?: string
  linkedinUrl?: string
  visaStatus?: VisaStatus
  visaExpiryDate?: string
  passportCountry?: string
  passportExpiry?: string
  i94Number?: string
  currentEmployer?: string
  experienceYears?: number
  salaryExpectation?: number
  skills?: string
  source?: string
  createdAt: string
  updatedAt: string
}

export interface Application {
  id: string
  jobId: string
  candidateId: string
  stage: Stage
  isProcessed: boolean
  rejectionReason?: string
  appliedAt: string
  updatedAt: string
  candidate?: Candidate
  job?: Pick<Job, 'id' | 'title' | 'locationCity' | 'locationState' | 'jobType' | 'status'>
  assignedRecruiter?: Pick<User, 'id' | 'fullName'>
  notes?: Note[]
  documents?: Document[]
  auditLogs?: AuditLog[]
  _count?: { notes: number; documents: number }
}

export interface Note {
  id: string
  applicationId: string
  content: string
  stageAtTime?: Stage
  isStageNote: boolean
  createdAt: string
  author: Pick<User, 'id' | 'fullName' | 'role'>
}

export interface Document {
  id: string
  docType: DocType
  originalFilename: string
  storagePath: string
  fileSizeBytes?: number
  mimeType?: string
  uploadedAt: string
  uploadedBy?: Pick<User, 'id' | 'fullName'>
}

export interface AuditLog {
  id: string
  entityType: string
  entityId: string
  action: string
  oldValue?: string
  newValue?: string
  ipAddress?: string
  createdAt: string
  performedBy?: Pick<User, 'fullName'>
}

export interface AuthUser {
  id: string
  email: string
  fullName: string
  role: UserRole
}

export const STAGE_CONFIG: Record<Stage, { label: string; color: string; bgColor: string; textColor: string }> = {
  resume_received:     { label: 'Resume Received',     color: 'gray',   bgColor: 'bg-gray-100',   textColor: 'text-gray-700'   },
  screened:            { label: 'Screened',            color: 'blue',   bgColor: 'bg-blue-100',   textColor: 'text-blue-700'   },
  vetted:              { label: 'Vetted',              color: 'indigo', bgColor: 'bg-indigo-100', textColor: 'text-indigo-700' },
  interview_scheduled: { label: 'Interview Scheduled', color: 'purple', bgColor: 'bg-purple-100', textColor: 'text-purple-700' },
  interview_completed: { label: 'Interview Completed', color: 'violet', bgColor: 'bg-violet-100', textColor: 'text-violet-700' },
  client_submitted:    { label: 'Client Submitted',    color: 'amber',  bgColor: 'bg-amber-100',  textColor: 'text-amber-700'  },
  client_interview:    { label: 'Client Interview',    color: 'orange', bgColor: 'bg-orange-100', textColor: 'text-orange-700' },
  offer_awaiting:      { label: 'Offer Awaiting',      color: 'yellow', bgColor: 'bg-yellow-100', textColor: 'text-yellow-700' },
  offer_released:      { label: 'Offer Released',      color: 'teal',   bgColor: 'bg-teal-100',   textColor: 'text-teal-700'   },
  h1b_filed:           { label: 'H1B Filed',           color: 'cyan',   bgColor: 'bg-cyan-100',   textColor: 'text-cyan-700'   },
  hired:               { label: 'Hired',               color: 'green',  bgColor: 'bg-green-100',  textColor: 'text-green-700'  },
  rejected:            { label: 'Rejected',            color: 'red',    bgColor: 'bg-red-100',    textColor: 'text-red-700'    },
}

export const VISA_LABELS: Record<string, string> = {
  h1b: 'H1B', opt: 'OPT', stem_opt: 'STEM OPT', ead: 'EAD',
  l1: 'L1', tn: 'TN', gc: 'Green Card', citizen: 'US Citizen', other: 'Other',
}

export const JOB_TYPE_LABELS: Record<string, string> = {
  full_time: 'Full Time', contract: 'Contract', c2c: 'C2C', w2: 'W2',
}
