import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import { authenticate, requireRole, JwtPayload } from '../../plugins/auth'
import { writeAuditLog } from '../../services/audit'

const prisma = new PrismaClient()

const VALID_STAGES = [
  'resume_received', 'screened', 'vetted', 'interview_scheduled',
  'interview_completed', 'client_submitted', 'client_interview',
  'offer_awaiting', 'offer_released', 'h1b_filed', 'rejected', 'hired',
]

export default async function atsApplicationRoutes(app: FastifyInstance) {
  // GET /api/ats/applications
  app.get(
    '/',
    { preHandler: authenticate },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const query = request.query as {
        stage?: string
        recruiterId?: string
        visaStatus?: string
        search?: string
        jobId?: string
        page?: string
        limit?: string
      }

      const page = parseInt(query.page || '1')
      const limit = parseInt(query.limit || '20')
      const skip = (page - 1) * limit

      const where: any = {}
      if (query.stage) where.stage = query.stage
      if (query.recruiterId) where.assignedRecruiterId = query.recruiterId
      if (query.jobId) where.jobId = query.jobId
      if (query.visaStatus) {
        where.candidate = { visaStatus: query.visaStatus }
      }
      if (query.search) {
        where.candidate = {
          ...(where.candidate || {}),
          OR: [
            { firstName: { contains: query.search } },
            { lastName: { contains: query.search } },
            { email: { contains: query.search } },
            { currentEmployer: { contains: query.search } },
          ],
        }
      }

      const [total, applications] = await Promise.all([
        prisma.application.count({ where }),
        prisma.application.findMany({
          where,
          skip,
          take: limit,
          include: {
            candidate: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                locationCity: true,
                locationState: true,
                visaStatus: true,
                experienceYears: true,
                skills: true,
                currentEmployer: true,
              },
            },
            job: { select: { id: true, title: true } },
            assignedRecruiter: { select: { id: true, fullName: true } },
            _count: { select: { notes: true, documents: true } },
          },
          orderBy: { appliedAt: 'desc' },
        }),
      ])

      return reply.send({
        data: applications,
        pagination: { total, page, limit, pages: Math.ceil(total / limit) },
      })
    }
  )

  // GET /api/ats/applications/:id
  app.get(
    '/:id',
    { preHandler: authenticate },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string }

      const application = await prisma.application.findUnique({
        where: { id },
        include: {
          candidate: true,
          job: {
            select: {
              id: true,
              title: true,
              locationCity: true,
              locationState: true,
              jobType: true,
              status: true,
            },
          },
          assignedRecruiter: { select: { id: true, fullName: true, email: true } },
          notes: {
            include: { author: { select: { id: true, fullName: true } } },
            orderBy: { createdAt: 'desc' },
          },
          documents: {
            include: { uploadedBy: { select: { id: true, fullName: true } } },
            orderBy: { uploadedAt: 'desc' },
          },
        },
      })

      if (!application) return reply.status(404).send({ error: 'Application not found' })

      // Recent audit logs for this application
      const auditLogs = await prisma.auditLog.findMany({
        where: { entityType: 'application', entityId: id },
        include: { performedBy: { select: { fullName: true } } },
        orderBy: { createdAt: 'desc' },
        take: 20,
      })

      return reply.send({ ...application, auditLogs })
    }
  )

  // PATCH /api/ats/applications/:id/stage
  app.patch(
    '/:id/stage',
    { preHandler: requireRole(['admin', 'recruiter', 'hiring_manager']) },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string }
      const { stage, noteContent } = request.body as {
        stage: string
        noteContent: string
      }

      if (!VALID_STAGES.includes(stage)) {
        return reply.status(400).send({ error: 'Invalid stage' })
      }
      if (!noteContent || noteContent.trim().length === 0) {
        return reply.status(400).send({ error: 'A note is required when changing stage' })
      }

      const user = (request as any).user as JwtPayload

      const existing = await prisma.application.findUnique({ where: { id } })
      if (!existing) return reply.status(404).send({ error: 'Application not found' })

      // Update stage + mark as processed (any stage change makes it processed)
      const application = await prisma.application.update({
        where: { id },
        data: {
          stage,
          isProcessed: true,
          rejectionReason: stage === 'rejected'
            ? (request.body as any).rejectionReason || null
            : existing.rejectionReason,
        },
      })

      // Create mandatory stage-change note
      await prisma.note.create({
        data: {
          applicationId: id,
          authorId: user.userId,
          content: noteContent.trim(),
          stageAtTime: existing.stage,
          isStageNote: true,
        },
      })

      // Audit log
      await writeAuditLog({
        entityType: 'application',
        entityId: id,
        action: 'stage_changed',
        oldValue: { stage: existing.stage },
        newValue: { stage },
        performedById: user.userId,
        ipAddress: request.ip,
      })

      return reply.send(application)
    }
  )

  // PATCH /api/ats/applications/:id/assign
  app.patch(
    '/:id/assign',
    { preHandler: requireRole(['admin', 'recruiter', 'hiring_manager']) },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string }
      const { recruiterId } = request.body as { recruiterId: string | null }

      const user = (request as any).user as JwtPayload

      const application = await prisma.application.update({
        where: { id },
        data: { assignedRecruiterId: recruiterId },
        include: {
          assignedRecruiter: { select: { id: true, fullName: true } },
        },
      })

      await writeAuditLog({
        entityType: 'application',
        entityId: id,
        action: 'recruiter_assigned',
        newValue: { recruiterId },
        performedById: user.userId,
      })

      return reply.send(application)
    }
  )

  // PATCH /api/ats/applications/:id/reject
  app.patch(
    '/:id/reject',
    { preHandler: requireRole(['admin', 'recruiter', 'hiring_manager']) },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string }
      const { reason, noteContent } = request.body as {
        reason: string
        noteContent: string
      }

      if (!reason) return reply.status(400).send({ error: 'Rejection reason is required' })
      if (!noteContent) return reply.status(400).send({ error: 'Note is required' })

      const user = (request as any).user as JwtPayload

      const existing = await prisma.application.findUnique({ where: { id } })
      if (!existing) return reply.status(404).send({ error: 'Application not found' })

      const application = await prisma.application.update({
        where: { id },
        data: { stage: 'rejected', isProcessed: true, rejectionReason: reason },
      })

      await prisma.note.create({
        data: {
          applicationId: id,
          authorId: user.userId,
          content: noteContent.trim(),
          stageAtTime: existing.stage,
          isStageNote: true,
        },
      })

      await writeAuditLog({
        entityType: 'application',
        entityId: id,
        action: 'rejected',
        oldValue: { stage: existing.stage },
        newValue: { stage: 'rejected', reason },
        performedById: user.userId,
      })

      return reply.send(application)
    }
  )

  // PATCH /api/ats/applications/:id/process
  app.patch(
    '/:id/process',
    { preHandler: requireRole(['admin', 'recruiter', 'hiring_manager']) },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string }

      const application = await prisma.application.update({
        where: { id },
        data: { isProcessed: true },
      })

      return reply.send(application)
    }
  )
}
