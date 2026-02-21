import { Link } from 'react-router-dom'
import { MapPin, Briefcase, FileText, MessageSquare } from 'lucide-react'
import StageTag from './StageTag'
import { Application, VISA_LABELS } from '../../lib/types'
import { format } from 'date-fns'

interface Props {
  application: Application
}

export default function CandidateRow({ application }: Props) {
  const c = application.candidate!
  const skills: string[] = c.skills ? JSON.parse(c.skills) : []

  return (
    <Link
      to={`/ats/applications/${application.id}`}
      className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
    >
      {/* Name + location */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-brand-600 hover:text-brand-700 truncate">
            {c.firstName} {c.lastName}
          </span>
          {c.visaStatus && (
            <span className="badge bg-indigo-50 text-indigo-600 hidden sm:inline-flex">
              {VISA_LABELS[c.visaStatus] || c.visaStatus}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
          {(c.locationCity || c.locationState) && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {[c.locationCity, c.locationState].filter(Boolean).join(', ')}
            </span>
          )}
          {c.currentEmployer && (
            <span className="flex items-center gap-1 hidden sm:flex">
              <Briefcase className="w-3 h-3" />
              {c.currentEmployer}
            </span>
          )}
        </div>
      </div>

      {/* Stage */}
      <div className="shrink-0">
        <StageTag stage={application.stage} />
      </div>

      {/* Applied date */}
      <div className="text-xs text-gray-400 w-20 text-right hidden md:block">
        {format(new Date(application.appliedAt), 'MMM d, yyyy')}
      </div>

      {/* Counts */}
      <div className="flex items-center gap-3 text-xs text-gray-400 shrink-0">
        {application._count && application._count.notes > 0 && (
          <span className="flex items-center gap-1">
            <MessageSquare className="w-3 h-3" />
            {application._count.notes}
          </span>
        )}
        {application._count && application._count.documents > 0 && (
          <span className="flex items-center gap-1">
            <FileText className="w-3 h-3" />
            {application._count.documents}
          </span>
        )}
      </div>

      {/* Recruiter */}
      {application.assignedRecruiter && (
        <div className="text-xs text-gray-400 w-28 truncate hidden lg:block">
          {application.assignedRecruiter.fullName}
        </div>
      )}
    </Link>
  )
}
