import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { X, AlertCircle } from 'lucide-react'
import api from '../../lib/api'
import { Stage, STAGE_CONFIG } from '../../lib/types'

const STAGES: Stage[] = [
  'resume_received', 'screened', 'vetted', 'interview_scheduled',
  'interview_completed', 'client_submitted', 'client_interview',
  'offer_awaiting', 'offer_released', 'h1b_filed', 'hired', 'rejected',
]

interface Props {
  applicationId: string
  currentStage: Stage
  onClose: () => void
}

export default function StageChangeModal({ applicationId, currentStage, onClose }: Props) {
  const [selectedStage, setSelectedStage] = useState<Stage>(currentStage)
  const [note, setNote] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (data: { stage: Stage; noteContent: string; rejectionReason?: string }) =>
      api.patch(`/ats/applications/${applicationId}/stage`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['application', applicationId] })
      queryClient.invalidateQueries({ queryKey: ['applications'] })
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      onClose()
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!note.trim()) return
    mutation.mutate({
      stage: selectedStage,
      noteContent: note,
      rejectionReason: selectedStage === 'rejected' ? rejectionReason : undefined,
    })
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Change Stage</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Stage selector */}
          <div>
            <label className="label">New Stage</label>
            <div className="grid grid-cols-2 gap-2">
              {STAGES.map((stage) => {
                const config = STAGE_CONFIG[stage]
                return (
                  <button
                    key={stage}
                    type="button"
                    onClick={() => setSelectedStage(stage)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium text-left transition-all border ${
                      selectedStage === stage
                        ? `${config.bgColor} ${config.textColor} border-current ring-2 ring-offset-1 ring-current`
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {config.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Rejection reason (only if rejected) */}
          {selectedStage === 'rejected' && (
            <div>
              <label className="label">Rejection Reason *</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. Not enough experience, Location mismatch..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                required
              />
            </div>
          )}

          {/* Mandatory note */}
          <div>
            <label className="label">
              Note <span className="text-red-500">*</span>
              <span className="text-gray-400 font-normal ml-1">(required for stage change)</span>
            </label>
            <textarea
              className="input resize-none"
              rows={3}
              placeholder="Add a note explaining this stage change..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              required
            />
          </div>

          {/* Warning if same stage */}
          {selectedStage === currentStage && (
            <div className="flex items-center gap-2 text-amber-600 text-xs bg-amber-50 px-3 py-2 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0" />
              You're selecting the same stage. The note will still be added.
            </div>
          )}

          {mutation.isError && (
            <p className="text-red-600 text-sm">
              {(mutation.error as any)?.response?.data?.message || 'Failed to update stage'}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={mutation.isPending || !note.trim()}
            >
              {mutation.isPending ? 'Saving...' : 'Update Stage'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
