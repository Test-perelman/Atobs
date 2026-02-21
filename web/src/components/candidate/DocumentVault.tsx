import { useState, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { FileText, Upload, Download, Trash2, File } from 'lucide-react'
import { Document, DocType } from '../../lib/types'
import api from '../../lib/api'
import { format } from 'date-fns'

const DOC_TYPE_LABELS: Record<DocType, string> = {
  resume: 'Resume',
  passport: 'Passport',
  visa_stamp: 'Visa Stamp',
  i797: 'I-797',
  i94: 'I-94',
  ead: 'EAD',
  lca: 'LCA',
  offer_letter: 'Offer Letter',
  other: 'Other',
}

const DOC_TYPE_COLORS: Record<string, string> = {
  resume:       'bg-blue-50 text-blue-700',
  passport:     'bg-purple-50 text-purple-700',
  visa_stamp:   'bg-amber-50 text-amber-700',
  i797:         'bg-green-50 text-green-700',
  i94:          'bg-teal-50 text-teal-700',
  ead:          'bg-orange-50 text-orange-700',
  lca:          'bg-red-50 text-red-700',
  offer_letter: 'bg-indigo-50 text-indigo-700',
  other:        'bg-gray-50 text-gray-700',
}

function formatBytes(bytes?: number): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

interface Props {
  applicationId: string
  documents: Document[]
}

export default function DocumentVault({ applicationId, documents }: Props) {
  const [docType, setDocType] = useState<DocType>('resume')
  const fileRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()

  const uploadMutation = useMutation({
    mutationFn: (formData: FormData) =>
      api.post(`/ats/applications/${applicationId}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['application', applicationId] })
      if (fileRef.current) fileRef.current.value = ''
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (docId: string) => api.delete(`/ats/documents/${docId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['application', applicationId] })
    },
  })

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const formData = new FormData()
    formData.append('file', file)
    formData.append('docType', docType)
    uploadMutation.mutate(formData)
  }

  const handleDownload = (docId: string, filename: string) => {
    const link = document.createElement('a')
    link.href = `/api/ats/documents/${docId}/download`
    link.download = filename
    // Need auth token in download link
    api.get(`/ats/documents/${docId}/download`, { responseType: 'blob' }).then((res) => {
      const url = URL.createObjectURL(res.data)
      link.href = url
      link.click()
      URL.revokeObjectURL(url)
    })
  }

  return (
    <div className="space-y-4">
      {/* Upload */}
      <div className="flex items-center gap-3">
        <select
          className="input w-40"
          value={docType}
          onChange={(e) => setDocType(e.target.value as DocType)}
        >
          {Object.entries(DOC_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => fileRef.current?.click()}
          disabled={uploadMutation.isPending}
        >
          <Upload className="w-4 h-4" />
          {uploadMutation.isPending ? 'Uploading...' : 'Upload File'}
        </button>
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          onChange={handleUpload}
        />
      </div>

      {/* Documents list */}
      {documents.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <File className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No documents uploaded yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50/50"
            >
              <FileText className="w-5 h-5 text-gray-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-800 truncate">
                    {doc.originalFilename}
                  </span>
                  <span
                    className={`badge ${DOC_TYPE_COLORS[doc.docType] || DOC_TYPE_COLORS.other}`}
                  >
                    {DOC_TYPE_LABELS[doc.docType as DocType] || doc.docType}
                  </span>
                </div>
                <div className="text-xs text-gray-400 mt-0.5 flex gap-3">
                  {doc.fileSizeBytes && <span>{formatBytes(doc.fileSizeBytes)}</span>}
                  <span>{format(new Date(doc.uploadedAt), 'MMM d, yyyy')}</span>
                  {doc.uploadedBy && <span>by {doc.uploadedBy.fullName}</span>}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => handleDownload(doc.id, doc.originalFilename)}
                  className="p-1.5 text-gray-400 hover:text-brand-600 transition-colors"
                  title="Download"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteMutation.mutate(doc.id)}
                  className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                  title="Delete"
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
