import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function publicJobRoutes(app: FastifyInstance) {
  // GET /api/jobs — list published open jobs
  app.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const query = request.query as {
      location?: string
      jobType?: string
      visa?: string
      search?: string
    }

    const where: any = {
      isPublished: true,
      status: 'open',
    }

    if (query.location) {
      where.OR = [
        { locationCity: { contains: query.location } },
        { locationState: { contains: query.location } },
      ]
    }
    if (query.jobType) where.jobType = query.jobType
    if (query.visa === 'sponsored') where.visaSponsorship = true
    if (query.search) {
      where.OR = [
        ...(where.OR || []),
        { publicTitle: { contains: query.search } },
        { publicDescription: { contains: query.search } },
        { prerequisites: { contains: query.search } },
      ]
    }

    const jobs = await prisma.job.findMany({
      where,
      select: {
        id: true,
        publicTitle: true,
        title: true,
        department: true,
        locationCity: true,
        locationState: true,
        isRemote: true,
        jobType: true,
        visaSponsorship: true,
        showSalary: true,
        salaryMin: true,
        salaryMax: true,
        createdAt: true,
        _count: { select: { applications: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const sanitized = jobs.map((j) => ({
      id: j.id,
      title: j.publicTitle || j.title,
      department: j.department,
      locationCity: j.locationCity,
      locationState: j.locationState,
      isRemote: j.isRemote,
      jobType: j.jobType,
      visaSponsorship: j.visaSponsorship,
      salary: j.showSalary
        ? { min: j.salaryMin, max: j.salaryMax }
        : null,
      createdAt: j.createdAt,
    }))

    return reply.send(sanitized)
  })

  // GET /api/jobs/:id — job detail (public fields only)
  app.get('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string }

    const job = await prisma.job.findFirst({
      where: { id, isPublished: true, status: 'open' },
      select: {
        id: true,
        publicTitle: true,
        title: true,
        department: true,
        locationCity: true,
        locationState: true,
        isRemote: true,
        jobType: true,
        visaSponsorship: true,
        publicDescription: true,
        prerequisites: true,
        responsibilities: true,
        showSalary: true,
        salaryMin: true,
        salaryMax: true,
        createdAt: true,
      },
    })

    if (!job) {
      return reply.status(404).send({ error: 'Job not found' })
    }

    return reply.send({
      id: job.id,
      title: job.publicTitle || job.title,
      department: job.department,
      locationCity: job.locationCity,
      locationState: job.locationState,
      isRemote: job.isRemote,
      jobType: job.jobType,
      visaSponsorship: job.visaSponsorship,
      description: job.publicDescription,
      prerequisites: job.prerequisites,
      responsibilities: job.responsibilities,
      salary: job.showSalary
        ? { min: job.salaryMin, max: job.salaryMax }
        : null,
      createdAt: job.createdAt,
    })
  })
}
