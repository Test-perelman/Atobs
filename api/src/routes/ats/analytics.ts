import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { PrismaClient } from '@prisma/client'
import { authenticate } from '../../plugins/auth'

const prisma = new PrismaClient()

export default async function atsAnalyticsRoutes(app: FastifyInstance) {
  // GET /api/ats/analytics/overview
  app.get(
    '/overview',
    { preHandler: authenticate },
    async (_request: FastifyRequest, reply: FastifyReply) => {
      const [totalJobs, openJobs, totalCandidates, totalApplications, applications] =
        await Promise.all([
          prisma.job.count(),
          prisma.job.count({ where: { status: 'open' } }),
          prisma.candidate.count(),
          prisma.application.count(),
          prisma.application.findMany({
            select: { stage: true, isProcessed: true, appliedAt: true },
          }),
        ])

      const stageCounts: Record<string, number> = {}
      for (const app of applications) {
        stageCounts[app.stage] = (stageCounts[app.stage] || 0) + 1
      }

      // Applications this month
      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const thisMonth = applications.filter((a) => new Date(a.appliedAt) >= monthStart).length

      return reply.send({
        totalJobs,
        openJobs,
        onHoldJobs: await prisma.job.count({ where: { status: 'on_hold' } }),
        closedJobs: await prisma.job.count({ where: { status: 'closed' } }),
        totalCandidates,
        totalApplications,
        unprocessed: applications.filter((a) => !a.isProcessed).length,
        processed: applications.filter((a) => a.isProcessed).length,
        hired: stageCounts['hired'] || 0,
        rejected: stageCounts['rejected'] || 0,
        thisMonth,
        stageCounts,
      })
    }
  )

  // GET /api/ats/analytics/jobs/:id
  app.get(
    '/jobs/:id',
    { preHandler: authenticate },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string }

      const job = await prisma.job.findUnique({
        where: { id },
        select: { id: true, title: true, status: true, createdAt: true },
      })
      if (!job) return reply.status(404).send({ error: 'Job not found' })

      const applications = await prisma.application.findMany({
        where: { jobId: id },
        select: {
          stage: true,
          isProcessed: true,
          appliedAt: true,
          candidate: { select: { visaStatus: true, locationState: true } },
        },
      })

      const stageCounts: Record<string, number> = {}
      const visaCounts: Record<string, number> = {}
      const locationCounts: Record<string, number> = {}

      for (const app of applications) {
        stageCounts[app.stage] = (stageCounts[app.stage] || 0) + 1
        if (app.candidate.visaStatus) {
          visaCounts[app.candidate.visaStatus] = (visaCounts[app.candidate.visaStatus] || 0) + 1
        }
        if (app.candidate.locationState) {
          locationCounts[app.candidate.locationState] =
            (locationCounts[app.candidate.locationState] || 0) + 1
        }
      }

      return reply.send({
        job,
        stats: {
          total: applications.length,
          unprocessed: applications.filter((a) => !a.isProcessed).length,
          processed: applications.filter((a) => a.isProcessed).length,
          hired: stageCounts['hired'] || 0,
          rejected: stageCounts['rejected'] || 0,
        },
        stageCounts,
        visaCounts,
        locationCounts,
      })
    }
  )
}
