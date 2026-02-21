import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { PrismaClient } from '@prisma/client'
import { authenticate, requireRole, JwtPayload } from '../../plugins/auth'
import { saveFile, validateMimeType, createReadStream, fileExists, deleteFile } from '../../services/storage'
import path from 'path'

const prisma = new PrismaClient()

const DOC_TYPES = ['resume', 'passport', 'visa_stamp', 'i797', 'i94', 'ead', 'lca', 'offer_letter', 'other']

export default async function atsDocumentsRoutes(app: FastifyInstance) {
  // POST /api/ats/applications/:id/documents
  app.post(
    '/applications/:id/documents',
    { preHandler: requireRole(['admin', 'recruiter', 'hiring_manager']) },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string }
      const user = (request as any).user as JwtPayload

      const application = await prisma.application.findUnique({
        where: { id },
        select: { candidateId: true },
      })
      if (!application) return reply.status(404).send({ error: 'Application not found' })

      const parts = request.parts()
      let docType = 'other'
      let filePart: any = null

      for await (const part of parts) {
        if (part.type === 'field' && part.fieldname === 'docType') {
          docType = DOC_TYPES.includes(part.value as string) ? (part.value as string) : 'other'
        } else if (part.type === 'file') {
          filePart = part
          break // process after collecting fields
        }
      }

      if (!filePart) {
        return reply.status(400).send({ error: 'No file uploaded' })
      }

      if (!validateMimeType(filePart.mimetype)) {
        filePart.file.resume()
        return reply.status(400).send({
          error: 'File type not allowed. Accepted: PDF, DOC, DOCX, JPG, PNG',
        })
      }

      const saved = await saveFile(filePart, application.candidateId)

      const document = await prisma.document.create({
        data: {
          candidateId: application.candidateId,
          applicationId: id,
          docType,
          originalFilename: filePart.filename,
          storagePath: saved.storagePath,
          fileSizeBytes: saved.fileSizeBytes,
          mimeType: saved.mimeType,
          uploadedById: user.userId,
        },
        include: { uploadedBy: { select: { id: true, fullName: true } } },
      })

      return reply.status(201).send(document)
    }
  )

  // GET /api/ats/documents/:docId/download
  app.get(
    '/documents/:docId/download',
    { preHandler: authenticate },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { docId } = request.params as { docId: string }

      const document = await prisma.document.findUnique({ where: { id: docId } })
      if (!document) return reply.status(404).send({ error: 'Document not found' })

      if (!fileExists(document.storagePath)) {
        return reply.status(404).send({ error: 'File not found on storage' })
      }

      const ext = path.extname(document.originalFilename)
      const safeFilename = encodeURIComponent(document.originalFilename)

      reply.header('Content-Disposition', `attachment; filename="${safeFilename}"`)
      reply.header('Content-Type', document.mimeType || 'application/octet-stream')

      const stream = createReadStream(document.storagePath)
      return reply.send(stream)
    }
  )

  // DELETE /api/ats/documents/:docId
  app.delete(
    '/documents/:docId',
    { preHandler: requireRole(['admin', 'recruiter']) },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { docId } = request.params as { docId: string }
      const user = (request as any).user as JwtPayload

      const document = await prisma.document.findUnique({ where: { id: docId } })
      if (!document) return reply.status(404).send({ error: 'Document not found' })

      // Only uploader or admin can delete
      if (user.role !== 'admin' && document.uploadedById !== user.userId) {
        return reply.status(403).send({ error: 'Not authorized to delete this document' })
      }

      deleteFile(document.storagePath)
      await prisma.document.delete({ where: { id: docId } })

      return reply.send({ message: 'Document deleted' })
    }
  )
}
