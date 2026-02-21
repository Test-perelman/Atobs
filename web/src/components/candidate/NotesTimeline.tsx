import { useState, useRef, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { MessageSquare, Plus, ArrowRight, CheckCircle2, Clock, User, Circle, MousePointerClick } from 'lucide-react'
import { Note, Stage, STAGE_CONFIG } from '../../lib/types'
import api from '../../lib/api'
import { format, formatDistanceToNow } from 'date-fns'

const PIPELINE_STAGES: Stage[] = [
  'resume_received', 'screened', 'vetted', 'interview_scheduled',
  'interview_completed', 'client_submitted', 'client_interview',
  'offer_awaiting', 'offer_released', 'h1b_filed',
]

const STAGE_DOT_COLORS: Record<string, string> = {
  gray: '#6b7280', blue: '#3b82f6', indigo: '#6366f1', purple: '#a855f7',
  violet: '#8b5cf6', amber: '#f59e0b', orange: '#f97316', yellow: '#eab308',
  teal: '#14b8a6', cyan: '#06b6d4', green: '#22c55e', red: '#ef4444',
}

function stageColor(stage: Stage): string {
  return STAGE_DOT_COLORS[STAGE_CONFIG[stage]?.color] ?? '#6b7280'
}

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
}

interface TooltipState {
  stage: Stage
  x: number   // viewport coords, center of dot
  y: number   // viewport coords, top of dot
}

interface Props {
  applicationId: string
  notes: Note[]
  currentStage: Stage
}

