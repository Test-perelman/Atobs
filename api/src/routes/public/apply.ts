import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { PrismaClient } from '@prisma/client'
import { saveFile, validateMimeType } from '../../services/storage'
import { writeAuditLog } from '../../services/audit'

const prisma = new PrismaClient()

export default async function applyRoute(app: FastifyInstance) {
  // POST /api/jobs/:id/apply
  app.post('/:id/apply', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id: jobId } = request.params as { id: string }

    // Verify job exists and is open
    const job = await prisma.job.findFirst({
      where: { id: jobId, isPublished: true, status: 'open' },
    })
    if (!job) {
      return reply.status(404).send({ error: 'Job not found or no longer accepting applications' })
    }

    // Parse multipart form
    const parts = request.parts()
    const fields: Record<string, string> = {}
    const uploadedFiles: Array<{
      fieldname: string
      storagePath: string
      originalFilename: string
      fileSizeBytes: number
      mimeType: string
    }> = []

    // We need the candidateId before saving files, so collect fields first
    const fileParts: any[] = []

    for await (const part of parts) {
      if (part.type === 'field') {
        fields[part.fieldname] = part.value as string
      } else if (part.type === 'file') {
        fileParts.push(part)
      }
    }

    // Validate required fields
    const required = ['firstName', 'lastName', 'email']
    for (const field of required) {
      if (!fields[field]) {
        return reply.status(400).send({ error: `Missing required field: ${field}` })
      }
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(fields.email)) {
      return reply.status(400).send({ error: 'Invalid email address' })
    }

    // Check for duplicate application
    const existingCandidate = await prisma.candidate.findFirst({
      where: { email: fields.email },
    })

    if (existingCandidate) {
      const existing = await prisma.application.findUnique({
        where: {
          jobId_candidateId: { jobId, candidateId: existingCandidate.id },
        },
      })
      if (existing) {
        return reply.status(409).send({ error: 'You have already applied for this position' })
      }
    }

    // Create or reuse candidate record
    let candidate = existingCandidate
    if (!candidate) {
      candidate = await prisma.candidate.create({
        data: {
          firstName: fields.firstName,
          lastName: fields.lastName,
          email: fields.email,
          phone: fields.phone || null,
          locationCity: fields.locationCity || null,
          locationState: fields.locationState || null,
          linkedinUrl: fields.linkedinUrl || null,
          visaStatus: fields.visaStatus || null,
          currentEmployer: fields.currentEmployer || null,
          experienceYears: fields.experienceYears ? parseInt(fields.experienceYears) : null,
          salaryExpectation: fields.salaryExpectation ? parseInt(fields.salaryExpectation) : null,
          skills: fields.skills || null,
          source: 'job_board',
        },
      })
    } else {
      // Update candidate with new info
      const existing = existingCandidate!
      candidate = await prisma.candidate.update({
        where: { id: existing.id },
        data: {
          phone: fields.phone || existing.phone,
          locationCity: fields.locationCity || existing.locationCity,
          locationState: fields.locationState || existing.locationState,
          linkedinUrl: fields.linkedinUrl || existing.linkedinUrl,
          visaStatus: fields.visaStatus || existing.visaStatus,
          currentEmployer: fields.currentEmployer || existing.currentEmployer,
          experienceYears: fields.experienceYears
            ? parseInt(fields.experienceYears)
            : existing.experienceYears,
          salaryExpectation: fields.salaryExpectation
            ? parseInt(fields.salaryExpectation)
            : existing.salaryExpectation,
          skills: fields.skills || existing.skills,
        },
      })
    }

    // Save uploaded files
    for (const filePart of fileParts) {
      if (!validateMimeType(filePart.mimetype)) {
        // Drain the stream
        filePart.file.resume()
        continue
      }

      const saved = await saveFile(filePart, candidate.id)
      uploadedFiles.push({
        fieldname: filePart.fieldname,
        storagePath: saved.storagePath,
        originalFilename: filePart.filename,
        fileSizeBytes: saved.fileSizeBytes,
        mimeType: saved.mimeType,
      })
    }

    // Create application
    const application = await prisma.application.create({
      data: {
        jobId,
        candidateId: candidate.id,
        stage: 'resume_received',
        isProcessed: false,
        assignedRecruiterId: job.assignedRecruiterId,
      },
    })

    // Save document records
    for (const file of uploadedFiles) {
      const docType = file.fieldname === 'resume'
        ? 'resume'
        : file.fieldname === 'passport'
        ? 'passport'
        : file.fieldname === 'visa'
        ? 'visa_stamp'
        : file.fieldname === 'ead'
        ? 'ead'
        : 'other'

      await prisma.document.create({
        data: {
          candidateId: candidate.id,
          applicationId: application.id,
          docType,
          originalFilename: file.originalFilename,
          storagePath: file.storagePath,
          fileSizeBytes: file.fileSizeBytes,
          mimeType: file.mimeType,
        },
      })
    }

    // Audit log
    await writeAuditLog({
      entityType: 'application',
      entityId: application.id,
      action: 'created',
      newValue: {
        jobId,
        candidateId: candidate.id,
        source: 'job_board',
        stage: 'resume_received',
      },
      ipAddress: request.ip,
    })

    return reply.status(201).send({
      message: 'Application submitted successfully',
      applicationId: application.id,
    })
  })
}
