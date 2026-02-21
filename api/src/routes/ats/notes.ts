import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { PrismaClient } from '@prisma/client'
import { authenticate, JwtPayload } from '../../plugins/auth'

const prisma = new PrismaClient()

export default async function atsNotesRoutes(app: FastifyInstance) {
  // GET /api/ats/applications/:id/notes
  app.get(
    '/:id/notes',
    { preHandler: authenticate },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string }

      const notes = await prisma.note.findMany({
        where: { applicationId: id },
        include: { author: { select: { id: true, fullName: true, role: true } } },
        orderBy: { createdAt: 'desc' },
      })

      return reply.send(notes)
    }
  )

  // POST /api/ats/applications/:id/notes
  app.post(
    '/:id/notes',
    { preHandler: authenticate },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string }
      const { content } = request.body as { content: string }

      if (!content || content.trim().length === 0) {
        return reply.status(400).send({ error: 'Note content is required' })
      }

      const user = (request as any).user as JwtPayload

      // Get current stage
      const application = await prisma.application.findUnique({
        where: { id },
        select: { stage: true },
      })
      if (!application) return reply.status(404).send({ error: 'Application not found' })

      const note = await prisma.note.create({
        data: {
          applicationId: id,
          authorId: user.userId,
          content: content.trim(),
          stageAtTime: application.stage,
          isStageNote: false,
        },
        include: { author: { select: { id: true, fullName: true, role: true } } },
      })

      return reply.status(201).send(note)
    }
  )
}