export default function NotesTimeline({ applicationId, notes, currentStage }: Props) {
  const [content, setContent] = useState('')
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)
  const [highlightedNoteId, setHighlightedNoteId] = useState<string | null>(null)
  const noteRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const queryClient = useQueryClient()

  const addNote = useMutation({
    mutationFn: (content: string) =>
      api.post(`/ats/applications/${applicationId}/notes`, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['application', applicationId] })
      setContent('')
    },
  })

  // ─── Derived data ─────────────────────────────────────────────────────────
  const isRejected = currentStage === 'rejected'
  const isHired = currentStage === 'hired'
  const currentPipelineIdx = PIPELINE_STAGES.indexOf(currentStage)

  const sortedNotes = [...notes].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  )

  // First stage-note for each stage (for tooltip + scroll target)
  const stageNoteMap = new Map<Stage, Note>()
  for (const note of sortedNotes) {
    if (note.isStageNote && note.stageAtTime) {
      const s = note.stageAtTime as Stage
      if (!stageNoteMap.has(s)) stageNoteMap.set(s, note)
    }
  }

  // ─── Click: scroll to note + highlight ────────────────────────────────────
  function handleStageClick(stage: Stage) {
    const note = stageNoteMap.get(stage)
    if (!note) return
    const el = noteRefs.current.get(note.id)
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    setHighlightedNoteId(note.id)
    setTimeout(() => setHighlightedNoteId(null), 1800)
  }

  // ─── Hover: show tooltip ──────────────────────────────────────────────────
  function handleDotEnter(e: React.MouseEvent<HTMLButtonElement>, stage: Stage) {
    const rect = e.currentTarget.getBoundingClientRect()
    setTooltip({
      stage,
      x: rect.left + rect.width / 2,
      y: rect.top,
    })
  }

  function handleDotLeave() {
    setTooltip(null)
  }

  // Close tooltip on scroll (position would drift)
  useEffect(() => {
    const onScroll = () => setTooltip(null)
    window.addEventListener('scroll', onScroll, true)
    return () => window.removeEventListener('scroll', onScroll, true)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return
    addNote.mutate(content)
  }

  // ─── Tooltip content ──────────────────────────────────────────────────────
  function renderTooltip() {
    if (!tooltip) return null
    const { stage, x, y } = tooltip
    const note = stageNoteMap.get(stage)
    const color = stageColor(stage)
    const label = STAGE_CONFIG[stage].label
    const stageIdx = PIPELINE_STAGES.indexOf(stage)
    const isReachable = !isRejected && (stageIdx <= currentPipelineIdx || isHired)
    const hasActivity = !!note

    // Tooltip width
    const TW = 280
    // Clamp x so it doesn't overflow viewport edges
    const clampedX = Math.max(TW / 2 + 8, Math.min(x, window.innerWidth - TW / 2 - 8))

    return (
      <div
        className="fixed z-50 pointer-events-none"
        style={{
          left: clampedX,
          top: y - 8,
          transform: 'translate(-50%, -100%)',
          width: TW,
        }}
      >
        {/* Arrow */}
        <div
          className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 border-r border-b border-gray-100 bg-white"
        />
        <div
          className="bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden"
          style={{ boxShadow: `0 8px 30px ${color}22, 0 2px 8px rgba(0,0,0,0.08)` }}
        >
          {/* Header */}
          <div
            className="px-3.5 py-2.5 flex items-center gap-2"
            style={{ background: `${color}15`, borderBottom: `1px solid ${color}22` }}
          >
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: color }}
            >
              {isReachable && hasActivity
                ? <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                : isReachable
                ? <Clock className="w-3.5 h-3.5 text-white" />
                : <Circle className="w-2.5 h-2.5 text-white" />
              }
            </div>
            <span className="text-xs font-semibold" style={{ color }}>{label}</span>
          </div>

          {/* Body */}
          <div className="px-3.5 py-3">
            {!isReachable ? (
              <p className="text-xs text-gray-400 italic">Not reached yet</p>
            ) : !hasActivity ? (
              <div>
                <p className="text-xs text-gray-400 italic">No notes recorded at this stage</p>
                {stage === currentStage && (
                  <p className="text-[11px] text-gray-400 mt-1">Currently at this stage</p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {/* Note snippet */}
                <p className="text-xs text-gray-700 leading-relaxed line-clamp-3">
                  {note!.content}
                </p>

                {/* Divider */}
                <div className="border-t border-gray-50 pt-2 flex items-center gap-2">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-white shrink-0"
                    style={{ backgroundColor: color, fontSize: '8px', fontWeight: 700 }}
                  >
                    {initials(note!.author.fullName)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-gray-700 truncate">
                      {note!.author.fullName}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {format(new Date(note!.createdAt), 'MMM d, yyyy · h:mm a')}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer hint */}
          {isReachable && hasActivity && (
            <div
              className="px-3.5 py-2 flex items-center gap-1.5 border-t border-gray-50"
              style={{ background: `${color}08` }}
            >
              <MousePointerClick className="w-3 h-3 shrink-0" style={{ color }} />
              <span className="text-[10px]" style={{ color }}>Click to jump to this note</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* ── Stage Progress Bar ────────────────────────────────────────────── */}
      <div className="card p-5">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-5">
          Pipeline Progress
        </h3>

        <div className="overflow-x-auto pb-3">
          <div className="relative min-w-[680px]">

            {/* Base track */}
            <div className="absolute top-[18px] left-[28px] right-[28px] h-0.5 bg-gray-100 z-0" />

            {/* Filled progress track */}
            {!isRejected && currentPipelineIdx > 0 && (
              <div
                className="absolute top-[18px] left-[28px] h-0.5 z-0 transition-all duration-700"
                style={{
                  width: `calc(${(currentPipelineIdx / (PIPELINE_STAGES.length - 1)) * 100}% - 28px)`,
                  background: `linear-gradient(to right, ${stageColor('resume_received')}, ${stageColor(currentStage)})`,
                }}
              />
            )}

            {/* Stage nodes */}
            <div className="relative z-10 flex items-start justify-between">
              {PIPELINE_STAGES.map((stage, idx) => {
                const color = stageColor(stage)
                const isPast = !isRejected && idx < currentPipelineIdx
                const isCurrent = stage === currentStage && !isRejected
                const isFuture = isRejected ? true : idx > currentPipelineIdx
                const hasNote = stageNoteMap.has(stage)
                const isClickable = (isPast || isCurrent) && hasNote
                const label = STAGE_CONFIG[stage].label

                return (
                  <div
                    key={stage}
                    className="flex flex-col items-center"
                    style={{ width: `${100 / PIPELINE_STAGES.length}%` }}
                  >
                    {/* Interactive dot */}
                    <button
                      type="button"
                      onClick={() => isClickable && handleStageClick(stage)}
                      onMouseEnter={(e) => handleDotEnter(e, stage)}
                      onMouseLeave={handleDotLeave}
                      className="relative focus:outline-none group"
                      style={{ cursor: isClickable ? 'pointer' : isFuture ? 'default' : 'default' }}
                      aria-label={label}
                    >
                      {/* Pulse ring on current */}
                      {isCurrent && (
                        <span
                          className="absolute inset-0 rounded-full animate-ping opacity-30"
                          style={{ backgroundColor: color }}
                        />
                      )}

                      {/* Hover scale ring */}
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center border-2 border-white transition-transform duration-150 shadow-sm ${
                          isClickable ? 'group-hover:scale-110' : ''
                        }`}
                        style={{
                          backgroundColor: isFuture ? '#e5e7eb' : color,
                          boxShadow: isCurrent
                            ? `0 0 0 3px ${color}33, 0 0 0 5px ${color}18`
                            : isClickable
                            ? undefined
                            : undefined,
                        }}
                      >
                        {isPast && <CheckCircle2 className="w-4 h-4 text-white" />}
                        {isCurrent && <Clock className="w-4 h-4 text-white" />}
                        {isFuture && <Circle className="w-3 h-3 text-gray-300" />}
                      </div>

                      {/* Tiny "has note" pip */}
                      {isPast && hasNote && (
                        <span
                          className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-white flex items-center justify-center border border-gray-100"
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                        </span>
                      )}
                    </button>

                    {/* Label */}
                    <p
                      className="text-[10px] text-center mt-2 leading-tight font-medium px-1 select-none"
                      style={{ color: isFuture ? '#d1d5db' : isCurrent ? color : '#6b7280' }}
                    >
                      {label}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Terminal badges */}
        {(isHired || isRejected) && (
          <div className="mt-2 flex justify-end">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                isHired ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {isHired ? 'Hired' : 'Rejected'}
            </span>
          </div>
        )}
      </div>

      {/* ── Tooltip (portal via fixed) ────────────────────────────────────── */}
      {renderTooltip()}

      {/* ── Add Note Form ─────────────────────────────────────────────────── */}
      <form onSubmit={handleSubmit} className="space-y-2">
        <textarea
          className="input resize-none"
          rows={3}
          placeholder="Add a note about this candidate..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <div className="flex justify-end">
          <button
            type="submit"
            className="btn-primary text-xs"
            disabled={addNote.isPending || !content.trim()}
          >
            <Plus className="w-3.5 h-3.5" />
            {addNote.isPending ? 'Adding...' : 'Add Note'}
          </button>
        </div>
      </form>

      {/* ── Activity History ──────────────────────────────────────────────── */}
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
          Activity History
        </h3>

        {sortedNotes.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No activity yet</p>
          </div>
        ) : (
          <div className="relative">
            {/* Vertical connector */}
            <div className="absolute left-[15px] top-0 bottom-4 w-0.5 bg-gray-100 z-0" />

            <div className="space-y-4">
              {sortedNotes.map((note) => {
                const isStage = note.isStageNote
                const stageAtTime = note.stageAtTime as Stage | undefined
                const color = isStage && stageAtTime ? stageColor(stageAtTime) : undefined
                const stageLabel = isStage && stageAtTime ? STAGE_CONFIG[stageAtTime]?.label : null
                const stageBg = isStage && stageAtTime ? STAGE_CONFIG[stageAtTime]?.bgColor : null
                const stageText = isStage && stageAtTime ? STAGE_CONFIG[stageAtTime]?.textColor : null
                const isHighlighted = highlightedNoteId === note.id

                return (
                  <div
                    key={note.id}
                    className="relative flex gap-4"
                    ref={(el) => {
                      if (el) noteRefs.current.set(note.id, el)
                      else noteRefs.current.delete(note.id)
                    }}
                  >
                    {/* Timeline dot */}
                    <div className="relative z-10 shrink-0 mt-1">
                      {isStage && color ? (
                        <div
                          className="w-[30px] h-[30px] rounded-full flex items-center justify-center shadow-sm border-2 border-white"
                          style={{ backgroundColor: color }}
                        >
                          <ArrowRight className="w-3 h-3 text-white" />
                        </div>
                      ) : (
                        <div className="w-[30px] h-[30px] rounded-full bg-gray-100 border-2 border-white shadow-sm flex items-center justify-center">
                          <MessageSquare className="w-3 h-3 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Event card */}
                    <div className="flex-1 min-w-0">
                      <div
                        className={`rounded-xl border shadow-sm overflow-hidden transition-all duration-500 ${
                          isHighlighted
                            ? 'border-transparent'
                            : isStage
                            ? 'bg-white border-gray-100'
                            : 'bg-gray-50 border-gray-100'
                        } ${isStage ? 'bg-white' : 'bg-gray-50'}`}
                        style={
                          isHighlighted
                            ? {
                                outline: `2px solid ${color ?? '#6366f1'}`,
                                outlineOffset: '2px',
                                boxShadow: `0 0 0 4px ${color ?? '#6366f1'}18`,
                              }
                            : undefined
                        }
                      >
                        {/* Card header */}
                        <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-b border-gray-50">
                          <div className="flex items-center gap-2">
                            {isStage && stageLabel ? (
                              <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${stageBg} ${stageText}`}>
                                <ArrowRight className="w-2.5 h-2.5" />
                                {stageLabel}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-400">
                                <User className="w-3 h-3" />
                                Note
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-gray-400 shrink-0">
                            {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}
                          </span>
                        </div>

                        {/* Note body */}
                        <div className="px-4 py-3">
                          <p className="text-sm text-gray-700 leading-relaxed">{note.content}</p>
                        </div>

                        {/* Author footer */}
                        <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border-t border-gray-100">
                          <div
                            className="w-5 h-5 rounded-full flex items-center justify-center text-white shrink-0"
                            style={{ backgroundColor: color ?? '#6b7280', fontSize: '9px', fontWeight: 700 }}
                          >
                            {initials(note.author.fullName)}
                          </div>
                          <span className="text-xs font-medium text-gray-600">{note.author.fullName}</span>
                          <span className="text-xs text-gray-300">·</span>
                          <span className="text-xs text-gray-400">
                            {format(new Date(note.createdAt), 'MMM d, yyyy · h:mm a')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
