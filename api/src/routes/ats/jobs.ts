import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import { authenticate, requireRole, JwtPayload } from '../../plugins/auth'
import { writeAuditLog } from '../../services/audit'

const prisma = new PrismaClient()

const createJobSchema = z.object({
  title: z.string().min(1),
  department: z.string().optional(),
  locationCity: z.string().optional(),
  locationState: z.string().optional(),
  isRemote: z.boolean().optional().default(false),
  jobType: z.enum(['full_time', 'contract', 'c2c', 'w2']).optional().default('full_time'),
  visaSponsorship: z.boolean().optional().default(true),
  internalNotes: z.string().optional(),
  salaryMin: z.number().int().optional(),
  salaryMax: z.number().int().optional(),
  publicTitle: z.string().optional(),
  publicDescription: z.string().min(1),
  prerequisites: z.string().optional(),
  responsibilities: z.string().optional(),
  showSalary: z.boolean().optional().default(false),
  isPublished: z.boolean().optional().default(false),
  status: z.enum(['open', 'on_hold', 'closed']).optional().default('open'),
  assignedRecruiterId: z.string().optional(),
})

export default async function atsJobRoutes(app: FastifyInstance) {
  // GET /api/ats/jobs
  app.get(
    '/',
    { preHandler: authenticate },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const query = request.query as {
        status?: string
        search?: string
        recruiterId?: string
      }

      const where: any = {}
      if (query.status) where.status = query.status
      if (query.recruiterId) where.assignedRecruiterId = query.recruiterId
      if (query.search) {
        where.OR = [
          { title: { contains: query.search } },
          { department: { contains: query.search } },
        ]
      }

      const jobs = await prisma.job.findMany({
        where,
        include: {
          createdBy: { select: { id: true, fullName: true, email: true } },
          assignedRecruiter: { select: { id: true, fullName: true, email: true } },
          _count: { select: { applications: true } },
          applications: {
            select: { stage: true, isProcessed: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      })

      const result = jobs.map((job) => {
        const stageCounts: Record<string, number> = {}
        for (const app of job.applications) {
          stageCounts[app.stage] = (stageCounts[app.stage] || 0) + 1
        }
        return {
          id: job.id,
          title: job.title,
          publicTitle: job.publicTitle,
          department: job.department,
          locationCity: job.locationCity,
          locationState: job.locationState,
          isRemote: job.isRemote,
          jobType: job.jobType,
          visaSponsorship: job.visaSponsorship,
          status: job.status,
          isPublished: job.isPublished,
          createdAt: job.createdAt,
          updatedAt: job.updatedAt,
          closedAt: job.closedAt,
          createdBy: job.createdBy,
          assignedRecruiter: job.assignedRecruiter,
          stats: {
            total: job._count.applications,
            unprocessed: job.applications.filter((a) => !a.isProcessed).length,
            processed: job.applications.filter((a) => a.isProcessed).length,
            hired: stageCounts['hired'] || 0,
            rejected: stageCounts['rejected'] || 0,
          },
          stageCounts,
        }
      })

      return reply.send(result)
    }
  )

  // POST /api/ats/jobs
  app.post(
    '/',
    { preHandler: requireRole(['admin', 'recruiter', 'hiring_manager']) },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = createJobSchema.safeParse(request.body)
      if (!parsed.success) {
        return reply.status(400).send({ error: 'Validation error', details: parsed.error.flatten() })
      }

      const user = (request as any).user as JwtPayload

      const job = await prisma.job.create({
        data: {
          ...parsed.data,
          createdById: user.userId,
        },
      })

      await writeAuditLog({
        entityType: 'job',
        entityId: job.id,
        action: 'created',
        newValue: { title: job.title, status: job.status },
        performedById: user.userId,
        ipAddress: request.ip,
      })

      return reply.status(201).send(job)
    }
  )

  // GET /api/ats/jobs/:id
  app.get(
    '/:id',
    { preHandler: authenticate },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string }
      const query = request.query as { tab?: string; stage?: string }

      const job = await prisma.job.findUnique({
        where: { id },
        include: {
          createdBy: { select: { id: true, fullName: true, email: true } },
          assignedRecruiter: { select: { id: true, fullName: true, email: true } },
        },
      })

      if (!job) return reply.status(404).send({ error: 'Job not found' })

      // Build applications query
      const appWhere: any = { jobId: id }
      if (query.tab === 'unprocessed') appWhere.isProcessed = false
      else if (query.tab === 'processed') appWhere.isProcessed = true
      if (query.stage) appWhere.stage = query.stage

      const applications = await prisma.application.findMany({
        where: appWhere,
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
            },
          },
          assignedRecruiter: { select: { id: true, fullName: true } },
          _count: { select: { notes: true, documents: true } },
        },
        orderBy: { appliedAt: 'desc' },
      })

      // Stage summary counts for the job
      const allApps = await prisma.application.findMany({
        where: { jobId: id },
        select: { stage: true, isProcessed: true },
      })

      const stageCounts: Record<string, number> = {}
      for (const app of allApps) {
        stageCounts[app.stage] = (stageCounts[app.stage] || 0) + 1
      }

      return reply.send({
        job,
        stats: {
          total: allApps.length,
          unprocessed: allApps.filter((a) => !a.isProcessed).length,
          processed: allApps.filter((a) => a.isProcessed).length,
          hired: stageCounts['hired'] || 0,
          rejected: stageCounts['rejected'] || 0,
          stageCounts,
        },
        applications,
      })
    }
  )

  // PUT /api/ats/jobs/:id
  app.put(
    '/:id',
    { preHandler: requireRole(['admin', 'recruiter', 'hiring_manager']) },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string }
      const parsed = createJobSchema.partial().safeParse(request.body)
      if (!parsed.success) {
        return reply.status(400).send({ error: 'Validation error', details: parsed.error.flatten() })
      }

      const user = (request as any).user as JwtPayload

      const existing = await prisma.job.findUnique({ where: { id } })
      if (!existing) return reply.status(404).send({ error: 'Job not found' })

      const job = await prisma.job.update({
        where: { id },
        data: parsed.data,
      })

      await writeAuditLog({
        entityType: 'job',
        entityId: id,
        action: 'updated',
        oldValue: { title: existing.title, status: existing.status },
        newValue: { title: job.title, status: job.status },
        performedById: user.userId,
      })

      return reply.send(job)
    }
  )

  // PATCH /api/ats/jobs/:id/status
  app.patch(
    '/:id/status',
    { preHandler: requireRole(['admin', 'recruiter', 'hiring_manager']) },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string }
      const { status } = request.body as { status: string }

      if (!['open', 'on_hold', 'closed'].includes(status)) {
        return reply.status(400).send({ error: 'Invalid status' })
      }

      const user = (request as any).user as JwtPayload

      const job = await prisma.job.update({
        where: { id },
        data: {
          status,
          closedAt: status === 'closed' ? new Date() : null,
        },
      })

      await writeAuditLog({
        entityType: 'job',
        entityId: id,
        action: 'status_changed',
        newValue: { status },
        performedById: user.userId,
      })

      return reply.send(job)
    }
  )

  // DELETE /api/ats/jobs/:id
  app.delete(
    '/:id',
    { preHandler: requireRole(['admin']) },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string }

      await prisma.job.delete({ where: { id } })

      return reply.send({ message: 'Job deleted' })
    }
  )
}
